import { Navigate } from 'react-router-dom';

import { useAuth } from '../state/auth';

export function RequireRole({ children, allowedRoles = [] }) {
  const { user } = useAuth();


  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length && !allowedRoles.includes(user.role))
    return <Navigate to="/dashboard" replace state={{ reason: 'forbidden' }} />;

  return children;
}

export const RequireAuth = RequireRole;
