import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../state/sessionStore';
import { IconUserSwitch } from './icons';

export function Topbar() {
  const usuario = useSessionStore((s) => s.usuario);
  const logout = useSessionStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <button type="button" onClick={() => navigate('/perfil')} className="text-left text-sm text-gray-500 hover:text-gray-700">
        Sesión activa: <span className="font-medium text-gray-800">{usuario?.nombre}</span>
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <IconUserSwitch className="h-4 w-4" />
          Cambiar usuario
        </button>
      </div>
    </header>
  );
}
