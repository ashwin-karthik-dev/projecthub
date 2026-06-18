import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from './ui';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen label="Checking session…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
