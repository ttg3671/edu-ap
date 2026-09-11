import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaArrowLeft } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import GenericForm from '../components/GenericForm';
import CursorPagination from '../components/CursorPagination';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

function CategoriesByGroup() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [group, setGroup] = useState(null);
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
    { header: 'Category Name', accessor: 'name', bold: true },
  ];

  const fields = [
    { name: 'name', label: 'Category Name', required: true },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/v1/admin/categories/${groupId}?limit=${itemsPerPage}`;
      if (currentCursor !== null && currentCursor !== undefined && currentCursor !== '') {
        url += `&cursor=${encodeURIComponent(currentCursor)}`;
      }

      const [catRes, groupRes] = await Promise.all([
        axiosPrivate.get(url),
        axiosPrivate.get(`/api/v1/admin/category-groups`)
      ]);
      
      if (catRes.data?.isSuccess) {
        setCategories(catRes.data.data || []);
        setNextCursor(catRes.data?.nextCursor || null);
        setHasMore(catRes.data?.hasMore || false);
      }
      
      if (groupRes.data?.isSuccess) {
        const currentGroup = groupRes.data.data.find(g => String(g.id) === String(groupId));
        setGroup(currentGroup);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, groupId, currentCursor, itemsPerPage]);

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
      const response = await axiosPrivate.delete(`/api/v1/admin/categories/${item.id}`);
      if (response.data?.isSuccess) {
        setCategories(prev => prev.filter(i => i.id !== item.id));
        if (categories.length === 1 && cursorHistory.length > 0) {
          handlePreviousPage();
        }
      }
    } catch (err) {
      setError('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      const payload = {
        ...formData,
        group_id: parseInt(groupId)
      };

      if (editingItem) {
        const response = await axiosPrivate.put(`/api/v1/admin/categories/${editingItem.id}`, payload);
        if (response.data?.isSuccess) {
          setCategories(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...formData } : i));
          setShowForm(false);
          setEditingItem(null);
        }
      } else {
        const response = await axiosPrivate.post('/api/v1/admin/categories', payload);
        if (response.data?.isSuccess) {
          const newId = response.data?.data || response.data?.data || Date.now();
          const newItem = { id: newId, ...formData };
          setCategories(prev => [...prev, newItem]);
          setShowForm(false);
        }
      }
    } catch (err) {
      setError('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/category-groups')}
            className="mb-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer font-medium"
          >
            <FaArrowLeft />
            <span>Back to Groups</span>
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {group ? `${group.group_name} Categories` : 'Manage Categories'}
              </h1>
              <p className="text-gray-600 mt-1">Manage options for this filter group</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer font-semibold"
              >
                <FaPlus />
                <span>Add Category</span>
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
                  {editingItem ? 'Edit Category' : 'Create New Category'}
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
            data={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />

          {(categories.length > 0 || cursorHistory.length > 0) && (
            <CursorPagination
              hasMore={hasMore}
              currentPage={cursorHistory.length + 1}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              itemCount={categories.length}
              itemLabel="category"
              itemLabelPlural="categories"
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default CategoriesByGroup;
