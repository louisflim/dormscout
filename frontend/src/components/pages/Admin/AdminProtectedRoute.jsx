import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminSessionValid } from '../../../utils/adminAuth';
import AdminPage from './AdminPage';

/**
 * Guards /admin/* routes: renders AdminPage only when a valid admin session exists.
 * Unauthenticated users still see the login UI inside AdminPage at /admin/overview.
 */
export default function AdminProtectedRoute() {
  const location = useLocation();
  const authed = isAdminSessionValid();

  const onLoginRoute =
    location.pathname === '/admin' ||
    location.pathname === '/admin/' ||
    location.pathname === '/admin/overview';

  if (!authed && !onLoginRoute) {
    return <Navigate to="/admin/overview" replace state={{ from: location.pathname }} />;
  }

  return <AdminPage />;
}
