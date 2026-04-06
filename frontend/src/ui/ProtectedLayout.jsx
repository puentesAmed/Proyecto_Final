import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/state/auth.js';

export function ProtectedLayout({ children }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children;
}
