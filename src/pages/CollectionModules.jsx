import { useState, useEffect, useCallback, useRef } from 'react';
import { FaSave, FaCheckCircle, FaDumbbell, FaList, FaThLarge } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import SortableDataTable from '../components/SortableDataTable';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

function CollectionModules() {
  const [collections, setCollections] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedModules, setSelectedModules] = useState([]); // Array of module objects with id, title, etc.
  const [loading, setLoading] = useState(true);
  const [modLoading, setModLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Collections pagination state
  const [collCursor, setCollCursor] = useState(null);
  const [collHasMore, setCollHasMore] = useState(true);
  const [collLoading, setCollLoading] = useState(false);
  const collLimit = 15;

  // Modules pagination state
  const [modCursor, setModCursor] = useState(null);
  const [modHasMore, setModHasMore] = useState(true);
  const modLimit = 15;

  const axiosPrivate = useAxiosPrivate();

  // Refs to avoid stale closures in intersection observers and prevent duplicate fetches
  const collCursorRef = useRef(null);
  const collLoadingRef = useRef(false);
  const collHasMoreRef = useRef(true);
  collCursorRef.current = collCursor;
  collLoadingRef.current = collLoading;
  collHasMoreRef.current = collHasMore;

  const modCursorRef = useRef(null);
  const modLoadingRef = useRef(false);
  const modHasMoreRef = useRef(true);
  modCursorRef.current = modCursor;
  modLoadingRef.current = modLoading;
  modHasMoreRef.current = modHasMore;

  const fetchCollections = useCallback(async (reset = false) => {
    if (collLoadingRef.current) return;
    if (!reset && (!collHasMoreRef.current || collCursorRef.current === null || collCursorRef.current === undefined)) {
      return;
    }

    try {
      setCollLoading(true);
      collLoadingRef.current = true;
      const cursor = reset ? null : collCursorRef.current;
      let url = `/api/v1/admin/collections?limit=${collLimit}`;
      if (cursor !== null && cursor !== undefined && cursor !== '') {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }

      const response = await axiosPrivate.get(url);
      if (response.data?.isSuccess) {
        const newData = response.data.data || [];
        setCollections(prev => {
          const combined = reset ? newData : [...prev, ...newData];
          return Array.from(new Map(combined.map(item => [item.id, item])).values());
        });
        const next = response.data?.nextCursor ?? null;
        const more = !!response.data?.hasMore && next !== null;
        setCollCursor(next);
        collCursorRef.current = next;
        setCollHasMore(more);
        collHasMoreRef.current = more;
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError('Failed to load collections');
    } finally {
      setCollLoading(false);
      collLoadingRef.current = false;
      setLoading(false);
    }
  }, [axiosPrivate]);

  const collObserver = useRef();
  const lastCollElementRef = useCallback(node => {
    if (collLoadingRef.current) return;
    if (collObserver.current) collObserver.current.disconnect();
    collObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && collHasMoreRef.current && !collLoadingRef.current && collCursorRef.current !== null) {
        fetchCollections(false);
      }
    });
    if (node) collObserver.current.observe(node);
  }, [fetchCollections]);

  const fetchModules = useCallback(async (reset = false) => {
    if (modLoadingRef.current) return;
    if (!reset && (!modHasMoreRef.current || modCursorRef.current === null || modCursorRef.current === undefined)) {
      return;
    }

    try {
      setModLoading(true);
      modLoadingRef.current = true;
      const cursor = reset ? null : modCursorRef.current;
      let url = `/api/v1/admin/modules?limit=${modLimit}`;
      if (cursor !== null && cursor !== undefined && cursor !== '') {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }

      const response = await axiosPrivate.get(url);
      if (response.data?.isSuccess) {
        const newData = response.data.data || [];
        const activeOnly = newData.filter(mod => mod.is_active === 1 || mod.is_active === true || mod.is_active === "1");
        
        setModules(prev => {
          const combined = reset ? activeOnly : [...prev, ...activeOnly];
          return Array.from(new Map(combined.map(item => [item.id, item])).values());
        });

        const next = response.data?.nextCursor ?? null;
        const more = !!response.data?.hasMore && next !== null;
        setModCursor(next);
        modCursorRef.current = next;
        setModHasMore(more);
        modHasMoreRef.current = more;

        // If all items in this page were inactive but more items exist, automatically fetch next
        if (more && activeOnly.length === 0 && newData.length > 0 && next !== null) {
          setTimeout(() => fetchModules(false), 50);
        }
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
    } finally {
      setModLoading(false);
      modLoadingRef.current = false;
    }
  }, [axiosPrivate]);

  const modObserver = useRef();
  const lastModElementRef = useCallback(node => {
    if (modLoadingRef.current) return;
    if (modObserver.current) modObserver.current.disconnect();
    modObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && modHasMoreRef.current && !modLoadingRef.current && modCursorRef.current !== null) {
        fetchModules(false);
      }
    });
    if (node) modObserver.current.observe(node);
  }, [fetchModules]);

  useEffect(() => {
    fetchCollections(true);
    fetchModules(true);
  }, [fetchCollections, fetchModules]);

  const fetchExistingMapping = useCallback(async (showLoading = true) => {
    if (!selectedCollection) {
      setSelectedModules([]);
      return;
    }
    try {
      if (showLoading) setLoading(true);
      const response = await axiosPrivate.get(`/api/v1/admin/collection-modules/${selectedCollection}`);
      if (response.data?.isSuccess) {
        const existing = response.data.data || [];
        setSelectedModules(existing.map(item => ({
          id: item.module_id,
          mapping_id: item.id,
          title: item.module_title || item.title || `Module ${item.module_id}`,
          position: item.position
        })).sort((a, b) => a.position - b.position));
      } else {
        setSelectedModules([]);
      }
    } catch (err) {
      console.error('Error fetching existing mapping:', err);
      setSelectedModules([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [selectedCollection, axiosPrivate]);

  useEffect(() => {
    fetchExistingMapping();
  }, [fetchExistingMapping]);

  const toggleModule = (mod) => {
    setSelectedModules(prev => {
      const exists = prev.find(item => String(item.id) === String(mod.id));
      if (exists) {
        return prev.filter(item => String(item.id) !== String(mod.id));
      } else {
        return [...prev, { id: mod.id, title: mod.title }];
      }
    });
  };

  const handleReorder = async (newData, movedId, oldIndex, newIndex) => {
    const movedItem = newData.find(item => item.id === movedId);
    setSelectedModules(newData);

    if (!movedItem?.mapping_id) {
      return; 
    }

    try {
      setLoading(true);
      const response = await axiosPrivate.put('/api/v1/admin/collection-modules/reorder', {
        id: movedItem.mapping_id,
        new_position: newIndex + 1
      });

      if (!response.data?.isSuccess) {
        setError('Failed to update order on server');
        await fetchExistingMapping(); 
      }
    } catch (err) {
      setError('Error reordering items');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCollection) {
      setError('Please select a Collection first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        module_ids: selectedModules.map(m => m.id)
      };

      const response = await axiosPrivate.put(`/api/v1/admin/collection-modules/${selectedCollection}`, payload);
      if (response.data?.isSuccess) {
        setSuccess('Collection items updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchExistingMapping();
      }
    } catch (err) {
      setError('Failed to save collection items');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Title', accessor: 'title', bold: true }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Collection Mapping</h1>
              <p className="text-gray-600 mt-1">Assign and reorder workouts/programs in your collections</p>
            </div>
          </div>

          {(error || success) && (
            <div className={`mb-6 p-4 rounded-lg border-l-4 ${error ? 'bg-red-50 border-red-500 text-red-700' : 'bg-emerald-50 border-emerald-500 text-emerald-700'}`}>
              <p className="font-medium">{error || success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Step 1: Select Collection */}
            <div className="lg:col-span-3">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs">1</span>
                  Select Collection
                </h3>
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                  {collections.map((coll, index) => {
                    const isLast = collections.length === index + 1;
                    return (
                      <button
                        key={coll.id}
                        ref={isLast ? lastCollElementRef : null}
                        onClick={() => setSelectedCollection(coll.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          String(selectedCollection) === String(coll.id)
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm ring-1 ring-emerald-500'
                            : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-emerald-300 hover:bg-white'
                        }`}
                      >
                        {coll.name}
                      </button>
                    );
                  })}

                  {collLoading && (
                    <div className="py-3 text-center">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent"></div>
                      <p className="text-xs text-gray-400 mt-1">Loading more collections...</p>
                    </div>
                  )}

                  {collHasMore && !collLoading && collCursor && (
                    <button
                      onClick={() => fetchCollections(false)}
                      className="w-full text-xs text-center py-2 text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer border border-dashed border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors mt-2"
                    >
                      Load More Collections
                    </button>
                  )}

                  {!collHasMore && collections.length > 0 && (
                    <p className="text-center text-[10px] text-gray-400 py-2 uppercase tracking-widest font-bold">All Collections Loaded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Select Modules */}
            <div className="lg:col-span-5">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                    <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs">2</span>
                    Available Content
                  </h3>
                  <button
                    onClick={handleSave}
                    disabled={loading || !selectedCollection}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition-all cursor-pointer text-sm font-bold disabled:opacity-50 shadow-sm active:scale-95"
                  >
                    <FaSave className="text-xs" />
                    <span>Save</span>
                  </button>
                </div>
                
                {loading && !modLoading && modules.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!selectedCollection && (
                      <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400 text-amber-700 text-sm font-medium rounded flex items-center gap-2">
                        <FaDumbbell className="text-amber-500" />
                        Select a collection first.
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 max-h-[calc(100vh-350px)] overflow-y-auto p-1 custom-scrollbar">
                      {modules.map((mod, index) => {
                        const isSelected = selectedModules.some(s => String(s.id) === String(mod.id));
                        const isLast = modules.length === index + 1;
                        
                        return (
                          <div 
                            key={mod.id}
                            ref={isLast ? lastModElementRef : null}
                            onClick={() => selectedCollection && toggleModule(mod)}
                            className={`p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                              !selectedCollection ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50' :
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' 
                                : 'border-gray-200 bg-white hover:border-emerald-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                              {isSelected && <FaCheckCircle className="text-[10px]" />}
                            </div>
                            <span className="text-sm line-clamp-1">{mod.title}</span>
                          </div>
                        );
                      })}
                      
                      {modLoading && (
                        <div className="py-4 text-center">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent"></div>
                          <p className="text-xs text-gray-400 mt-1">Loading more modules...</p>
                        </div>
                      )}

                      {modHasMore && !modLoading && modCursor && (
                        <button
                          onClick={() => fetchModules(false)}
                          className="w-full text-xs text-center py-2 text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer border border-dashed border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors mt-2"
                        >
                          Load More Modules
                        </button>
                      )}

                      {!modHasMore && modules.length > 0 && (
                        <p className="text-center text-[10px] text-gray-400 py-2 uppercase tracking-widest font-bold">All Modules Loaded</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Reorder Selected */}
            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs">3</span>
                  Current Order
                  {loading && <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent ml-2"></div>}
                </h3>

                {(selectedModules.length > 0 || (loading && selectedCollection)) ? (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500 italic">Drag the handles to reorder items in this collection.</p>
                    <SortableDataTable
                      columns={columns}
                      data={selectedModules}
                      onReorder={handleReorder}
                      onDelete={(item) => toggleModule(item)}
                      loading={loading}
                    />
                    <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                      <p className="text-sm font-bold text-gray-700">
                        Total: <span className="text-emerald-600">{selectedModules.length}</span>
                      </p>
                      <button 
                        onClick={() => setSelectedModules([])}
                        className="text-xs text-red-500 hover:text-red-700 font-bold"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-xl">
                    <FaList className="mx-auto text-gray-200 text-4xl mb-4" />
                    <p className="text-gray-400 text-sm">No items selected yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CollectionModules;
