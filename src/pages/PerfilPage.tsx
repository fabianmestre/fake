import { useState } from 'react';
import { useSessionStore } from '../state/sessionStore';

export function PerfilPage() {
  const usuario = useSessionStore((s) => s.usuario);
  const cambiarClave = useSessionStore((s) => s.cambiarClave);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (nueva !== confirmacion) {
      setMensaje({ ok: false, texto: 'La confirmación no coincide con la nueva contraseña.' });
      return;
    }
    const resultado = cambiarClave(actual, nueva);
    setMensaje({ ok: resultado.ok, texto: resultado.mensaje });
    if (resultado.ok) {
      setActual('');
      setNueva('');
      setConfirmacion('');
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900">Perfil</h1>
      <p className="mb-6 text-sm text-gray-500">{usuario?.nombre} · {usuario?.rolUsuario}</p>

      {usuario?.rolUsuario === 'admin' ? (
        <form onSubmit={guardar} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-800">Cambiar contraseña</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Contraseña actual</label>
            <input
              type="password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Nueva contraseña</label>
            <input
              type="password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>
          {mensaje && <p className={`text-xs ${mensaje.ok ? 'text-emerald-600' : 'text-red-600'}`}>{mensaje.texto}</p>}
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Guardar contraseña
          </button>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
          El cambio de contraseña desde Perfil está disponible por ahora solo para el usuario administrador.
        </div>
      )}
    </div>
  );
}
