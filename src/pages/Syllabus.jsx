import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Navbar from '../components/Navbar';
import SortableDataTable from '../components/SortableDataTable';
import SyllabusForm from '../components/SyllabusForm';
import CursorPagination from '../components/CursorPagination';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

function Syllabus() {
  const { moduleId } = useParams();
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSyllabus, setEditingSyllabus] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [moduleName, setModuleName] = useState('');

  // Cursor-based pagination state
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursorHistory, setCursorHistory] = useState([]);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const location = useLocation();
  const axiosPrivate = useAxiosPrivate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/v1/admin/modules/syllabus/${moduleId}?limit=${itemsPerPage}`;
      if (currentCursor !== null && currentCursor !== undefined && currentCursor !== '') {
        url += `&cursor=${encodeURIComponent(currentCursor)}`;
      }

      const response = await axiosPrivate.get(url);

      if (response.data?.isSuccess) {
        setSyllabus(response.data?.data || []);
        setNextCursor(response.data?.nextCursor || null);
        setHasMore(response.data?.hasMore || false);

        if (response.data?.moduleName) {
          setModuleName(response.data.moduleName);
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/", { state: { from: location }, replace: true });
      } else {
        setError(error.response?.data?.message || "Failed to load syllabus");
      }
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, moduleId, currentCursor, itemsPerPage, navigate, location]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (syllabusItem) => {
    setEditingSyllabus(syllabusItem);
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
      const response = await axiosPrivate.delete(`/api/v1/admin/syllabus/${id}`);
      if (response.data?.isSuccess) {
        setSyllabus((prev) => prev.filter((item) => Number(item.id) !== Number(id)));
        if (syllabus.length === 1 && cursorHistory.length > 0) {
          handlePreviousPage();
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete item");
    } finally {
      setLoading(false);
    }
  };

  const handleViewLessons = (syllabusId) => {
    navigate(`/modules/${moduleId}/syllabus/${syllabusId}/lessons`);
  };

  const handleReorder = async (newData, movedId, oldIndex, newIndex) => {
    setSyllabus(newData);
    try {
      setLoading(true);
      const response = await axiosPrivate.put('/api/v1/admin/syllabus/reorder', {
        id: movedId,
        new_position: newIndex + 1
      });

      if (!response.data?.isSuccess) {
        setError('Failed to update order on server');
        fetchData(); 
      }
    } catch (err) {
      setError('Error reordering items');
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (submitData, id) => {
    setLoading(true);
    setError('');

    try {
      if (id) {
        // Edit
        const response = await axiosPrivate.put(`/api/v1/admin/syllabus/${id}`, submitData);

        if (response.data?.isSuccess) {
          setSyllabus((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, ...submitData } : item
            )
          );
          setShowForm(false);
          setEditingSyllabus(null);
        } else {
          throw new Error(response.data?.message || "Failed to update item");
        }
      } else {
        // Add
        const response = await axiosPrivate.post(`/api/v1/admin/syllabus`, submitData);

        if (response.data?.isSuccess) {
          const serverData = response.data.data;
          let newItem;
          
          if (serverData && typeof serverData === 'object') {
            newItem = { 
              ...serverData,
              ...submitData,
              lessons_count: serverData.lessons_count || 0 
            };
          } else {
            const newId = response.data?.data || serverData || Date.now();
            newItem = { 
              id: newId, 
              ...submitData,
              lessons_count: 0 
            };
          }
          
          setSyllabus((prev) => [...prev, newItem]);
          setShowForm(false);
        } else {
          throw new Error(response.data?.message || "Failed to create item");
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to save item");
      throw err;
    } finally {
      setLoading(false);
    }
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
      const newHistory = [...cursorHistory];
      const previousCursor = newHistory.pop();
      setCursorHistory(newHistory);
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
      header: 'Lessons', 
      accessor: 'lessons_count',
      render: (val, row) => (
        <button
          onClick={() => handleViewLessons(row.id)}
          className="text-blue-600 hover:text-blue-900 font-medium cursor-pointer inline-flex items-center gap-1"
        >
          <span>{val || 0}</span>
          <span>{val === 1 ? 'Lesson' : 'Lessons'}</span>
        </button>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/modules/view-all')}
            className="mb-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer font-medium"
          >
            <FaArrowLeft />
            <span>Back to Modules</span>
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Syllabus</h1>
              <p className="text-gray-600 mt-1">
                {moduleName ? `Manage sections for ${moduleName}` : `Manage sections for Module #${moduleId}`}
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => { setEditingSyllabus(null); setShowForm(true); }}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer font-bold"
              >
                <FaPlus />
                <span>Add Syllabus</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {showForm && (
            <div className="mb-8 bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingSyllabus ? 'Edit Syllabus' : 'Create New Syllabus'}
                </h2>
                <button 
                  onClick={() => { setShowForm(false); setEditingSyllabus(null); }}
                  className="text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <SyllabusForm
                handleSubmit={handleFormSubmit}
                editData={editingSyllabus}
                onCancel={() => { setShowForm(false); setEditingSyllabus(null); }}
                moduleId={moduleId}
              />
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SortableDataTable
              columns={columns}
              data={syllabus}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReorder={handleReorder}
              loading={loading}
            />
          </div>

          {(syllabus.length > 0 || cursorHistory.length > 0) && (
            <CursorPagination
              hasMore={hasMore}
              currentPage={cursorHistory.length + 1}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              itemCount={syllabus.length}
              itemLabel="section"
              itemLabelPlural="sections"
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default Syllabus;
