import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../state/sessionStore';
import { LIDER_PUEDE_DIGITAR } from '../../lib/permisos';

function rutasPermitidas(rolUsuario: string | undefined): string[] | null {
  if (rolUsuario === 'digitador') return ['/digitador/registrar', '/perfil'];
  if (rolUsuario === 'lider') {
    return [...(LIDER_PUEDE_DIGITAR ? ['/lider/registrar'] : []), '/lider/mis-registros', '/perfil'];
  }
  if (rolUsuario === 'gestor') return ['/gestor/mis-asignaciones', '/perfil'];
  return null;
}

function destinoPorDefecto(rolUsuario: string | undefined): string {
  if (rolUsuario === 'digitador') return '/digitador/registrar';
  if (rolUsuario === 'lider') return LIDER_PUEDE_DIGITAR ? '/lider/registrar' : '/lider/mis-registros';
  if (rolUsuario === 'gestor') return '/gestor/mis-asignaciones';
  return '/dashboard';
}

export function RestringirPorRol() {
  const usuario = useSessionStore((s) => s.usuario);
  const location = useLocation();

  const permitidas = rutasPermitidas(usuario?.rolUsuario);
  if (permitidas && !permitidas.includes(location.pathname)) {
    return <Navigate to={destinoPorDefecto(usuario?.rolUsuario)} replace />;
  }

  return <Outlet />;
}
