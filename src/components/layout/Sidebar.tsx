import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../state/sessionStore';
import { LIDER_PUEDE_DIGITAR } from '../../lib/permisos';
import {
  IconChevronDown,
  IconChevronLeft,
  IconFlag,
  IconGrid,
  IconHandshake,
  IconListCheck,
  IconMap,
  IconMegaphone,
  IconPencilPlus,
  IconShield,
  IconUsers,
} from './icons';

const ROLES_SUBITEMS = [
  { path: '/roles/padrino', label: 'Padrino' },
  { path: '/roles/lider', label: 'Líder' },
  { path: '/roles/simpatizante', label: 'Simpatizante' },
  { path: '/roles/gestor', label: 'Gestor' },
  { path: '/roles/digitador', label: 'Digitador' },
];

interface SidebarProps {
  colapsado: boolean;
  onToggle: () => void;
}

export function Sidebar({ colapsado, onToggle }: SidebarProps) {
  const location = useLocation();
  const usuario = useSessionStore((s) => s.usuario);
  const esDigitador = usuario?.rolUsuario === 'digitador';
  const esLider = usuario?.rolUsuario === 'lider';
  const esGestor = usuario?.rolUsuario === 'gestor';
  const enRoles = location.pathname.startsWith('/roles');
  const [rolesAbierto, setRolesAbierto] = useState(enRoles);

  const itemBase =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';
  const itemInactivo = 'text-slate-300 hover:bg-slate-800 hover:text-white';
  const itemActivo = 'bg-blue-600 text-white';

  return (
    <aside className={`flex h-full flex-col bg-slate-900 transition-all ${colapsado ? 'w-[76px]' : 'w-72'}`}>
      <div
        className={`flex items-center border-b border-slate-800 py-4 ${
          colapsado ? 'flex-col gap-2 px-2' : 'gap-3 px-4'
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <IconShield className="h-5 w-5 text-white" />
        </div>
        {!colapsado && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Concejo Valledupar</p>
            <p className="truncate text-xs text-slate-400">Cesar · CRM Electoral</p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white ${colapsado ? '' : 'ml-auto'}`}
          aria-label="Colapsar menú"
        >
          <IconChevronLeft className={`h-4 w-4 transition-transform ${colapsado ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {esDigitador ? (
          <NavLink to="/digitador/registrar" className={({ isActive }) => `${itemBase} ${isActive ? itemActivo : itemInactivo}`}>
            <IconPencilPlus className="h-5 w-5 shrink-0" />
            {!colapsado && <span>Registrar Simpatizante</span>}
          </NavLink>
        ) : esLider ? (
          <>
            {LIDER_PUEDE_DIGITAR && (
              <NavLink to="/lider/registrar" className={({ isActive }) => `${itemBase} ${isActive ? itemActivo : itemInactivo}`}>
                <IconPencilPlus className="h-5 w-5 shrink-0" />
                {!colapsado && <span>Registrar Simpatizante</span>}
              </NavLink>
            )}
            <NavLink to="/lider/mis-registros" className={({ isActive }) => `${itemBase} ${isActive ? itemActivo : itemInactivo}`}>
              <IconListCheck className="h-5 w-5 shrink-0" />
              {!colapsado && <span>Mis Registros</span>}
            </NavLink>
          </>
        ) : esGestor ? (
          <NavLink to="/gestor/mis-asignaciones" className={({ isActive }) => `${itemBase} ${isActive ? itemActivo : itemInactivo}`}>
            <IconListCheck className="h-5 w-5 shrink-0" />
            {!colapsado && <span>Mis Asignaciones</span>}
          </NavLink>
        ) : (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `${itemBase} ${isActive ? itemActivo : itemInactivo}`}>
              <IconGrid className="h-5 w-5 shrink-0" />
              {!colapsado && <span>Dashboard</span>}
            </NavLink>

            <div>
              <button
                type="button"
                onClick={() => setRolesAbierto((v) => !v)}
                className={`${itemBase} w-full ${enRoles ? 'bg-slate-800 text-white' : itemInactivo}`}
              >
                <IconUsers className="h-5 w-5 shrink-0" />
                {!colapsado && (
                  <>
                    <span className="flex-1 text-left">Roles</span>
                    <IconChevronDown className={`h-4 w-4 transition-transform ${rolesAbierto ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              {!colapsado && rolesAbierto && (
                <div className="ml-4 mt-1 space-y-1 border-l border-slate-800 pl-4">
                  {ROLES_SUBITEMS.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `block rounded-md px-3 py-2 text-sm ${
                          isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            <NavLink to="/gestiones" className={({ isActive }) => `${itemBase} ${isActive ? itemActivo : itemInactivo}`}>
              <IconHandshake className="h-5 w-5 shrink-0" />
              {!colapsado && <span>Gestiones</span>}
            </NavLink>

            <NavLink to="/comunicaciones" className={({ isActive }) => `${itemBase} ${isActive ? itemActivo : itemInactivo}`}>
              <IconMegaphone className="h-5 w-5 shrink-0" />
              {!colapsado && <span>Comunicaciones</span>}
            </NavLink>

            <NavLink to="/dia-e" className={({ isActive }) => `${itemBase} ${isActive ? itemActivo : itemInactivo}`}>
              <IconFlag className="h-5 w-5 shrink-0" />
              {!colapsado && <span>Día-E</span>}
            </NavLink>

            <NavLink to="/mapa-talento" className={({ isActive }) => `${itemBase} ${isActive ? itemActivo : itemInactivo}`}>
              <IconMap className="h-5 w-5 shrink-0" />
              {!colapsado && <span>Mapa de Talento</span>}
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
