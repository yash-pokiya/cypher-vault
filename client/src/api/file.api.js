import api from './axios.instance';

export const fileAPI = {
  upload: (formData, onProgress) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (evt) => evt.total && onProgress(Math.round((evt.loaded / evt.total) * 100))
        : undefined,
    }),

  list: (params = {}) => api.get('/files', { params }),

  getMetadata: (id) => api.get(`/files/${id}/metadata`),

  delete: (id) => api.delete(`/files/${id}`),
};
