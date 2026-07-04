import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CryptoProvider } from './context/CryptoContext';
import { UploadProvider } from './context/UploadContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CryptoProvider>
          <UploadProvider>
            <App />
            <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#18181b',
                color: '#f4f4f5',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
                fontSize: '14px',
                padding: '10px 14px',
              },
              success: { iconTheme: { primary: '#34d399', secondary: '#18181b' } },
              error:   { iconTheme: { primary: '#f87171', secondary: '#18181b' } },
            }}
          >
            {(t) => (
              <ToastBar toast={t}>
                {({ icon, message }) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {icon}
                    {message}
                    {t.type !== 'loading' && (
                      <button
                        type="button"
                        onClick={() => toast.dismiss(t.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#a1a1aa',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '700',
                          padding: '2px 4px',
                          marginLeft: '8px',
                          lineHeight: 1,
                          borderRadius: '4px',
                          transition: 'color 0.15s ease',
                        }}
                        className="hover:text-white"
                        title="Close notification"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </ToastBar>
            )}
          </Toaster>
        </UploadProvider>
      </CryptoProvider>
    </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
