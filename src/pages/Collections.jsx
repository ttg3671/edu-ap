import { useState, useEffect, useCallback } from 'react';
import { FaPlus } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import GenericForm from '../components/GenericForm';
import CursorPagination from '../components/CursorPagination';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Cursor-based pagination state
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursorHistory, setCursorHistory] = useState([]);
  const itemsPerPage = 10;
  
  const axiosPrivate = useAxiosPrivate();

  const columns = [
    { 
      header: 'ID', 
      accessor: 'id', 
      width: '80px',
      render: (_, __, index) => (cursorHistory.length * itemsPerPage) + index + 1
    },
    { header: 'Collection Name', accessor: 'name', bold: true },
    { header: 'Layout', accessor: 'layout_type' }
  ];

  const fields = [
    { name: 'name', label: 'Collection Name (e.g., New Releases)', required: true },
    { 
      name: 'layout_type', 
      label: 'Layout Type', 
      type: 'select', 
      defaultValue: 'horizontal_scroll',
      options: [
        { label: 'Horizontal Scroll', value: 'horizontal_scroll' },
        { label: 'Vertical Grid', value: 'vertical_grid' },
        { label: 'Featured Hero', value: 'featured_hero' }
      ]
    }
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/v1/admin/collections?limit=${itemsPerPage}`;
      if (currentCursor !== null && currentCursor !== undefined && currentCursor !== '') {
        url += `&cursor=${encodeURIComponent(currentCursor)}`;
      }

      const response = await axiosPrivate.get(url);
      if (response.data?.isSuccess) {
        setCollections(response.data.data || []);
        setNextCursor(response.data?.nextCursor || null);
        setHasMore(response.data?.hasMore || false);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, currentCursor, itemsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNextPage = () => {
    if (hasMore && nextCursor !== null && nextCursor !== undefined) {
      setCursorHistory((prev) => [...prev, currentCursor]);
      setCurrentCursor(nextCursor);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      const previousCursor = newHistory.pop();
      setCursorHistory(newHistory);
      setCurrentCursor(previousCursor);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      setLoading(true);
      const response = await axiosPrivate.delete(`/api/v1/admin/collections/${item.id}`);
      if (response.data?.isSuccess) {
        setCollections(prev => prev.filter(i => i.id !== item.id));
        if (collections.length === 1 && cursorHistory.length > 0) {
          handlePreviousPage();
        }
      }
    } catch (err) {
      setError('Failed to delete collection');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      if (editingItem) {
        const response = await axiosPrivate.put(`/api/v1/admin/collections/${editingItem.id}`, formData);
        if (response.data?.isSuccess) {
          setCollections(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...formData } : i));
          setShowForm(false);
          setEditingItem(null);
        }
      } else {
        const response = await axiosPrivate.post('/api/v1/admin/collections', formData);
        if (response.data?.isSuccess) {
          const newId = response.data?.data || response.data?.data || Date.now();
          const newItem = { id: newId, ...formData };
          setCollections(prev => [...prev, newItem]);
          setShowForm(false);
        }
      }
    } catch (err) {
      setError('Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Collections</h1>
              <p className="text-gray-600 mt-1">Manage groups of modules, like "New Releases" or "Instagram Workouts"</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer font-semibold"
              >
                <FaPlus />
                <span>Add New Collection</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {showForm && (
            <div className="mb-8 bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit Collection' : 'Create New Collection'}
                </h2>
                <button 
                  onClick={() => { setShowForm(false); setEditingItem(null); }}
                  className="text-gray-500 hover:text-gray-700 font-medium"
                >
                  Cancel
                </button>
              </div>
              <GenericForm
                fields={fields}
                initialData={editingItem}
                onSubmit={handleFormSubmit}
                onCancel={() => { setShowForm(false); setEditingItem(null); }}
                loading={loading}
              />
            </div>
          )}

          <DataTable
            columns={columns}
            data={collections}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />

          {(collections.length > 0 || cursorHistory.length > 0) && (
            <CursorPagination
              hasMore={hasMore}
              currentPage={cursorHistory.length + 1}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              itemCount={collections.length}
              itemLabel="collection"
              itemLabelPlural="collections"
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default Collections;
