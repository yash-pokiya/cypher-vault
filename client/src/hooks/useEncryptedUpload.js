import { useUploadContext, STAGES } from '../context/UploadContext';

export { STAGES };

export const useEncryptedUpload = () => {
  const uploadCtx = useUploadContext();

  return {
    queue: uploadCtx.queue,
    uploadFiles: uploadCtx.uploadFiles,
    cancelUpload: uploadCtx.cancelUpload,
    cancelAllUploads: uploadCtx.cancelAllUploads,
    retryUpload: uploadCtx.retryUpload,
    clearQueue: uploadCtx.clearQueue,
    clearCompleted: uploadCtx.clearCompleted,
    hasActiveUploads: uploadCtx.hasActiveUploads,
    STAGES,
  };
};
