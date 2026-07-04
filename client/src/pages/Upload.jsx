import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import DropZone from '../components/upload/DropZone';
import UploadQueue from '../components/upload/UploadQueue';
import FolderSelector from '../components/ui/FolderSelector';
import { useEncryptedUpload } from '../hooks/useEncryptedUpload';
import { useFolders } from '../hooks/useFolders';

const Upload = () => {
  const { queue, uploadFiles, clearCompleted } = useEncryptedUpload();
  const { folders } = useFolders();
  const [searchParams] = useSearchParams();

  const queryFolderId = searchParams.get('folderId') || '';
  const [selectedFolderId, setSelectedFolderId] = useState(queryFolderId);

  // Sync folder selection if URL parameter updates
  useEffect(() => {
    if (queryFolderId) {
      setSelectedFolderId(queryFolderId);
    }
  }, [queryFolderId]);

  const selectedFolder = folders.find((f) => f._id === selectedFolderId);

  const handleFiles = (files) =>
    uploadFiles(files, selectedFolder ? selectedFolder.name : '', selectedFolderId || null);

  const activeCount = queue.filter((i) => ['encrypting', 'uploading'].includes(i.stage)).length;
  const doneCount   = queue.filter((i) => i.stage === 'done').length;

  return (
    <Layout>
      <div className="upload-page">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Upload Photos
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Photos are encrypted locally in your browser before upload
            </p>
          </div>
          {doneCount > 0 && (
            <Link
              to="/gallery"
              className="text-xs font-semibold hover:underline transition-colors flex-shrink-0 ml-2"
              style={{ color: 'var(--accent)' }}
            >
              View gallery →
            </Link>
          )}
        </div>

        {/* Custom Destination Folder Dropdown */}
        <div className="mb-5">
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Destination Folder (optional)
          </label>
          <FolderSelector
            folders={folders}
            value={selectedFolderId}
            onChange={setSelectedFolderId}
          />
        </div>

        <DropZone onFiles={handleFiles} disabled={activeCount > 0} />

        <UploadQueue queue={queue} onClearCompleted={clearCompleted} />
      </div>
    </Layout>
  );
};

export default Upload;
