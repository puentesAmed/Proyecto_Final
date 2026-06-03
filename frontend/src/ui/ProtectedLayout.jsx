import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/state/auth.js';
import { useNotifications } from '@/state/notifications.js';

export function ProtectedLayout({ children }) {
  const { user, token } = useAuth();
  const startNotificationSession = useNotifications((state) => state.startSession);
  const location = useLocation();

  React.useEffect(() => {
    if (user && token) {
      startNotificationSession(user.id || user._id);
    }
  }, [startNotificationSession, token, user]);

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children;
}
