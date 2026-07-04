import api from './axios.instance';

export const folderApi = {
  // List all folders (with file counts)
  list: () =>
    api.get('/folders').then((r) => r.data.data.folders),

  // Create new folder
  create: ({ name, color, icon, description }) =>
    api.post('/folders', { name, color, icon, description })
      .then((r) => r.data.data.folder),

  // Rename / update folder
  update: (folderId, updates) =>
    api.patch(`/folders/${folderId}`, updates)
      .then((r) => r.data.data.folder),

  // Delete folder (files stay, moved to All photos)
  delete: (folderId) =>
    api.delete(`/folders/${folderId}`).then((r) => r.data),

  // Move files to a folder (or null for All photos)
  moveFiles: (fileIds, targetFolderId) =>
    api.patch('/folders/move-files', { fileIds, targetFolderId })
      .then((r) => r.data),
};
