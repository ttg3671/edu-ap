import { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlus, FaLayerGroup, FaCheckCircle, FaPlusCircle, FaTrash } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import SortableDataTable from '../components/SortableDataTable';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

function NavPillCollections() {
  const [navPills, setNavPills] = useState([]);
  const [collections, setCollections] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [selectedPill, setSelectedPill] = useState('');
  const [checkedIds, setCheckedIds] = useState([]); // Track selected checkboxes
  const [loading, setLoading] = useState(true);
  const [collLoading, setCollLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Collections infinite loading state
  const [collCursor, setCollCursor] = useState(null);
  const [collHasMore, setCollHasMore] = useState(true);
  const collLimit = 15;

  const axiosPrivate = useAxiosPrivate();

  const collCursorRef = useRef(null);
  const collLoadingRef = useRef(false);
  const collHasMoreRef = useRef(true);
  collCursorRef.current = collCursor;
  collLoadingRef.current = collLoading;
  collHasMoreRef.current = collHasMore;

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
    } finally {
      setCollLoading(false);
      collLoadingRef.current = false;
    }
  }, [axiosPrivate]);

  const observer = useRef();
  const lastCollElementRef = useCallback(node => {
    if (collLoadingRef.current) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && collHasMoreRef.current && !collLoadingRef.current && collCursorRef.current !== null) {
        fetchCollections(false);
      }
    });
    if (node) observer.current.observe(node);
  }, [fetchCollections]);

  const columns = [
    { 
      header: 'Collection Name', 
      accessor: 'collection_name',
      bold: true,
      render: (val, row) => val || `ID: ${row.collection_id}`
    },
  ];

  // Fetch Nav Pills on load
  useEffect(() => {
    const fetchPills = async () => {
      try {
        setLoading(true);
        const response = await axiosPrivate.get('/api/v1/admin/nav-pills?limit=50');
        if (response.data?.isSuccess) {
          setNavPills(response.data.data || []);
        }
      } catch (err) {
        setError('Failed to load navigation pills');
      } finally {
        setLoading(false);
      }
    };

    fetchPills();
    fetchCollections(true);
  }, [axiosPrivate, fetchCollections]);

  // Fetch mappings when selected pill changes
  const fetchMappings = useCallback(async () => {
    if (!selectedPill) {
      setMappings([]);
      return;
    }
    try {
      setLoading(true);
      const response = await axiosPrivate.get(`/api/v1/admin/nav-pill-collections/${selectedPill}`);
      if (response.data?.isSuccess) {
        setMappings(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching mappings:', err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [selectedPill, axiosPrivate]);

  useEffect(() => {
    fetchMappings();
    setCheckedIds([]); // Clear selection when switching pills
  }, [fetchMappings]);

  const handleReorder = async (newData, activeId, oldIndex, newIndex) => {
    const destinationItem = mappings[newIndex];
    if (!destinationItem) return;

    const newPositionVal = Number(destinationItem.position || 0);

    try {
      setLoading(true);
      const payload = {
        id: Number(activeId),
        new_position: newPositionVal
      };

      const response = await axiosPrivate.put('/api/v1/admin/nav-pill-collections/reorder', payload);
      
      if (response.data?.isSuccess) {
        await fetchMappings();
      } else {
        throw new Error(response.data?.message || 'Failed to update order');
      }
    } catch (err) {
      console.error('Reorder error:', err);
      setError(`Failed to save new order: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove "${item.collection_name}" from this menu?`)) return;
    try {
      setLoading(true);
      const response = await axiosPrivate.delete(`/api/v1/admin/nav-pill-collections/${item.id}`);
      if (response.data?.isSuccess) {
        setMappings(prev => prev.filter(i => i.id !== item.id));
      }
    } catch (err) {
      setError('Failed to remove collection');
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckbox = (id) => {
    setCheckedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAdd = async () => {
    if (!selectedPill) {
      setError('Please select a Menu Button first');
      return;
    }
    if (checkedIds.length === 0) {
      setError('Please select at least one collection');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Combine existing and new IDs
      const existingIds = mappings.map(m => m.collection_id);
      const allIds = [...new Set([...existingIds, ...checkedIds])];

      if (mappings.length === 0) {
        // POST for initial creation
        const payload = {
          nav_pill_id: parseInt(selectedPill),
          collection_ids: allIds
        };
        const response = await axiosPrivate.post('/api/v1/admin/nav-pill-collections', payload);
        if (response.data?.isSuccess) {
          await fetchMappings();
          setCheckedIds([]);
          setSuccess('Collections added successfully!');
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        // PUT for updating existing data
        const payload = {
          collection_ids: allIds
        };
        const response = await axiosPrivate.put(`/api/v1/admin/nav-pill-collections/${selectedPill}`, payload);
        if (response.data?.isSuccess) {
          await fetchMappings();
          setCheckedIds([]);
          setSuccess('Collections updated successfully!');
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (err) {
      console.error('Bulk add error:', err);
      setError(`Failed to save: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Page Content Setup</h1>
              <p className="text-gray-600 mt-1">Manage collections and their order under each menu button</p>
            </div>
          </div>

          {(error || success) && (
            <div className={`mb-4 p-4 rounded-lg border-l-4 ${error ? 'bg-red-50 border-red-500 text-red-700' : 'bg-emerald-50 border-emerald-500 text-emerald-700'}`}>
              <p className="font-medium">{error || success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar: Pill Selection */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs">1</span>
                Menu Button
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {navPills.map(pill => (
                  <button
                    key={pill.id}
                    onClick={() => { setSelectedPill(pill.id); setError(''); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      String(selectedPill) === String(pill.id)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm ring-1 ring-emerald-500'
                        : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-emerald-300 hover:bg-white'
                    }`}
                  >
                    {pill.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Area */}
            <div className="lg:col-span-3 space-y-8">
              {/* Part 2: Assigned Collections (Sortable) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs">2</span>
                  Arranged Content (Drag to Reorder)
                </h3>
                
                {!selectedPill ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 italic">Select a menu button to see and arrange its content.</p>
                  </div>
                ) : mappings.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">No collections assigned yet.</p>
                  </div>
                ) : (
                  <SortableDataTable
                    columns={columns}
                    data={mappings}
                    onDelete={handleDelete}
                    onReorder={handleReorder}
                    loading={loading}
                  />
                )}
              </div>

              {/* Part 3: Available Collections (Infinite Scroll) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                    <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs">3</span>
                    Available Collections
                  </h3>
                  {selectedPill && (
                    <button
                      onClick={handleBulkAdd}
                      disabled={loading || checkedIds.length === 0}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-md active:scale-95"
                    >
                      <FaPlus />
                      <span>Add {checkedIds.length > 0 ? checkedIds.length : ''} Selected to Menu</span>
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto p-1 custom-scrollbar">
                  {collections.map((coll, index) => {
                    const isAssigned = mappings.some(m => String(m.collection_id) === String(coll.id));
                    const isChecked = checkedIds.includes(coll.id);
                    const isLast = collections.length === index + 1;
                    
                    return (
                      <div 
                        key={coll.id}
                        ref={isLast ? lastCollElementRef : null}
                        onClick={() => !isAssigned && selectedPill && toggleCheckbox(coll.id)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                          isAssigned 
                            ? 'border-emerald-100 bg-emerald-50/30 opacity-60' 
                            : isChecked
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm cursor-pointer'
                            : 'border-gray-100 bg-gray-50/50 hover:border-emerald-200 hover:bg-white shadow-sm cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <FaLayerGroup className={`text-lg ${isAssigned ? 'text-emerald-400' : isChecked ? 'text-emerald-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-bold leading-tight ${isChecked ? 'text-emerald-900' : 'text-gray-800'}`}>
                              {coll.name}
                            </span>
                          </div>
                          
                          <div className="flex-shrink-0">
                            {isAssigned ? (
                              <FaCheckCircle className="text-emerald-500" />
                            ) : (
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCheckbox(coll.id)}
                                disabled={!selectedPill || loading}
                                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          </div>
                        </div>
                        
                        {isAssigned && (
                          <div className="mt-2 text-[10px] text-emerald-600 uppercase font-black tracking-widest flex items-center gap-1">
                            <FaCheckCircle className="text-[8px]" />
                            Already in Menu
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {collLoading && (
                    <div className="col-span-full py-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading more collections...</p>
                    </div>
                  )}

                  {collHasMore && !collLoading && collCursor && (
                    <div className="col-span-full py-4 text-center">
                      <button
                        type="button"
                        onClick={() => fetchCollections(false)}
                        className="px-6 py-2.5 bg-white border border-emerald-500 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-sm active:scale-95 cursor-pointer text-sm"
                      >
                        Load More Collections
                      </button>
                    </div>
                  )}

                  {!collHasMore && collections.length > 0 && (
                    <div className="col-span-full py-4 text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">All Collections Loaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NavPillCollections;
