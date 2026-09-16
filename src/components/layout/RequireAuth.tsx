import { Navigate } from 'react-router-dom';
import { useSessionStore } from '../../state/sessionStore';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const usuario = useSessionStore((s) => s.usuario);
  if (!usuario) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
