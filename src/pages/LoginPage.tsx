import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../state/sessionStore';
import { USUARIOS_PRUEBA, CLAVE_DEMO } from '../data/usuariosPrueba';
import { IconShield } from '../components/layout/icons';

export function LoginPage() {
  const login = useSessionStore((s) => s.login);
  const error = useSessionStore((s) => s.error);
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');

  function entrar(e?: React.FormEvent) {
    e?.preventDefault();
    if (login(usuario, clave)) {
      navigate('/roles/simpatizante');
    }
  }

  function entrarComo(u: string) {
    setUsuario(u);
    setClave(CLAVE_DEMO);
    if (login(u, CLAVE_DEMO)) {
      navigate('/roles/simpatizante');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
            <IconShield className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">Concejo Valledupar</p>
            <p className="text-xs text-gray-500">Cesar · CRM Electoral (simulación)</p>
          </div>
        </div>

        <form onSubmit={entrar} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Usuario</label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Contraseña</label>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="••••"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Ingresar
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="mb-2 text-xs font-medium text-gray-500">Usuarios de prueba (clave: {CLAVE_DEMO})</p>
          <div className="grid grid-cols-1 gap-1.5">
            {USUARIOS_PRUEBA.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => entrarComo(u.usuario)}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-xs hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="font-medium text-gray-700">{u.nombre}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] uppercase text-gray-500">{u.rolUsuario}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
