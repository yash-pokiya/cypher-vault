import { useState, useEffect, useCallback } from 'react';
import { folderApi } from '../api/folder.api';
import toast from 'react-hot-toast';

export function useFolders() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFolders = useCallback(async () => {
    try {
      const data = await folderApi.list();
      setFolders(data || []);
    } catch {
      toast.error('Could not load folders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFolders(); }, [loadFolders]);

  const createFolder = async ({ name, color, icon, description }) => {
    const folder = await folderApi.create({ name, color, icon, description });
    setFolders((prev) => [folder, ...prev]);
    return folder;
  };

  const updateFolder = async (folderId, updates) => {
    const updated = await folderApi.update(folderId, updates);
    setFolders((prev) => prev.map((f) => (f._id === folderId ? { ...f, ...updated } : f)));
    return updated;
  };

  const deleteFolder = async (folderId) => {
    await folderApi.delete(folderId);
    setFolders((prev) => prev.filter((f) => f._id !== folderId));
    toast.success('Folder deleted. Files moved to All photos.');
  };

  const moveFiles = async (fileIds, targetFolderId) => {
    await folderApi.moveFiles(fileIds, targetFolderId);
    toast.success(`${fileIds.length} file${fileIds.length > 1 ? 's' : ''} moved`);
    await loadFolders();
  };

  return { folders, loading, createFolder, updateFolder, deleteFolder, moveFiles, reload: loadFolders };
}
