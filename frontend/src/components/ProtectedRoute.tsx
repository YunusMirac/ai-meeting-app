import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { authServices } from '../services/authServices';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const AuthService = new authServices();
  
  if (!AuthService.isAuthenticated()) {
    // Nicht eingeloggt -> zur Login-Seite weiterleiten
    return <Navigate to="/login" replace />;
  }
  
  // Eingeloggt -> Inhalt anzeigen
  return <>{children}</>;
};

export default ProtectedRoute;
