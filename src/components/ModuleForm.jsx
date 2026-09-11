import { useState, useEffect, useCallback, useRef } from 'react';
import { FaUpload, FaTimes, FaCheckCircle } from 'react-icons/fa';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import axios from 'axios';

const extractPublicId = (urlOrPath) => {
  if (!urlOrPath) return '';
  const clean = urlOrPath.split('?')[0];
  const match = clean.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (match && match[1]) {
    return match[1];
  }
  const cleanWithoutSlash = clean.replace(/^\/+/, '');
  return cleanWithoutSlash.replace(/\.[a-zA-Z0-9]+$/, '');
};

const formatThumbnailPath = (urlOrData) => {
  if (!urlOrData) return '';
  if (typeof urlOrData === 'string') {
    const uploadsMatch = urlOrData.match(/(\/uploads\/.+)$/);
    if (uploadsMatch) {
      return uploadsMatch[1];
    }
    const relMatch = urlOrData.match(/(uploads\/.+)$/);
    if (relMatch) {
      return `/${relMatch[1]}`;
    }
    return urlOrData;
  }
  if (urlOrData.secure_url) {
    const match = urlOrData.secure_url.match(/(\/uploads\/.+)$/);
    if (match) return match[1];
  }
  if (urlOrData.public_id && urlOrData.format) {
    const cleanId = urlOrData.public_id.replace(/^\/+/, '');
    return `/${cleanId}.${urlOrData.format}`;
  }
  return urlOrData.secure_url || '';
};

function ModuleForm({ handleSubmit, editData = null, onCancel }) {
  const axiosPrivate = useAxiosPrivate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: null,
    is_active: false,
    is_free: false,
    categories: [], // Array of IDs
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [currentPublicId, setCurrentPublicId] = useState(null);

  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Category pagination state
  const [catCursor, setCatCursor] = useState(null);
  const [catHasMore, setCatHasMore] = useState(true);
  const catLimit = 15;
  
  const catCursorRef = useRef(null);
  const catLoadingRef = useRef(false);
  const catHasMoreRef = useRef(true);
  catCursorRef.current = catCursor;
  catLoadingRef.current = catLoading;
  catHasMoreRef.current = catHasMore;

  const fetchCategories = useCallback(async (reset = false) => {
    if (catLoadingRef.current) return;
    if (!reset && (!catHasMoreRef.current || catCursorRef.current === null || catCursorRef.current === undefined)) {
      return;
    }

    try {
      setCatLoading(true);
      catLoadingRef.current = true;
      const cursor = reset ? null : catCursorRef.current;
      let url = `/api/v1/admin/categories?limit=${catLimit}`;
      if (cursor !== null && cursor !== undefined && cursor !== '') {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }

      const response = await axiosPrivate.get(url);
      if (response.data?.isSuccess) {
        const newData = response.data.data || [];
        setAvailableCategories(prev => {
          const combined = reset ? newData : [...prev, ...newData];
          // Remove duplicates if any
          return Array.from(new Map(combined.map(item => [item.id, item])).values());
        });
        const next = response.data?.nextCursor ?? null;
        const more = !!response.data?.hasMore && next !== null;
        setCatCursor(next);
        catCursorRef.current = next;
        setCatHasMore(more);
        catHasMoreRef.current = more;
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setCatLoading(false);
      catLoadingRef.current = false;
    }
  }, [axiosPrivate]);

  const observer = useRef();
  const lastCatElementRef = useCallback(node => {
    if (catLoadingRef.current) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && catHasMoreRef.current && !catLoadingRef.current && catCursorRef.current !== null) {
        fetchCategories(false);
      }
    });
    if (node) observer.current.observe(node);
  }, [fetchCategories]);

  // Initial fetch
  useEffect(() => {
    fetchCategories(true);
  }, [fetchCategories]);

  // Populate form if editing
  useEffect(() => {
    if (editData) {
      // Handle categories mapping from structure: "categories": [{"id": 17}, {"id": 20}]
      let categoryIds = [];
      if (editData.categories && Array.isArray(editData.categories)) {
        categoryIds = editData.categories.map(cat => {
          if (typeof cat === 'object' && cat !== null) {
            return parseInt(cat.id || cat.category_id);
          }
          return parseInt(cat);
        }).filter(id => !isNaN(id));
      }

      setFormData({
        title: editData.title || '',
        description: editData.description || '',
        thumbnail_url: editData.thumbnail_url || null,
        is_active: editData.is_active === true || editData.is_active === 1 || editData.is_active === "1",
        is_free: editData.is_free === true || editData.is_free === 1 || editData.is_free === "1",
        categories: categoryIds,
      });

      // Set image preview and public_id if editing and has existing image
      if (editData.thumbnail_url) {
        const imgBaseUrl = (import.meta.env.VITE_IMG_URL || '').replace(/\/+$/, '');
        const path = editData.thumbnail_url;
        const previewUrl = path.startsWith('http')
          ? path
          : `${imgBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
        setImagePreview(previewUrl);
        setCurrentPublicId(extractPublicId(editData.thumbnail_url));
      } else {
        setImagePreview(null);
        setCurrentPublicId(null);
      }
    }
  }, [editData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleCategoryToggle = (id) => {
    setFormData(prev => {
      const current = prev.categories;
      if (current.includes(id)) {
        return { ...prev, categories: current.filter(catId => catId !== id) };
      } else {
        return { ...prev, categories: [...current, id] };
      }
    });
  };

  // Upload image to Cloudinary using signed upload API
  const uploadImageToCloudinary = async (file) => {
    setIsUploadingImage(true);
    setUploadProgress(0);
    setError('');

    try {
      // Step 1: Request upload signature from server
      const sigResponse = await axiosPrivate.get('/api/v1/cloudinary/signature');
      
      if (!sigResponse.data?.isSuccess || !sigResponse.data?.data) {
        throw new Error(sigResponse.data?.message || 'Failed to get Cloudinary upload signature');
      }

      const { signature, timestamp, folder, cloud_name, api_key } = sigResponse.data.data;

      // Step 2: Prepare FormData for Cloudinary signed upload
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);
      cloudinaryFormData.append('api_key', api_key);
      cloudinaryFormData.append('timestamp', timestamp);
      cloudinaryFormData.append('signature', signature);
      if (folder) {
        cloudinaryFormData.append('folder', folder);
      }

      // Step 3: Direct POST to Cloudinary upload endpoint
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
      const uploadResponse = await axios.post(cloudinaryUrl, cloudinaryFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      if (!uploadResponse.data?.secure_url) {
        throw new Error('Cloudinary upload did not return a valid secure URL');
      }

      const { secure_url, public_id } = uploadResponse.data;
      const relativePath = formatThumbnailPath(uploadResponse.data);

      // If user uploaded an uncommitted image in this same session, remove it to prevent orphans
      if (currentPublicId && currentPublicId !== public_id && !editData?.thumbnail_url?.includes(currentPublicId)) {
        try {
          const oldPath = formData.thumbnail_url || (currentPublicId.startsWith('/') ? currentPublicId : `/${currentPublicId}`);
          await axiosPrivate.post('/api/v1/cloudinary/delete', {
            public_id: oldPath
          });
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
        const imgBaseUrl = (import.meta.env.VITE_IMG_URL || '').replace(/\/+$/, '');
        const path = editData.thumbnail_url;
        const previewUrl = path.startsWith('http')
          ? path
          : `${imgBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
        setImagePreview(previewUrl);
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

      await uploadImageToCloudinary(file);
    }
  };

  // Delete image from Cloudinary via POST /api/v1/cloudinary/delete
  const removeImage = async () => {
    if (!formData.thumbnail_url && !imagePreview) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this image?');
    if (!confirmDelete) return;

    setIsDeletingImage(true);
    setError('');

    try {
      // Determine public_id: thumbnail url /uploads/img.jpg as public_id
      let publicIdToDelete = '';
      if (formData.thumbnail_url) {
        publicIdToDelete = formData.thumbnail_url.startsWith('/') 
          ? formData.thumbnail_url 
          : `/${formData.thumbnail_url}`;
      } else if (imagePreview) {
        publicIdToDelete = formatThumbnailPath(imagePreview) || extractPublicId(imagePreview);
        if (publicIdToDelete && !publicIdToDelete.startsWith('/')) {
          publicIdToDelete = `/${publicIdToDelete}`;
        }
      } else if (currentPublicId) {
        publicIdToDelete = currentPublicId.startsWith('/') 
          ? currentPublicId 
          : `/${currentPublicId}`;
      }

      if (publicIdToDelete) {
        const response = await axiosPrivate.post('/api/v1/cloudinary/delete', {
          public_id: publicIdToDelete
        });

        if (!response.data?.isSuccess && response.status !== 200 && response.status !== 204) {
          throw new Error(response.data?.message || 'Failed to delete image');
        }
      }

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
    setLoading(true);
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      setLoading(false);
      return;
    }

    if (!formData.thumbnail_url) {
      setError('Thumbnail is required');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        thumbnail_url: formatThumbnailPath(formData.thumbnail_url),
        is_active: formData.is_active ? true : false,
        is_free: formData.is_free ? true : false,
        categories: formData.categories,
      };

      await handleSubmit(submitData, editData?.id);

      if (!editData) {
        setFormData({
          title: '',
          description: '',
          thumbnail_url: null,
          is_active: false,
          is_free: false,
          categories: [],
        });
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

  // Get labels for selected categories that are already loaded
  const selectedCategoryObjects = availableCategories.filter(cat => formData.categories.includes(cat.id));

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
          placeholder="Enter module title"
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
          placeholder="Enter module description"
          rows="4"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-vertical"
          required
          disabled={loading}
        />
      </div>

      {/* Categories Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories (Scroll to load more)
        </label>
        
        {/* Selected Badges */}
        {selectedCategoryObjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedCategoryObjects.map(cat => (
              <span key={cat.id} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                {cat.name}
                <FaTimes className="cursor-pointer hover:text-emerald-900" onClick={() => handleCategoryToggle(cat.id)} />
              </span>
            ))}
          </div>
        )}

        <div className="border border-gray-300 rounded-lg p-1 max-h-64 overflow-y-auto bg-white shadow-inner">
          <div className="divide-y divide-gray-100">
            {availableCategories.map((cat, index) => {
              const isSelected = formData.categories.includes(cat.id);
              const isLast = availableCategories.length === index + 1;
              
              return (
                <div 
                  key={cat.id} 
                  ref={isLast ? lastCatElementRef : null}
                  onClick={() => handleCategoryToggle(cat.id)}
                  className={`flex items-center p-3 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'}`}>
                    {isSelected && <FaCheckCircle className="text-xs" />}
                  </div>
                  <span className={`ml-3 text-sm ${isSelected ? 'text-emerald-900 font-bold' : 'text-gray-700'}`}>
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
          
          {catLoading && (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
              <p className="text-xs text-gray-400 mt-1">Loading more options...</p>
            </div>
          )}

          {catHasMore && !catLoading && catCursor && (
            <div className="p-2 text-center">
              <button
                type="button"
                onClick={() => fetchCategories(false)}
                className="w-full text-xs text-center py-2 text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer border border-dashed border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                Load More Categories
              </button>
            </div>
          )}
          
          {!catHasMore && availableCategories.length > 0 && (
            <p className="text-center text-[10px] text-gray-400 py-3 uppercase tracking-widest font-bold">End of Filter Options</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors cursor-pointer" onClick={() => handleInputChange({target: {name: 'is_active', type: 'checkbox', checked: !formData.is_active}})}>
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            className="w-6 h-6 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
            disabled={loading}
          />
          <label htmlFor="is_active" className="text-xl font-bold text-gray-800 cursor-pointer">
            Is Active
          </label>
        </div>

        <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors cursor-pointer" onClick={() => handleInputChange({target: {name: 'is_free', type: 'checkbox', checked: !formData.is_free}})}>
          <input
            type="checkbox"
            id="is_free"
            name="is_free"
            checked={formData.is_free}
            onChange={handleInputChange}
            className="w-6 h-6 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
            disabled={loading}
          />
          <label htmlFor="is_free" className="text-xl font-bold text-gray-800 cursor-pointer">
            Is Free
          </label>
        </div>
      </div>

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
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              disabled={isDeletingImage || loading}
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
            onClick={() => document.getElementById('thumbnail_url').click()}
          >
            <FaUpload className="text-4xl text-gray-400 mb-3" />
            <p className="text-gray-600 mb-1 px-4 font-medium">Click to upload or drag image</p>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">16:9 ratio recommended (Max 5MB)</p>
          </div>
        )}

        <input
          type="file"
          id="thumbnail_url"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          disabled={loading || isUploadingImage || isDeletingImage}
        />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={loading || isUploadingImage || isDeletingImage}
          className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-md uppercase tracking-wider cursor-pointer"
        >
          {loading ? 'Saving...' : (editData ? 'Update Module' : 'Add Module')}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading || isUploadingImage || isDeletingImage}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-300 transition-colors disabled:opacity-50 uppercase tracking-wider cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ModuleForm;
