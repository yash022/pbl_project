import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles, roles }) {
  const { user, loading } = useAuth();
  const roleList = allowedRoles || roles;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muj-beige">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-muj-orange/20 rounded-full" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login/student" replace />;

  if (roleList && !roleList.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children ?? <Outlet />;
}
