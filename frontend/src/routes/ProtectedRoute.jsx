import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export function PrivateRoute({ children }) {

  const { user } = useAuth();

  return user ? children : <Navigate to="/login" replace />;

}

export function RoleRoute({ role, children }) {

  const { user, hasRole } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!hasRole(role)) {

    if (hasRole('ROLE_ADMIN')) return <Navigate to="/admin/dashboard" replace />;

    if (hasRole('ROLE_DOCTOR')) return <Navigate to="/doctor/dashboard" replace />;
    
    return <Navigate to="/patient/dashboard" replace />;
  }

  return children;
}
