import { useState, useEffect } from 'react';
import { FaPlus, FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import FreeModuleForm from '../components/FreeModuleForm';
import CursorPagination from '../components/CursorPagination';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { deleteCloudinaryImage } from '../utils/cloudinary';

const BASE_URL = '/api/v1/admin/modules/free';

function FreeModules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingModule, setEditingModule] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

    const getFreeModules = async () => {
      try {
        setLoading(true);

        let url = `${BASE_URL}?limit=${itemsPerPage}`;
        if (currentCursor !== null && currentCursor !== undefined && currentCursor !== '') {
          url += `&cursor=${encodeURIComponent(currentCursor)}`;
        }

        const response = await axiosPrivate.get(url, { signal: controller.signal });

        if (isMounted && response.data?.isSuccess) {
          setModules(response.data?.data || []);
          setNextCursor(response.data?.nextCursor ?? null);
          setHasMore(response.data?.hasMore || false);
        }
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          return;
        } else if (error.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        } else if (error.response) {
          if (isMounted) setError(error.response?.data?.message);
        } else if (isMounted) {
          setError("Something went wrong.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getFreeModules();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate, location, axiosPrivate, currentCursor, refreshKey]);

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(timeout);
  }, [error]);

  const handleEdit = async (module) => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get(`${BASE_URL}/${module.id}`);

      if (response.data?.isSuccess) {
        setEditingModule({ ...response.data.data, id: module.id });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setShowForm(true);
      } else {
        throw new Error(response.data?.message || "Failed to fetch free module details");
      }
    } catch (err) {
      console.error("Error fetching free module details:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load free module details");
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
      const thumbnail = modules.find((item) => Number(item.id) === Number(id))?.thumbnail_url;
      const response = await axiosPrivate.delete(`${BASE_URL}/${id}`);

      if (response.data?.isSuccess) {
        if (thumbnail) {
          try {
            await deleteCloudinaryImage(axiosPrivate, thumbnail);
          } catch (imgErr) {
            console.warn('Free module deleted but failed to delete its image:', imgErr);
            setError('Free module deleted, but its image could not be removed from Cloudinary');
          }
        }
        setModules((prev) => prev.filter((item) => Number(item.id) !== Number(id)));
        if (modules.length === 1 && cursorHistory.length > 0) {
          handlePreviousPage();
        }
        if (editingModule && Number(editingModule.id) === Number(id)) {
          setShowForm(false);
          setEditingModule(null);
        }
      } else {
        throw new Error(response.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Error deleting free module:", err);
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (submitData, id) => {
    try {
      const response = id
        ? await axiosPrivate.put(`${BASE_URL}/${id}`, submitData)
        : await axiosPrivate.post(BASE_URL, submitData);

      if (!response.data?.isSuccess) {
        throw new Error(response.data?.message || (id ? "Update failed" : "Creation failed"));
      }

      setShowForm(false);
      setEditingModule(null);

      if (id) {
        setModules((prev) =>
          prev.map((item) => (Number(item.id) === Number(id) ? {
            ...item,
            title: submitData.title,
            thumbnail_url: submitData.thumbnail_url,
            is_active: submitData.is_active ? 1 : 0,
          } : item))
        );
      } else {
        // Reload the first page so the new item shows with its server id
        setCursorHistory([]);
        setCurrentCursor(null);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Error submitting free module:", err);
      setError(err?.response?.data?.message || err.message);
      throw err; // Re-throw to let FreeModuleForm show it
    }
  };

  const handleAddNew = () => {
    setEditingModule(null);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingModule(null);
  };

  const handleNextPage = () => {
    if (hasMore && nextCursor !== null && nextCursor !== undefined) {
      setCursorHistory((prev) => [...prev, currentCursor]);
      setCurrentCursor(nextCursor);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (cursorHistory.length > 0) {
      const previousCursor = cursorHistory[cursorHistory.length - 1];
      setCursorHistory((prev) => prev.slice(0, -1));
      setCurrentCursor(previousCursor);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/modules')}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4 font-bold cursor-pointer"
          >
            <FaArrowLeft />
            <span>Back to Modules</span>
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Free Workouts</h1>
              <p className="text-gray-600 mt-1">Manage your free workout modules</p>
            </div>
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <FaPlus />
                <span>Add Free Module</span>
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Form for Add/Edit */}
          {showForm && (
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingModule ? 'Edit Free Module' : 'Add Free Module'}
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-gray-700 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                </div>
                <FreeModuleForm
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
              <p className="text-gray-600 mt-2">Loading free modules...</p>
            </div>
          ) : (
            <>
              {modules.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">No free modules found. Add your first free workout!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.map((module) => (
                    <Card
                      key={module.id}
                      item={module}
                      imageField="thumbnail_url"
                      titleField="title"
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}

              {(modules.length > 0 || cursorHistory.length > 0) && (
                <CursorPagination
                  hasMore={hasMore}
                  currentPage={cursorHistory.length + 1}
                  onPreviousPage={handlePreviousPage}
                  onNextPage={handleNextPage}
                  itemCount={modules.length}
                  itemLabel="free module"
                  itemLabelPlural="free modules"
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default FreeModules;
