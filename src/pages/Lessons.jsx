import { useState, useEffect } from 'react';
import { FaPlus, FaArrowLeft, FaVideo, FaEdit } from 'react-icons/fa';
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from '../components/Navbar';
import SortableDataTable from '../components/SortableDataTable';
import LessonForm from '../components/LessonForm';
import CursorPagination from '../components/CursorPagination';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingLesson, setEditingLesson] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [syllabusName, setSyllabusName] = useState('');

  // Cursor-based pagination state
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursorHistory, setCursorHistory] = useState([]);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const { moduleId, syllabusId } = useParams();
  const location = useLocation();
  const axiosPrivate = useAxiosPrivate();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getLessons = async () => {
      try {
        setLoading(true);

        // Build URL with cursor-based pagination
        let url = `/api/v1/admin/syllabus/lessons/${syllabusId}?limit=${itemsPerPage}`;
        if (currentCursor !== null && currentCursor !== undefined && currentCursor !== '') {
          url += `&cursor=${encodeURIComponent(currentCursor)}`;
        }

        const response = await axiosPrivate.get(url, { signal: controller.signal });

        if (isMounted && response.data?.isSuccess) {
          setLessons(response.data?.data || []);
          setNextCursor(response.data?.nextCursor || null);
          setHasMore(response.data?.hasMore || false);

          // Get syllabus name if available in response
          if (response.data?.syllabusName) {
            setSyllabusName(response.data.syllabusName);
          }
        }
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          return;
        } else if (error.response?.status === 401) {
          navigate("/", { replace: true });
        } else {
          setError(error.response?.data?.message || "Something went wrong.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (syllabusId) {
      getLessons();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate, axiosPrivate, syllabusId, currentCursor]);

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowForm(true);
  };

  const handleDelete = async (row) => {
    const { id, title } = row;
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosPrivate.delete(`/api/v1/admin/lessons/${id}`);

      if (response.data?.isSuccess) {
        setLessons((prev) => prev.filter((item) => Number(item.id) !== Number(id)));
        if (lessons.length === 1 && cursorHistory.length > 0) {
          handlePreviousPage();
        }
      } else {
        throw new Error(response.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Error deleting lesson:", err?.response?.data?.message);
      setError(err?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = (id) => {
    // Navigate to upload video page with lesson id
    navigate(`/upload-video/${id}`);
  };

  const handleReorder = async (newData, movedId, oldIndex, newIndex) => {
    setLessons(newData);
    try {
      setLoading(true);
      const response = await axiosPrivate.put('/api/v1/admin/lessons/reorder', {
        id: movedId,
        new_position: newIndex + 1,
        syllabus_id: parseInt(syllabusId),
        module_id: parseInt(moduleId)
      });

      if (!response.data?.isSuccess) {
        setError('Failed to update order on server');
        // Refresh data
        setCurrentCursor(currentCursor); 
      }
    } catch (err) {
      setError('Error reordering items');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (submitData, id) => {
    setLoading(true);

    try {
      if (id) {
        // Edit existing lesson
        const response = await axiosPrivate.put(`/api/v1/admin/lessons/${id}`, submitData);

        if (response.data?.isSuccess) {
          // Update lesson in list
          setLessons((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, ...submitData } : item
            )
          );
          setShowForm(false);
          setEditingLesson(null);
        } else {
          throw new Error(response.data?.message || "Update failed");
        }
      } else {
        // Add new lesson
        const response = await axiosPrivate.post(`/api/v1/admin/lessons`, submitData);

        if (response.data?.isSuccess && response.data?.data) {
          const newLesson = typeof response.data.data === 'object'
            ? response.data.data
            : { id: response.data.data, ...submitData };

          setLessons((prev) => [...prev, newLesson]);
          setShowForm(false);
        } else {
          throw new Error(response.data?.message || "Creation failed");
        }
      }
    } catch (err) {
      console.error("Error submitting form:", err?.response?.data?.message);
      setError(err?.response?.data?.message);
      throw err;
    } finally {
      setLoading(false);
      setEditingLesson(null);
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
    setEditingLesson(null);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingLesson(null);
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

  const columns = [
    { header: 'Title', accessor: 'title', bold: true },
    { 
      header: 'Instructions', 
      accessor: 'workout_instructions',
      render: (val) => (
        val ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Has Instructions
          </span>
        ) : (
          <span className="text-xs text-gray-400">None</span>
        )
      )
    },
    { 
      header: 'Video', 
      accessor: 'video_url',
      render: (val, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleAddVideo(row.id)}
            className={`p-2 rounded transition-colors cursor-pointer ${val ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
            title={val ? 'Edit Video' : 'Add Video'}
          >
            {val ? <FaEdit /> : <FaVideo />}
          </button>
          {val && (
            <span className="text-xs text-gray-400 self-center">Has Video</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/modules/${moduleId}/syllabus`)}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 transition-colors font-medium cursor-pointer"
          >
            <FaArrowLeft />
            <span>Back to Syllabus</span>
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lessons</h1>
              <p className="text-gray-600 mt-1">
                {syllabusName ? `Manage lessons for ${syllabusName}` : `Manage syllabus lessons`}
              </p>
            </div>
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <FaPlus />
                <span>Add New Lesson</span>
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* LessonForm for Add/Edit */}
          {showForm && (
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-gray-700 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                </div>
                <LessonForm
                  handleSubmit={handleFormSubmit}
                  editData={editingLesson}
                  onCancel={handleCancelEdit}
                  syllabusId={syllabusId}
                />
              </div>
            </div>
          )}

          {/* Main Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SortableDataTable
              columns={columns}
              data={lessons}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReorder={handleReorder}
              loading={loading}
            />
          </div>

          {(lessons.length > 0 || cursorHistory.length > 0) && (
            <CursorPagination
              hasMore={hasMore}
              currentPage={cursorHistory.length + 1}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              itemCount={lessons.length}
              itemLabel="lesson"
              itemLabelPlural="lessons"
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default Lessons;
