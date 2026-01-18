import { useAuth } from './AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';

interface SecureRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const SecureRoute = ({ children, requireAdmin }: SecureRouteProps) => {
  const { user, loading, isAdmin, adminLoading } = useAuth();
  const location = useLocation();

  // Wait for auth loading, and also wait for admin check if this route requires admin
  if (loading || (requireAdmin && adminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Enforce admin authorization for protected routes
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};