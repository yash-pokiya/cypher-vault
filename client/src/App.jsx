import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Gallery from './pages/Gallery';
import Upload from './pages/Upload';
import ImageDetail from './pages/ImageDetail';
import Profile from './pages/Profile';
import VaultSetupPage from './pages/VaultSetupPage';
import GlobalUploadWidget from './components/upload/GlobalUploadWidget';
import LeaveConfirmationModal from './components/upload/LeaveConfirmationModal';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user && user.vaultPasswordSet === false && location.pathname !== '/vault-setup') {
    return <Navigate to="/vault-setup" replace />;
  }

  if (user && user.vaultPasswordSet === true && location.pathname === '/vault-setup') {
    return <Navigate to="/gallery" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    if (user && user.vaultPasswordSet === false) {
      return <Navigate to="/vault-setup" replace />;
    }
    return <Navigate to="/gallery" replace />;
  }
  return children;
};

const App = () => (
  <>
    <Routes>
      <Route path="/"            element={<LandingPage />} />
      <Route path="/landing"     element={<LandingPage />} />

      <Route path="/login"       element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"    element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/vault-setup" element={<ProtectedRoute><VaultSetupPage /></ProtectedRoute>} />
      <Route path="/gallery"     element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
      <Route path="/gallery/:id" element={<ProtectedRoute><ImageDetail /></ProtectedRoute>} />
      <Route path="/upload"      element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>

    {/* Global Upload Manager Components */}
    <GlobalUploadWidget />
    <LeaveConfirmationModal />
  </>
);

export default App;
