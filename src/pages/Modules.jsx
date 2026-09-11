import { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import ModuleForm from '../components/ModuleForm';
import CursorPagination from '../components/CursorPagination';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

function Modules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingModule, setEditingModule] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [id, setId] = useState(null);

  // Cursor-based pagination state
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursorHistory, setCursorHistory] = useState([]);
  const itemsPerPage = 5;

  const navigate = useNavigate();
  const location = useLocation();

  const axiosPrivate = useAxiosPrivate();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getModules = async () => {
      try {
        setLoading(true);

        // Build URL with cursor-based pagination
        let url = `/api/v1/admin/modules?limit=${itemsPerPage}`;
        if (currentCursor !== null && currentCursor !== undefined && currentCursor !== '') {
          url += `&cursor=${encodeURIComponent(currentCursor)}`;
        }

        const response = await axiosPrivate.get(url, { signal: controller.signal });

        if (isMounted && response.data?.isSuccess) {
          setModules(response.data?.data || []);
          setNextCursor(response.data?.nextCursor || null);
          setHasMore(response.data?.hasMore || false);
        }
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          return;
        } else if (error.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        } else if (error.response?.status === 400 || error.response) {
          setError(error.response?.data?.message);

          const interval = setTimeout(() => {
            if (isMounted) setError("");
          }, 1000);

          return () => clearTimeout(interval);
        } else {
          setError("Something went wrong.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getModules();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate, location, axiosPrivate, currentCursor]);

  const handleEdit = async (module) => {
    try {
      setLoading(true);
      // Fetch full module details from API
      const response = await axiosPrivate.get(`/api/v1/admin/modules/${module.id}`);

      if (response.data?.isSuccess) {
        setEditingModule(response.data.data);
        setId(module?.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setShowForm(true);
      } else {
        throw new Error(response.data?.message || "Failed to fetch module details");
      }
    } catch (err) {
      console.error("Error fetching module details:", err?.response?.data?.message);
      setError(err?.response?.data?.message || "Failed to load module details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setId(id);
      const response = await axiosPrivate.delete(`/api/v1/admin/modules/${id}`);

      if (response.data?.isSuccess) {
        setModules((prev) => prev.filter((item) => Number(item.id) !== Number(id)));
        if (modules.length === 1 && cursorHistory.length > 0) {
          handlePreviousPage();
        }
      } else {
        throw new Error(response.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Error deleting module:", err?.response?.data?.message);
      setError(err?.response?.data?.message);
    } finally {
      setLoading(false);
      setId(null);
      setEditingModule(null);
    }
  };

  const handleFormSubmit = async (submitData, id) => {
    setLoading(true);

    try {
      if (id) {
        // Edit existing module
        const response = await axiosPrivate.put(`/api/v1/admin/modules/${id}`, submitData);

        if (response.data?.isSuccess) {
          // Update the module in the local list
          setModules((prev) => 
            prev.map((item) => (Number(item.id) === Number(id) ? { 
              ...item, 
              ...submitData, 
              id,
              is_active: submitData.is_active ? 1 : 0, // Ensure correct type for UI badge
              is_free: submitData.is_free ? 1 : 0
            } : item))
          );
          setShowForm(false);
          setEditingModule(null);
        } else {
          throw new Error(response.data?.message || "Update failed");
        }
      } else {
        // Add new module
        const response = await axiosPrivate.post(`/api/v1/admin/modules`, submitData);

        if (response.data?.isSuccess) {
          // Extract returned data if server provides it, otherwise use submitData
          const serverData = response.data.data;
          const newId = response.data?.data || (typeof serverData === 'object' ? serverData : null) || Date.now();
          
          const newModule = { 
            ...submitData, 
            id: newId,
            is_active: submitData.is_active ? 1 : 0,
            is_free: submitData.is_free ? 1 : 0
          };
          
          // Prepend new module to the list
          setModules((prev) => [newModule, ...prev]);
          setShowForm(false);
        } else {
          throw new Error(response.data?.message || "Creation failed");
        }
      }
    } catch (err) {
      console.error("Error submitting form:", err?.response?.data?.message);
      setError(err?.response?.data?.message);
      throw err; // Re-throw to let ModuleForm handle it
    } finally {
      setLoading(false);
      setId(null);
      setEditingModule(null);
    }
  };

  useEffect(() => {
    if (!error) return;

    const timeout = setTimeout(() => {
      setError("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [error]);

  const handleAddNew = () => {
    setEditingModule(null);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingModule(null);
  };

  const handleAddSyllabus = (id) => {
    // Navigate to syllabus page to add syllabus
    navigate(`/modules/${id}/syllabus`);
  };

  const handleViewSyllabus = (id) => {
    // Navigate to view/manage syllabus
    navigate(`/modules/${id}/syllabus`);
  };

  const handleNextPage = () => {
    if (hasMore && nextCursor !== null && nextCursor !== undefined) {
      // Save current cursor to history for back navigation
      setCursorHistory((prev) => [...prev, currentCursor]);
      setCurrentCursor(nextCursor);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (cursorHistory.length > 0) {
      // Get the previous cursor from history
      const previousCursor = cursorHistory[cursorHistory.length - 1];
      setCursorHistory((prev) => prev.slice(0, -1));
      setCurrentCursor(previousCursor);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isFirstPage = cursorHistory.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
              <p className="text-gray-600 mt-1">Manage your fitness modules</p>
            </div>
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <FaPlus />
                <span>Add New Module</span>
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* ModuleForm for Add/Edit */}
          {showForm && (
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingModule ? 'Edit Module' : 'Add New Module'}
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-gray-700 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                </div>
                <ModuleForm
                  handleSubmit={handleFormSubmit}
                  editData={editingModule}
                  onCancel={handleCancelEdit}
                />
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="text-gray-600 mt-2">Loading modules...</p>
            </div>
          ) : (
            <>
              {/* Cards Grid */}
              {modules.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">No modules found. Add your first module!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module) => (
                      <Card
                        key={module.id}
                        item={module}
                        imageField="thumbnail_url"
                        titleField="title"
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAddSyllabus={handleAddSyllabus}
                        onViewSyllabus={handleViewSyllabus}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Footer with pagination */}
              {(modules.length > 0 || cursorHistory.length > 0) && (
                <CursorPagination
                  hasMore={hasMore}
                  currentPage={cursorHistory.length + 1}
                  onPreviousPage={handlePreviousPage}
                  onNextPage={handleNextPage}
                  itemCount={modules.length}
                  itemLabel="module"
                  itemLabelPlural="modules"
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Modules;
