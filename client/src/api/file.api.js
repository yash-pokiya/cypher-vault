import api from './axios.instance';

export const fileAPI = {
  upload: (formData, onProgress, signal) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal,
      onUploadProgress: onProgress
        ? (evt) =>
            onProgress({
              loaded: evt.loaded,
              total: evt.total || evt.loaded,
              percentage: evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0,
            })
        : undefined,
    }),

  list: (params = {}) => api.get('/files', { params }),

  getMetadata: (id) => api.get(`/files/${id}/metadata`),

  delete: (id) => api.delete(`/files/${id}`),
};
