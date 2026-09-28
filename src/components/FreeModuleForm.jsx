import { useState, useEffect } from 'react';
import { FaUpload, FaTimes, FaCheckCircle, FaLaptop, FaMobileAlt } from 'react-icons/fa';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { extractPublicId, formatThumbnailPath, buildImageUrl, uploadToCloudinary, deleteCloudinaryImage } from '../utils/cloudinary';

const EMPTY_FORM = {
  title: '',
  description: '',
  thumbnail_url: null,
  is_active: false,
  video_url: '',
  ui_style: 'horizontal',
};

const extractVimeoId = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : '';
};

function FreeModuleForm({ handleSubmit, editData = null, onCancel }) {
  const axiosPrivate = useAxiosPrivate();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [currentPublicId, setCurrentPublicId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || '',
        description: editData.description || '',
        thumbnail_url: editData.thumbnail_url || null,
        is_active: editData.is_active === true || editData.is_active === 1 || editData.is_active === "1",
        video_url: editData.video_provider_id ? String(editData.video_provider_id) : '',
        ui_style: editData.ui_style || 'horizontal',
      });

      if (editData.thumbnail_url) {
        setImagePreview(buildImageUrl(editData.thumbnail_url));
        setCurrentPublicId(extractPublicId(editData.thumbnail_url));
      } else {
        setImagePreview(null);
        setCurrentPublicId(null);
      }
    } else {
      setFormData(EMPTY_FORM);
      setImagePreview(null);
      setCurrentPublicId(null);
    }
  }, [editData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const uploadImage = async (file) => {
    setIsUploadingImage(true);
    setUploadProgress(0);
    setError('');

    try {
      const uploaded = await uploadToCloudinary(axiosPrivate, file, setUploadProgress);
      const { secure_url, public_id } = uploaded;
      const relativePath = formatThumbnailPath(uploaded);

      // If user uploaded an uncommitted image in this same session, remove it to prevent orphans
      if (currentPublicId && currentPublicId !== public_id && !editData?.thumbnail_url?.includes(currentPublicId)) {
        try {
          await deleteCloudinaryImage(axiosPrivate, formData.thumbnail_url || currentPublicId);
        } catch (delErr) {
          console.warn('Failed to clean up previous temporary image:', delErr);
        }
      }

      setImagePreview(secure_url);
      setFormData(prev => ({ ...prev, thumbnail_url: relativePath }));
      setCurrentPublicId(public_id);
    } catch (err) {
      console.error('Error uploading image to Cloudinary:', err);
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to upload image'
      );

      // Revert to previous saved image if editing
      if (editData?.thumbnail_url) {
        setImagePreview(buildImageUrl(editData.thumbnail_url));
        setFormData(prev => ({ ...prev, thumbnail_url: formatThumbnailPath(editData.thumbnail_url) }));
        setCurrentPublicId(extractPublicId(editData.thumbnail_url));
      } else {
        setImagePreview(null);
        setFormData(prev => ({ ...prev, thumbnail_url: null }));
        setCurrentPublicId(null);
      }
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      // Reset input value so re-selecting same file fires onChange
      e.target.value = '';

      await uploadImage(file);
    }
  };

  const removeImage = async () => {
    if (!formData.thumbnail_url && !imagePreview) return;
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    setIsDeletingImage(true);
    setError('');

    try {
      await deleteCloudinaryImage(axiosPrivate, formData.thumbnail_url || currentPublicId || imagePreview);

      setFormData(prev => ({ ...prev, thumbnail_url: null }));
      setImagePreview(null);
      setCurrentPublicId(null);
    } catch (err) {
      console.error('Error deleting image from Cloudinary:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete image');
    } finally {
      setIsDeletingImage(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.thumbnail_url) {
      setError('Thumbnail is required');
      return;
    }
    const videoProviderId = extractVimeoId(formData.video_url);
    if (!videoProviderId) {
      setError('Please enter a valid Vimeo URL or ID');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        thumbnail_url: formatThumbnailPath(formData.thumbnail_url),
        is_active: !!formData.is_active,
        video_provider_id: videoProviderId,
        ui_style: formData.ui_style,
      };

      await handleSubmit(submitData, editData?.id ?? editData?.module_id);

      if (!editData) {
        setFormData(EMPTY_FORM);
        setImagePreview(null);
        setCurrentPublicId(null);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || isUploadingImage || isDeletingImage;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter free workout title"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Enter free workout description"
          rows="4"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-vertical"
          required
          disabled={loading}
        />
      </div>

      <div
        className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors cursor-pointer"
        onClick={() => handleInputChange({ target: { name: 'is_active', type: 'checkbox', checked: !formData.is_active } })}
      >
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onChange={handleInputChange}
          onClick={(e) => e.stopPropagation()}
          className="w-6 h-6 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
          disabled={loading}
        />
        <label htmlFor="is_active" className="text-xl font-bold text-gray-800 cursor-pointer" onClick={(e) => e.stopPropagation()}>
          Is Active
        </label>
      </div>

      {/* Video Layout */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Layout Style <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'horizontal', icon: FaLaptop, label: 'Horizontal', desc: 'Best for TV/Laptop' },
            { id: 'vertical', icon: FaMobileAlt, label: 'Vertical', desc: 'Best for Mobile' }
          ].map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, ui_style: style.id }))}
              disabled={loading}
              className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                formData.ui_style === style.id
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                  : "border-gray-200 bg-white text-gray-500 hover:border-emerald-200"
              }`}
            >
              <style.icon className="text-3xl" />
              <div className="text-center">
                <p className="font-bold">{style.label}</p>
                <p className="text-[10px] opacity-75">{style.desc}</p>
              </div>
              {formData.ui_style === style.id && <FaCheckCircle className="text-emerald-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* Vimeo URL */}
      <div>
        <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-2">
          Vimeo Link or ID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="video_url"
          name="video_url"
          value={formData.video_url}
          onChange={handleInputChange}
          placeholder="https://vimeo.com/..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
          disabled={loading}
        />
      </div>

      {/* Thumbnail */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thumbnail Image (16:9) <span className="text-red-500">*</span>
        </label>

        {isUploadingImage ? (
          <div className="mb-4 border-2 border-emerald-400 rounded-lg aspect-video flex flex-col items-center justify-center text-center bg-emerald-50/50 shadow-inner">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent mb-3"></div>
            <p className="text-emerald-800 font-semibold text-sm">Uploading to Cloudinary...</p>
            {uploadProgress > 0 && (
              <div className="w-52 bg-gray-200 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            <p className="text-xs text-emerald-600 mt-1 font-medium">{uploadProgress}%</p>
          </div>
        ) : imagePreview ? (
          <div className="relative mb-4 w-full aspect-video overflow-hidden rounded-lg border-2 border-gray-300 bg-gray-100 shadow-md group">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              disabled={busy}
              title="Delete Image from Cloudinary"
              className="absolute top-2 right-2 p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center"
            >
              {isDeletingImage ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaTimes className="text-sm" />
              )}
            </button>
          </div>
        ) : (
          <div
            className="mb-4 border-2 border-dashed border-gray-300 rounded-lg aspect-video flex flex-col items-center justify-center text-center hover:border-emerald-500 transition-colors bg-gray-50 cursor-pointer"
            onClick={() => document.getElementById('free_thumbnail_url').click()}
          >
            <FaUpload className="text-4xl text-gray-400 mb-3" />
            <p className="text-gray-600 mb-1 px-4 font-medium">Click to upload image</p>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">JPG, PNG or WEBP · 16:9 recommended (Max 5MB)</p>
          </div>
        )}

        <input
          type="file"
          id="free_thumbnail_url"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="hidden"
          disabled={busy}
        />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-md uppercase tracking-wider cursor-pointer"
        >
          {loading ? 'Saving...' : (editData ? 'Update Free Module' : 'Add Free Module')}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-300 transition-colors disabled:opacity-50 uppercase tracking-wider cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default FreeModuleForm;
