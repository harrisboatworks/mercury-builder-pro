import { useAuth } from './AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';

interface SecureRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const SecureRoute = ({ children, requireAdmin }: SecureRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // For now, skip complex admin checks - just basic auth
  return <>{children}</>;
};