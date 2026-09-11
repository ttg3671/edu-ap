import { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaPaperPlane, 
  FaEdit, 
  FaCheck, 
  FaExclamationTriangle, 
  FaTimes, 
  FaCheckCircle,
  FaMobileAlt
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const DEFAULT_TITLE = 'Edu Garcia Movimiento 💪';

function Notifications() {
  const [formData, setFormData] = useState({
    title: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Confirmation dialog step: 0 = closed, 1 = first confirm, 2 = second confirm
  const [confirmStep, setConfirmStep] = useState(0);

  const axiosPrivate = useAxiosPrivate();

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Called when user clicks "Send Notification" on the main form
  const handleInitiateSend = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Message is required
    if (!formData.message.trim()) {
      setError('Notification message is required.');
      return;
    }

    // Open first confirmation dialog
    setConfirmStep(1);
  };

  // Step 1: User clicks "Confirm" -> Move to Step 2
  const handleFirstConfirm = () => {
    setConfirmStep(2);
  };

  // User clicks "Edit" in either dialog -> Close dialogs to edit form
  const handleCancelToEdit = () => {
    setConfirmStep(0);
  };

  // Step 2: Final Confirm -> Execute POST request
  const handleFinalConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        title: formData.title.trim() || DEFAULT_TITLE,
        message: formData.message.trim()
      };

      const response = await axiosPrivate.post('/api/v1/notifications/send', payload);

      // console.log(response.data);

      if (response.data?.isSuccess) {
        setSuccessMessage('Notification broadcast sent successfully!');
        setFormData({ title: '', message: '' });
        setConfirmStep(0);
      } else {
        throw new Error(response.data?.data || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      setError(err.response?.data?.message || err.message || 'Failed to send notification');
      setConfirmStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear the form?')) {
      setFormData({ title: '', message: '' });
      setError('');
      setSuccessMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl">
                <FaBell className="text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Send Notification</h1>
                <p className="text-gray-600 mt-1">
                  Broadcast real-time push notifications to all users. Notifications are sent immediately and are not stored in the database.
                </p>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-emerald-600 text-xl flex-shrink-0" />
                <p className="text-emerald-800 font-medium">{successMessage}</p>
              </div>
              <button 
                onClick={() => setSuccessMessage('')}
                className="text-emerald-600 hover:text-emerald-800 cursor-pointer p-1"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-red-600 text-xl flex-shrink-0" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
              <button 
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800 cursor-pointer p-1"
              >
                <FaTimes />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Main Form Area (2 cols on lg) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <div className="border-b border-gray-100 pb-4 mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Notification Details</h2>
                  <p className="text-xs text-gray-500">Fill in the title and message to broadcast.</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                  Live Broadcast
                </span>
              </div>

              <form onSubmit={handleInitiateSend} className="space-y-6">
                {/* Title Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
                      Notification Title <span className="text-xs font-normal text-gray-500">(Optional — defaults to "{DEFAULT_TITLE}")</span>
                    </label>
                    <span className="text-xs text-gray-400">
                      {formData.title.length > 0 ? `${formData.title.length} characters` : 'Default'}
                    </span>
                  </div>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Edu Garcia Movimiento"
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400"
                  />
                </div>

                {/* Message Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                      Notification Message <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-gray-400">
                      {formData.message.length} characters
                    </span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="e.g. Check out our brand new full-body HIIT routine now available under Workouts."
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400 resize-vertical"
                    required
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Keep your message clear and concise for optimal visibility on mobile lock screens.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={loading || !formData.message.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <FaPaperPlane className="text-sm" />
                    <span>Send Notification</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading || (!formData.title && !formData.message)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-5 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {/* Side Device Live Preview (1 col on lg) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                <FaMobileAlt className="text-gray-500 text-lg" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Mobile Preview
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Preview of how the notification banner will appear on a user's mobile device:
              </p>

              {/* Simulated Mobile Notification Card */}
              <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl p-4 text-white shadow-xl border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                      FA
                    </div>
                    <span className="text-xs font-semibold text-gray-200">Fitness App</span>
                  </div>
                  <span className="text-[10px] text-gray-400">now</span>
                </div>

                <div className="pl-7">
                  <h4 className="text-sm font-bold text-white break-words">
                    {formData.title.trim() || DEFAULT_TITLE}
                  </h4>
                  <p className="text-xs text-gray-300 mt-1 break-words leading-relaxed">
                    {formData.message.trim() || 'Notification message will appear here for the user to read.'}
                  </p>
                </div>
              </div>

              {/* Information callout */}
              <div className="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <FaExclamationTriangle className="text-amber-600" />
                  <span>Important Note</span>
                </div>
                <p>
                  Clicking "Send Notification" will prompt for confirmation twice to prevent accidental broadcasts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* FIRST CONFIRMATION DIALOG BOX (Step 1 of 2)                               */}
      {/* ========================================================================= */}
      {confirmStep === 1 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 transform transition-all">
            {/* Header */}
            <div className="bg-amber-500 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <FaExclamationTriangle className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Confirm Notification</h3>
                  <p className="text-xs text-amber-100">Step 1 of 2: Review Content</p>
                </div>
              </div>
              <button
                onClick={handleCancelToEdit}
                className="text-white/80 hover:text-white transition-colors cursor-pointer p-1"
                aria-label="Close"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 text-sm mb-4 font-medium">
                Please review the notification details below before proceeding:
              </p>

              {/* Review Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Title
                  </span>
                  <div className="text-sm font-bold text-gray-900 bg-white p-2.5 rounded-lg border border-gray-200 break-words flex items-center justify-between">
                    <span>{formData.title.trim() || DEFAULT_TITLE}</span>
                    {!formData.title.trim() && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                        Default
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Message
                  </span>
                  <p className="text-sm text-gray-800 bg-white p-2.5 rounded-lg border border-gray-200 break-words whitespace-pre-wrap">
                    {formData.message}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Click <span className="font-semibold text-gray-700">"Edit"</span> to return and make changes, or <span className="font-semibold text-emerald-700">"Confirm"</span> to proceed to final verification.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelToEdit}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <FaEdit className="text-sm text-gray-500" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handleFirstConfirm}
                className="px-5 py-2.5 rounded-lg font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
              >
                <FaCheck className="text-sm" />
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECOND CONFIRMATION DIALOG BOX (Step 2 of 2 - Final Confirmation)         */}
      {/* ========================================================================= */}
      {confirmStep === 2 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-red-100 transform transition-all">
            {/* Header */}
            <div className="bg-red-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <FaExclamationTriangle className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Final Confirmation</h3>
                  <p className="text-xs text-red-100">Step 2 of 2: Immediate Broadcast</p>
                </div>
              </div>
              <button
                onClick={handleCancelToEdit}
                disabled={loading}
                className="text-white/80 hover:text-white transition-colors cursor-pointer p-1 disabled:opacity-50"
                aria-label="Close"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4 text-red-800 text-sm">
                <p className="font-bold flex items-center gap-2 mb-1">
                  <FaExclamationTriangle className="text-red-600" />
                  Are you absolutely sure you want to send this now?
                </p>
                <p className="text-xs text-red-700 leading-relaxed">
                  This action cannot be undone. The notification will be dispatched live to all users' devices immediately.
                </p>
              </div>

              {/* Compact Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-500 w-16 flex-shrink-0">Title:</span>
                  <span className="font-semibold text-gray-900 truncate">
                    {formData.title.trim() || DEFAULT_TITLE}
                  </span>
                  {!formData.title.trim() && (
                    <span className="text-[10px] text-gray-400 font-normal">
                      (default)
                    </span>
                  )}
                </div>
                <div className="flex">
                  <span className="font-bold text-gray-500 w-16 flex-shrink-0">Message:</span>
                  <span className="text-gray-700 line-clamp-2">{formData.message}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelToEdit}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaEdit className="text-sm text-gray-500" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="text-sm" />
                    <span>Confirm & Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
