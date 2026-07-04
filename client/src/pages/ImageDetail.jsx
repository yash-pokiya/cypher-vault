import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { useDecrypt } from '../hooks/useDecrypt';
import { fileAPI } from '../api/file.api';
import { formatBytes, formatDate } from '../utils/formatters';

const ImageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { decrypt, decrypting, decryptError } = useDecrypt();

  const [meta, setMeta]       = useState(null);
  const [decrypted, setDecrypted] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fileAPI.getMetadata(id)
      .then(({ data }) => setMeta(data.data))
      .catch(() => toast.error('File not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => () => { if (decrypted) decrypted.revoke(); }, [decrypted]);

  const handleDecrypt = async () => {
    try {
      const result = await decrypt(id);
      if (decrypted) decrypted.revoke();
      setDecrypted(result);
    } catch { /* handled in hook */ }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this file permanently?')) return;
    try {
      await fileAPI.delete(id);
      toast.success('Deleted');
      navigate('/gallery');
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    </Layout>
  );

  if (!meta) return (
    <Layout>
      <div className="p-8" style={{ color: 'var(--text-tertiary)' }}>File not found</div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          style={{ color: 'var(--text-secondary)' }}
          className="flex items-center gap-2 text-xs hover:text-[var(--text-primary)] mb-6 transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to gallery
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Preview panel */}
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
            }}
            className="aspect-square overflow-hidden flex items-center justify-center p-4"
          >
            {decrypted ? (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={decrypted.objectUrl}
                alt={meta.filename}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <svg className="w-14 h-14" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Encrypted Payload
                </p>
              </div>
            )}
          </div>

          {/* Metadata & Actions */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-xl font-bold break-all" style={{ color: 'var(--text-primary)' }}>
                {meta.filename}
              </h1>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Uploaded {formatDate(meta.uploadedAt)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Size', value: formatBytes(meta.size) },
                { label: 'MIME Type', value: meta.mimeType },
                { label: 'Encrypted size', value: formatBytes(meta.encryptedSize) },
                { label: 'Algorithm', value: meta.keyAlgorithm },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--surface-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                  }}
                  className="p-3"
                >
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {label}
                  </p>
                  <p className="text-xs font-semibold mt-0.5 break-all" style={{ color: 'var(--text-primary)' }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {decryptError && (
              <p className="text-xs p-3 rounded-lg" style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}>
                {decryptError}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button onClick={handleDecrypt} loading={decrypting} size="lg">
                {decrypted ? 'Re-decrypt' : '🔓 Decrypt & view'}
              </Button>
              <Button variant="danger" onClick={handleDelete} size="lg">
                Delete file
              </Button>
            </div>

            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-tertiary)',
              }}
              className="p-3 text-[11px] font-mono leading-relaxed"
            >
              <p>🔐 AES-256-GCM · PBKDF2 310k iter · AES-KW Wrapped Key</p>
              <p className="mt-1">Decryption takes place entirely in client memory.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ImageDetail;
