import { useState, useEffect, useCallback } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import GenericForm from '../components/GenericForm';
import CursorPagination from '../components/CursorPagination';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

function CategoryGroups() {
  const [groups, setGroups] = useState([]);
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
  const navigate = useNavigate();

  const columns = [
    { 
      header: 'ID', 
      accessor: 'id', 
      width: '80px',
      render: (_, __, index) => (cursorHistory.length * itemsPerPage) + index + 1
    },
    { header: 'Group Name', accessor: 'group_name', bold: true },
    { 
      header: 'Categories', 
      accessor: 'id',
      render: (val, row) => (
        <button
          onClick={() => navigate(`/category-groups/${val}/categories`)}
          className="text-blue-600 hover:text-blue-900 font-medium cursor-pointer"
        >
          Manage Categories
        </button>
      )
    }
  ];

  const fields = [
    { name: 'group_name', label: 'Group Name (e.g., Difficulty, Equipment)', required: true },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/v1/admin/category-groups?limit=${itemsPerPage}`;
      if (currentCursor !== null && currentCursor !== undefined && currentCursor !== '') {
        url += `&cursor=${encodeURIComponent(currentCursor)}`;
      }

      const response = await axiosPrivate.get(url);
      if (response.data?.isSuccess) {
        setGroups(response.data.data || []);
        setNextCursor(response.data?.nextCursor || null);
        setHasMore(response.data?.hasMore || false);
      }
    } catch (err) {
      console.error('Error fetching category groups:', err);
      setError('Failed to load filter groups');
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
    if (!window.confirm(`Are you sure you want to delete "${item.group_name}"? This will also delete all categories inside it.`)) return;
    try {
      setLoading(true);
      const response = await axiosPrivate.delete(`/api/v1/admin/category-groups/${item.id}`);
      if (response.data?.isSuccess) {
        setGroups(prev => prev.filter(i => i.id !== item.id));
        if (groups.length === 1 && cursorHistory.length > 0) {
          handlePreviousPage();
        }
      }
    } catch (err) {
      setError('Failed to delete filter group');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      if (editingItem) {
        const response = await axiosPrivate.put(`/api/v1/admin/category-groups/${editingItem.id}`, formData);
        if (response.data?.isSuccess) {
          setGroups(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...formData } : i));
          setShowForm(false);
          setEditingItem(null);
        }
      } else {
        const response = await axiosPrivate.post('/api/v1/admin/category-groups', formData);
        if (response.data?.isSuccess) {
          const newId = response.data?.data || response.data?.data || Date.now();
          const newItem = { id: newId, ...formData };
          setGroups(prev => [...prev, newItem]);
          setShowForm(false);
        }
      }
    } catch (err) {
      setError('Failed to save filter group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Filter Groups</h1>
              <p className="text-gray-600 mt-1">Manage broad categories like "Difficulty", "Equipment", or "Instructors"</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer font-semibold"
              >
                <FaPlus />
                <span>Add New Group</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {showForm && (
            <div className="mb-8 bg-white rounded-lg shadow-lg p-6 max-w-xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit Group' : 'Create New Group'}
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
            data={groups}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />

          {(groups.length > 0 || cursorHistory.length > 0) && (
            <CursorPagination
              hasMore={hasMore}
              currentPage={cursorHistory.length + 1}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              itemCount={groups.length}
              itemLabel="group"
              itemLabelPlural="groups"
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default CategoryGroups;
