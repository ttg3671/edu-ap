import { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import SortableDataTable from '../components/SortableDataTable';
import GenericForm from '../components/GenericForm';
import CursorPagination from '../components/CursorPagination';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

function HomePageConfig() {
  const [configs, setConfigs] = useState([]);
  const [navPills, setNavPills] = useState([]);
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
      header: 'Nav Pill (Top Button)', 
      accessor: 'nav_pill_name',
      bold: true,
      render: (val, row) => val || `ID: ${row.nav_pill_id}`
    },
    { 
      header: 'Visible', 
      accessor: 'is_visible',
      render: (val) => val === 1 || val === true ? '✅ Yes' : '❌ No'
    },
  ];

  const fields = [
    { 
      name: 'nav_pill_id', 
      label: 'Nav Pill', 
      type: 'select', 
      required: true,
      options: navPills.map(p => ({ label: p.name, value: p.id }))
    },
    { name: 'is_visible', label: 'Is Visible', type: 'checkbox', defaultValue: 1 },
  ];

  useEffect(() => {
    const fetchPills = async () => {
      try {
        const response = await axiosPrivate.get('/api/v1/admin/nav-pills?limit=50');
        if (response.data?.isSuccess) {
          setNavPills(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching pills:', err);
      }
    };
    fetchPills();
  }, [axiosPrivate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = `/api/v1/admin/home-config?limit=${itemsPerPage}`;
      if (currentCursor !== null && currentCursor !== undefined && currentCursor !== '') {
        url += `&cursor=${encodeURIComponent(currentCursor)}`;
      }

      const response = await axiosPrivate.get(url);
      if (response.data?.isSuccess) {
        setConfigs(response.data.data || []);
        setNextCursor(response.data?.nextCursor || null);
        setHasMore(response.data?.hasMore || false);
      }
    } catch (err) {
      console.error('Error fetching home config:', err);
      setError('Failed to load home page configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [axiosPrivate, currentCursor]);

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
    if (!window.confirm(`Are you sure you want to remove this from home page?`)) return;
    try {
      setLoading(true);
      const response = await axiosPrivate.delete(`/api/v1/admin/home-config/${item.id}`);
      if (response.data?.isSuccess) {
        if (configs.length === 1 && cursorHistory.length > 0) {
          handlePreviousPage();
        } else {
          setConfigs(prev => prev.filter(i => i.id !== item.id));
        }
      }
    } catch (err) {
      setError('Failed to delete configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (newData, activeId, oldIndex, newIndex) => {
    // 1. Get the item that was originally at the destination index
    const destinationItem = configs[newIndex];
    if (!destinationItem) return;

    // The new position value is the position of the item we moved into
    const newPositionVal = Number(destinationItem.position || destinationItem.order || 0);

    try {
      setLoading(true);
      const payload = {
        id: Number(activeId),
        new_position: newPositionVal
      };

      // console.log('Sending Reorder Payload to Backend:', JSON.stringify(payload, null, 2));

      const response = await axiosPrivate.put('/api/v1/admin/home-config/reorder', payload);

      // console.log('Backend Response:', response.data);

      if (response.data?.isSuccess) {
        setConfigs(newData);
      } else {
        throw new Error(response.data?.message || 'Failed to update order on server');
      }
    } catch (err) {
      console.error('Reorder error detailed:', err);
      setError(`Failed to save new order: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      const payload = {
        nav_pill_id: parseInt(formData.nav_pill_id),
        is_visible: !!formData.is_visible
      };

      if (editingItem) {
        const response = await axiosPrivate.put(`/api/v1/admin/home-config/${editingItem.id}`, payload);
        if (response.data?.isSuccess) {
          // Find the pill name for local update
          const pill = navPills.find(p => String(p.id) === String(payload.nav_pill_id));
          setConfigs(prev => prev.map(i => i.id === editingItem.id ? { 
            ...i, 
            ...payload, 
            nav_pill_name: pill ? pill.name : i.nav_pill_name 
          } : i));
          setShowForm(false);
          setEditingItem(null);
        }
      } else {
        const response = await axiosPrivate.post('/api/v1/admin/home-config', payload);
        if (response.data?.isSuccess) {
          if (currentCursor === null) {
            // If already on the first page, just refresh
            fetchData();
          } else {
            // Reset to first page to see the new addition
            setCurrentCursor(null);
            setCursorHistory([]);
          }
          setShowForm(false);
        }
      }
    } catch (err) {
      setError('Failed to save configuration');
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
              <h1 className="text-3xl font-bold text-gray-900">Home Page Setup</h1>
              <p className="text-gray-600 mt-1">Configure which top buttons (Nav Pills) appear on the app home screen</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer font-semibold"
              >
                <FaPlus />
                <span>Add New Pill to Home</span>
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
                  {editingItem ? 'Edit Setup' : 'Add Button to Home'}
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

          <SortableDataTable
            columns={columns}
            data={configs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReorder={handleReorder}
            loading={loading}
          />

          {(configs.length > 0 || cursorHistory.length > 0) && (
            <CursorPagination
              hasMore={hasMore}
              currentPage={cursorHistory.length + 1}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              itemCount={configs.length}
              itemLabel="setup"
              itemLabelPlural="setups"
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePageConfig;
