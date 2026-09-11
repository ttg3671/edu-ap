import { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import CursorPagination from '../components/CursorPagination';
import { useNavigate, useLocation } from "react-router-dom";
import useAxiosPrivate from '../hooks/useAxiosPrivate';

function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Pagination state
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursorHistory, setCursorHistory] = useState([]);
  const itemsPerPage = 10;

  // Form input states
  const [formData, setFormData] = useState({
    plan_name: '',
    stripe_price_id: '',
    monthly_price: '',
    duration_value: 1,
    duration_unit: 'month',
    max_screens: 1,
    is_active: true
  });

  const navigate = useNavigate();
  const location = useLocation();
  const axiosPrivate = useAxiosPrivate();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getPlans = async () => {
      try {
        setLoading(true);
        let url = `/api/v1/admin/plans?limit=${itemsPerPage}`;
        if (currentCursor !== null && currentCursor !== undefined && currentCursor !== '') {
          url += `&cursor=${encodeURIComponent(currentCursor)}`;
        }

        const response = await axiosPrivate.get(url, {
          signal: controller.signal,
        });

        if (isMounted && response.data?.isSuccess) {
          setPlans(response.data?.data || []);
          setNextCursor(response.data?.nextCursor || null);
          setHasMore(response.data?.hasMore || false);
        }
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          return;
        } else if (error.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        } else {
          setError(error.response?.data?.message || "Something went wrong.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getPlans();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate, location, axiosPrivate, currentCursor]);

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name || '',
      stripe_price_id: plan.stripe_price_id || '',
      monthly_price: plan.monthly_price || '',
      duration_value: plan.duration_value || 1,
      duration_unit: plan.duration_unit || 'month',
      max_screens: plan.max_screens || 1,
      is_active: plan.is_active === true || plan.is_active === 1
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowForm(true);
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete "${plan.plan_name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosPrivate.delete(`/api/v1/admin/plans/${plan.id}`);

      if (response.data?.isSuccess) {
        setPlans((prev) => prev.filter((item) => Number(item.id) !== Number(plan.id)));
      } else {
        throw new Error(response.data?.message || "Delete failed");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete plan");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
        ...formData,
        max_screens: parseInt(formData.max_screens),
        duration_value: parseInt(formData.duration_value),
        is_active: Boolean(formData.is_active)
      };

      if (editingPlan?.id) {
        // Update existing plan
        const response = await axiosPrivate.put(
          `/api/v1/admin/plans/${editingPlan.id}`,
          submissionData
        );

        if (response.data?.isSuccess) {
          setPlans((prev) =>
            prev.map((item) =>
              item.id === editingPlan.id ? { ...item, ...submissionData } : item
            )
          );
          setShowForm(false);
          setEditingPlan(null);
          resetForm();
        } else {
          throw new Error(response.data?.message || "Update failed");
        }
      } else {
        // Create new plan
        const response = await axiosPrivate.post(
          '/api/v1/admin/plans',
          submissionData
        );

        if (response.data?.isSuccess) {
          // Refresh current page to show new item or handle locally
          // For simplicity, if we have the new object, add it
          const newPlan = response.data.data && typeof response.data.data === 'object'
            ? response.data.data
            : { id: response.data.data, ...submissionData };

          setPlans((prev) => [newPlan, ...prev]);
          setShowForm(false);
          resetForm();
        } else {
          throw new Error(response.data?.message || "Creation failed");
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      plan_name: '',
      stripe_price_id: '',
      monthly_price: '',
      duration_value: 1,
      duration_unit: 'month',
      max_screens: 1,
      is_active: true
    });
  };

  const handleAddNew = () => {
    setEditingPlan(null);
    resetForm();
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingPlan(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(timeout);
  }, [error]);

  const columns = [
    {
      header: '#',
      accessor: 'id',
      render: (value, row, index) => index + 1,
    },
    {
      header: 'Plan Name',
      accessor: 'plan_name',
      bold: true,
    },
    {
      header: 'Stripe Price ID',
      accessor: 'stripe_price_id',
    },
    {
      header: 'Price',
      accessor: 'monthly_price',
      render: (value) => `$${value}`
    },
    {
      header: 'Duration',
      accessor: 'duration_value',
      render: (value, row) => `${value} ${row.duration_unit}(s)`
    },
    {
      header: 'Max Screens',
      accessor: 'max_screens',
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {value ? 'ACTIVE' : 'INACTIVE'}
        </span>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
              <p className="text-gray-600 mt-1">Manage Stripe pricing plans and screen limits</p>
            </div>
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer font-bold"
              >
                <FaPlus />
                <span>Add New Plan</span>
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fadeIn">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Plan Form */}
          {showForm && (
            <div className="mb-8 animate-fadeIn">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Plan Name</label>
                      <input
                        type="text"
                        name="plan_name"
                        value={formData.plan_name}
                        onChange={handleInputChange}
                        placeholder="e.g. Premium Monthly"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Stripe Price ID</label>
                      <input
                        type="text"
                        name="stripe_price_id"
                        value={formData.stripe_price_id}
                        onChange={handleInputChange}
                        placeholder="price_..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                        required
                        pattern="price_.*"
                        title="Stripe Price ID must start with 'price_'"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Price</label>
                      <input
                        type="text"
                        name="monthly_price"
                        value={formData.monthly_price}
                        onChange={handleInputChange}
                        placeholder="e.g. 40.99"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Duration Value</label>
                        <input
                          type="number"
                          name="duration_value"
                          value={formData.duration_value}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          required
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Duration Unit</label>
                        <select
                          name="duration_unit"
                          value={formData.duration_unit}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                          required
                        >
                          <option value="day">Day(s)</option>
                          <option value="week">Week(s)</option>
                          <option value="month">Month(s)</option>
                          <option value="year">Year(s)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Max Screens</label>
                      <input
                        type="number"
                        name="max_screens"
                        value={formData.max_screens}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                        min="1"
                      />
                    </div>
                    <div className="pt-8">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : ''}`}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                          Plan is Active
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 text-white py-4 px-4 rounded-xl font-black text-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                      {loading ? 'Processing...' : (editingPlan ? 'Update Subscription Plan' : 'Create Subscription Plan')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <DataTable
              columns={columns}
              data={plans}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
            />
          </div>

          {/* Pagination */}
          {!showForm && (plans.length > 0 || cursorHistory.length > 0) && (
            <CursorPagination
              hasMore={hasMore}
              currentPage={cursorHistory.length + 1}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              itemCount={plans.length}
              itemLabel="plan"
              itemLabelPlural="plans"
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default Plans;
