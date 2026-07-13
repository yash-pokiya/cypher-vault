import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import FolderSidebar from '../components/gallery/FolderSidebar';
import FolderGrid from '../components/gallery/FolderGrid';
import GalleryGrid from '../components/gallery/GalleryGrid';
import EmptyGallery from '../components/gallery/EmptyGallery';
import ImageSlider from '../components/gallery/ImageSlider';
import Spinner from '../components/ui/Spinner';
import { SkeletonGrid } from '../components/ui/Skeleton';
import ConfirmModal from '../components/ui/ConfirmModal';
import CreateFolderModal from '../components/gallery/CreateFolderModal';
import MoveToFolderModal from '../components/gallery/MoveToFolderModal';
import VaultUnlockModal from '../components/vault/VaultUnlockModal';
import { useCryptoContext } from '../context/CryptoContext';
import { useBatchDecrypt } from '../hooks/useBatchDecrypt';
import { useFolders } from '../hooks/useFolders';
import { fileAPI } from '../api/file.api';
import { withSlowNotice } from '../utils/slowNetworkNotice';

const Gallery = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectMode, setSelectMode] = useState(false);

  // Folder state
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);

  // Slider state
  const [sliderOpen, setSliderOpen] = useState(false);
  const [sliderIndex, setSliderIndex] = useState(0);

  // Bulk Delete Modal
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showFolderDeleteModal, setShowFolderDeleteModal] = useState(null);

  const { isVaultUnlocked, isRestoring } = useCryptoContext();
  const {
    folders,
    loading: foldersLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    moveFiles,
    reload: reloadFolders,
  } = useFolders();

  // ── Auto-decrypt all thumbnails ─────────────────────────────────
  const { thumbnails, progress } = useBatchDecrypt(files, isVaultUnlocked);

  const activeFolder = folders.find((f) => f._id === activeFolderId) || null;

  // ── Debounce Search ───────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Fetch Files ───────────────────────────────────────────────
  const fetchFiles = useCallback(async (pg = 1, q = '', folderIdParam = null) => {
    setLoading(true);
    try {
      const fetchPromise = fileAPI.list({
        page: pg,
        limit: 24,
        search: q || undefined,
        folderId: folderIdParam !== null ? folderIdParam : undefined,
      });

      const res = await withSlowNotice(fetchPromise, 'Fetching encrypted metadata from cloud storage…');
      const payload = res.data?.data || res.data || {};
      const filesList = Array.isArray(payload.files) ? payload.files : Array.isArray(payload) ? payload : [];
      const pagination = payload.pagination || { total: 0, hasMore: false };

      if (pg === 1) setFiles(filesList);
      else setFiles((f) => [...(Array.isArray(f) ? f : []), ...filesList]);
      setHasMore(!!pagination.hasMore);
      setTotal(pagination.total || 0);
    } catch {
      if (pg === 1) setFiles([]);
      toast.error('Unable to load gallery. Storage network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchFiles(1, debouncedSearch, activeFolderId);
  }, [debouncedSearch, activeFolderId, fetchFiles]);

  const handleDelete = useCallback(async (id) => {
    try {
      await fileAPI.delete(id);
      setFiles((f) => f.filter((file) => file._id !== id));
      setSelectedIds((s) => s.filter((itemId) => itemId !== id));
      setTotal((t) => Math.max(0, t - 1));
      reloadFolders();
    } catch {
      throw new Error('Unable to delete image.');
    }
  }, [reloadFolders]);

  const handleToggleSelect = useCallback((id) => {
    setSelectMode(true);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(files.map((f) => f._id));
    setSelectMode(true);
  }, [files]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds([]);
    setSelectMode(false);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;

    setDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => fileAPI.delete(id)));
      setFiles((prev) => prev.filter((file) => !selectedIds.includes(file._id)));
      setTotal((prev) => Math.max(0, prev - count));
      toast.success(`✔ ${count} ${count === 1 ? 'photo' : 'photos'} deleted`);
      setSelectedIds([]);
      setSelectMode(false);
      setShowBulkDeleteModal(false);
      reloadFolders();
    } catch {
      toast.error('Failed to delete some selected photos');
    } finally {
      setDeleting(false);
    }
  }, [selectedIds, reloadFolders]);

  const handleMoveSelected = async (targetFolderId) => {
    if (selectedIds.length === 0) return;
    try {
      await moveFiles(selectedIds, targetFolderId);
      toast.success('✔ Photos moved securely');
      setSelectedIds([]);
      setSelectMode(false);
      setShowMoveModal(false);
      fetchFiles(1, debouncedSearch, activeFolderId);
    } catch {
      toast.error('Could not move photos');
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!showFolderDeleteModal) return;
    const folderId = showFolderDeleteModal;
    try {
      await deleteFolder(folderId);
      toast.success('✔ Folder deleted');
      if (activeFolderId === folderId) setActiveFolderId(null);
      setShowFolderDeleteModal(null);
      fetchFiles(1, debouncedSearch, null);
    } catch {
      toast.error('Could not delete folder');
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchFiles(next, debouncedSearch, activeFolderId);
  };

  // ── Slider handlers ─────────────────────────────────────────
  const handleOpenSlider = useCallback((index) => {
    setSliderIndex(index);
    setSliderOpen(true);
  }, []);

  const handleCloseSlider = useCallback(() => {
    setSliderOpen(false);
  }, []);

  const handleSliderDelete = useCallback(async (id) => {
    await handleDelete(id);
    toast.success('✔ Image deleted');
  }, [handleDelete]);

  const selectedCount = selectedIds.length;

  return (
    <Layout search={search} setSearch={setSearch}>
      {/* Restoring session screen */}
      {isRestoring && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'var(--bg-primary)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{ textAlign: 'center' }}>
            <Spinner size="md" />
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 12 }}>
              Restoring secure session…
            </p>
          </div>
        </div>
      )}

      {/* Vault unlock modal */}
      {!isRestoring && !isVaultUnlocked && (
        <VaultUnlockModal />
      )}

      <div className="gallery-layout">
        {/* ── SIDEBAR ── */}
        <FolderSidebar
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={setActiveFolderId}
          onCreateFolder={() => {
            setEditingFolder(null);
            setShowCreateFolder(true);
          }}
          loading={foldersLoading}
        />

        {/* ── MAIN CONTENT ── */}
        <div className="gallery-main flex-1">
          {/* Toolbar */}
          <div className="gallery-toolbar">
            <div className="gallery-breadcrumb flex items-center gap-2">
              <span
                style={{
                  cursor: activeFolderId ? 'pointer' : 'default',
                  color: activeFolderId ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: 16,
                }}
                onClick={() => setActiveFolderId(null)}
              >
                {activeFolder ? 'All photos' : 'Gallery'}
              </span>
              {activeFolder && (
                <>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>›</span>
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>
                      {activeFolder.icon || '📁'} {activeFolder.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFolder(activeFolder);
                        setShowCreateFolder(true);
                      }}
                      style={{
                        background: 'var(--surface-input)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '2px 8px',
                        fontSize: 11,
                      }}
                      className="hover:text-[var(--text-primary)] transition-colors ml-1 font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFolderDeleteModal(activeFolder._id)}
                      style={{
                        background: 'var(--danger-subtle)',
                        border: '1px solid var(--danger)',
                        color: 'var(--danger)',
                        borderRadius: 'var(--radius-md)',
                        padding: '2px 8px',
                        fontSize: 11,
                      }}
                      className="hover:opacity-90 transition-opacity font-medium cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Toolbar buttons */}
            <div className="flex items-center gap-2">
              {/* Decrypt progress indicator */}
              {isVaultUnlocked && progress.total > 0 && progress.done < progress.total && (
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {progress.done}/{progress.total}
                </span>
              )}

              {files.length > 0 && !selectMode && (
                <button
                  onClick={() => setSelectMode(true)}
                  style={{
                    background: 'var(--surface-input)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold hover:border-[var(--border-strong)] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                  <span className="hidden sm:inline">Select</span>
                </button>
              )}

              {selectMode && (
                <>
                  <button
                    onClick={selectedCount === files.length ? handleDeselectAll : handleSelectAll}
                    style={{
                      background: 'var(--surface-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-md)',
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                  >
                    {selectedCount === files.length ? 'Deselect' : 'All'}
                  </button>

                  <button
                    onClick={handleDeselectAll}
                    style={{ color: 'var(--text-secondary)' }}
                    className="px-2.5 py-1.5 text-xs font-medium hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Folder chips */}
          <FolderGrid
            folders={folders}
            activeFolderId={activeFolderId}
            onOpenFolder={setActiveFolderId}
            onCreateFolder={() => {
              setEditingFolder(null);
              setShowCreateFolder(true);
            }}
            onDeleteFolder={(id) => setShowFolderDeleteModal(id)}
            onRenameFolder={(folder) => {
              setEditingFolder(folder);
              setShowCreateFolder(true);
            }}
          />

          {/* Photo grid */}
          {loading && files.length === 0 ? (
            <div className="px-1 sm:px-4">
              <div className="flex items-center justify-center gap-2 mb-4 px-1">
                <Spinner size="xs" />
                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Loading gallery…
                </span>
              </div>
              <SkeletonGrid count={9} />
            </div>
          ) : files.length === 0 ? (
            <EmptyGallery folderId={activeFolderId} />
          ) : (
            <>
              <GalleryGrid
                files={files}
                onDelete={handleDelete}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                thumbnails={thumbnails}
                onOpenSlider={handleOpenSlider}
              />

              {hasMore && (
                <div className="flex justify-center py-5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={loadMore}
                    disabled={loading}
                    style={{
                      background: 'var(--surface-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-md)',
                    }}
                    className="px-6 py-2.5 text-xs font-semibold hover:border-[var(--border-strong)] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Loading…' : 'Load more'}
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Fullscreen Image Slider ── */}
      <ImageSlider
        open={sliderOpen}
        onClose={handleCloseSlider}
        files={files}
        thumbnails={thumbnails}
        initialIndex={sliderIndex}
        onDelete={handleSliderDelete}
      />

      {/* Floating Multi-Select Action Bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-modal)',
              borderRadius: 'var(--radius-xl)',
            }}
            className="fixed bottom-[76px] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 p-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <div
                style={{ background: 'var(--accent)', color: '#FFFFFF' }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              >
                {selectedCount}
              </div>
              <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMoveModal(true)}
                style={{
                  background: 'var(--surface-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                }}
                className="px-3 py-2 text-xs font-semibold hover:border-[var(--border-strong)] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                📁 Move
              </button>

              <button
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={deleting}
                style={{
                  background: 'var(--danger)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                }}
                className="px-3 py-2 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? '…' : `Delete (${selectedCount})`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title={`Delete ${selectedCount} Selected Photos?`}
        message={`${selectedCount} encrypted photos will be permanently removed.`}
        confirmText="Delete Photos"
        cancelText="Cancel"
        isDanger={true}
        loading={deleting}
        loadingText="Deleting…"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
      />

      {/* Folder Delete Confirm */}
      <ConfirmModal
        isOpen={!!showFolderDeleteModal}
        title="Delete Folder?"
        message="Photos inside will remain in your main gallery."
        confirmText="Delete Folder"
        cancelText="Keep Folder"
        isDanger={true}
        onConfirm={handleConfirmDeleteFolder}
        onCancel={() => setShowFolderDeleteModal(null)}
      />

      {/* Create/Edit Folder */}
      {showCreateFolder && (
        <CreateFolderModal
          initialFolder={editingFolder}
          onClose={() => {
            setShowCreateFolder(false);
            setEditingFolder(null);
          }}
          onCreate={async (data) => {
            if (editingFolder) {
              await updateFolder(editingFolder._id, data);
            } else {
              await createFolder(data);
            }
          }}
        />
      )}

      {/* Move to Folder */}
      {showMoveModal && (
        <MoveToFolderModal
          folders={folders}
          currentFolderId={activeFolderId}
          onMove={handleMoveSelected}
          onClose={() => setShowMoveModal(false)}
        />
      )}
    </Layout>
  );
};

export default Gallery;
