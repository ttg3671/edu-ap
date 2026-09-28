import axios from 'axios';

export const extractPublicId = (urlOrPath) => {
  if (!urlOrPath) return '';
  const clean = urlOrPath.split('?')[0];
  const match = clean.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (match && match[1]) {
    return match[1];
  }
  const cleanWithoutSlash = clean.replace(/^\/+/, '');
  return cleanWithoutSlash.replace(/\.[a-zA-Z0-9]+$/, '');
};

export const formatThumbnailPath = (urlOrData) => {
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

// "/uploads/abc.png" or a full Cloudinary URL -> "uploads/abc" (the format the delete API expects)
export const toCloudinaryPublicId = (pathOrUrl) => {
  if (!pathOrUrl) return '';
  const path = formatThumbnailPath(String(pathOrUrl).split('?')[0]);
  const id = path.startsWith('http') ? extractPublicId(path) : path;
  return id.replace(/^\/+/, '').replace(/\.[a-zA-Z0-9]+$/, '');
};

export const deleteCloudinaryImage = async (axiosPrivate, pathOrUrl) => {
  const public_id = toCloudinaryPublicId(pathOrUrl);
  if (!public_id) return;

  const response = await axiosPrivate.post('/api/v1/cloudinary/delete', { public_id });
  if (!response.data?.isSuccess) {
    throw new Error(response.data?.message || 'Failed to delete image');
  }
};

export const buildImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const imgBaseUrl = (import.meta.env.VITE_IMG_URL || '').replace(/\/+$/, '');
  return `${imgBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

// Signed upload: every param the server included in the signature must be sent
// to Cloudinary exactly as signed, otherwise the upload is rejected.
const SIGNED_PARAMS = ['folder', 'transformation', 'allowed_formats'];

export const uploadToCloudinary = async (axiosPrivate, file, onProgress) => {
  const sigResponse = await axiosPrivate.get('/api/v1/cloudinary/signature');

  if (!sigResponse.data?.isSuccess || !sigResponse.data?.data) {
    throw new Error(sigResponse.data?.message || 'Failed to get Cloudinary upload signature');
  }

  const sig = sigResponse.data.data;

  const cloudinaryFormData = new FormData();
  cloudinaryFormData.append('file', file);
  cloudinaryFormData.append('api_key', sig.api_key);
  cloudinaryFormData.append('timestamp', sig.timestamp);
  cloudinaryFormData.append('signature', sig.signature);
  SIGNED_PARAMS.forEach((key) => {
    if (sig[key] !== undefined && sig[key] !== null && sig[key] !== '') {
      cloudinaryFormData.append(key, sig[key]);
    }
  });

  const uploadResponse = await axios.post(
    `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
    cloudinaryFormData,
    {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    }
  );

  if (!uploadResponse.data?.secure_url) {
    throw new Error('Cloudinary upload did not return a valid secure URL');
  }

  return uploadResponse.data;
};
