import { useMemo, useState } from 'react';
import { useUsuariosStore } from '../state/usuariosStore';
import { StatCard } from '../components/common/StatCard';
import type { RolUsuario, UsuarioPrueba } from '../types';

const ROL_ESTILOS: Record<RolUsuario, string> = {
  admin: 'bg-rose-50 text-rose-700',
  lider: 'bg-blue-50 text-blue-700',
  gestor: 'bg-amber-50 text-amber-700',
  digitador: 'bg-teal-50 text-teal-700',
};

const ROL_LABEL: Record<RolUsuario, string> = {
  admin: 'Admin',
  lider: 'Líder',
  gestor: 'Gestor',
  digitador: 'Digitador',
};

function FilaCredencial({
  cuenta,
  onActivar,
  onDesactivar,
  onRestablecer,
}: {
  cuenta: UsuarioPrueba;
  onActivar: () => void;
  onDesactivar: () => void;
  onRestablecer: () => string;
}) {
  const [visible, setVisible] = useState(false);
  const [claveMostrada, setClaveMostrada] = useState(cuenta.clave);
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    navigator.clipboard?.writeText(claveMostrada).then(() => {
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    });
  }

  function restablecer() {
    if (!confirm(`¿Generar una nueva contraseña para ${cuenta.nombre}? La anterior dejará de funcionar.`)) return;
    const nueva = onRestablecer();
    setClaveMostrada(nueva);
    setVisible(true);
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-900">{cuenta.nombre}</td>
      <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{cuenta.usuario}</td>
      <td className="whitespace-nowrap px-4 py-2.5">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROL_ESTILOS[cuenta.rolUsuario]}`}>{ROL_LABEL[cuenta.rolUsuario]}</span>
      </td>
      <td className="whitespace-nowrap px-4 py-2.5">
        <div className="flex items-center gap-2 font-mono text-xs text-gray-600">
          <span>{visible ? claveMostrada : '•'.repeat(15)}</span>
          <button type="button" onClick={() => setVisible((v) => !v)} className="text-gray-400 hover:text-gray-600" title={visible ? 'Ocultar' : 'Mostrar'}>
            {visible ? '🙈' : '👁'}
          </button>
          <button type="button" onClick={copiar} className="text-gray-400 hover:text-gray-600" title="Copiar">
            {copiado ? '✓' : '⧉'}
          </button>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-2.5">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cuenta.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {cuenta.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{cuenta.fechaCreacion}</td>
      <td className="whitespace-nowrap px-4 py-2.5 text-right">
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={restablecer} className="text-xs font-medium text-blue-600 hover:underline">
            Restablecer clave
          </button>
          {cuenta.activo ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Desactivar el acceso de ${cuenta.nombre}? No podrá iniciar sesión hasta que lo reactives.`)) onDesactivar();
              }}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Desactivar
            </button>
          ) : (
            <button type="button" onClick={onActivar} className="text-xs font-medium text-emerald-600 hover:underline">
              Activar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function CredencialesPage() {
  const usuarios = useUsuariosStore((s) => s.usuarios);
  const activarUsuario = useUsuariosStore((s) => s.activarUsuario);
  const desactivarUsuario = useUsuariosStore((s) => s.desactivarUsuario);
  const restablecerClave = useUsuariosStore((s) => s.restablecerClave);

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios
      .filter((u) => u.rolUsuario !== 'admin')
      .filter((u) => (filtroRol ? u.rolUsuario === filtroRol : true))
      .filter((u) => (filtroEstado ? (filtroEstado === 'Activo') === u.activo : true))
      .filter((u) => (q ? `${u.nombre} ${u.usuario}`.toLowerCase().includes(q) : true))
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const stats = useMemo(() => {
    const cuentas = usuarios.filter((u) => u.rolUsuario !== 'admin');
    return {
      total: cuentas.length,
      activas: cuentas.filter((u) => u.activo).length,
      inactivas: cuentas.filter((u) => !u.activo).length,
    };
  }, [usuarios]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Credenciales de Acceso</h1>
        <p className="text-sm text-gray-500">
          Cuentas de Líderes, Gestores y Digitadores — se crean automáticamente al promover a alguien desde Roles. El Padrino no inicia sesión
          en la plataforma, por eso no aparece aquí.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Cuentas totales" value={stats.total} />
        <StatCard label="Con acceso activo" value={stats.activas} tone="success" />
        <StatCard label="Acceso desactivado" value={stats.inactivas} tone="warning" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o usuario…"
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todo rol</option>
          <option value="lider">Líder</option>
          <option value="gestor">Gestor</option>
          <option value="digitador">Digitador</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todo estado</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Nombre</th>
                <th className="px-4 py-2.5 font-semibold">Usuario</th>
                <th className="px-4 py-2.5 font-semibold">Rol</th>
                <th className="px-4 py-2.5 font-semibold">Contraseña</th>
                <th className="px-4 py-2.5 font-semibold">Estado</th>
                <th className="px-4 py-2.5 font-semibold">Creada</th>
                <th className="px-4 py-2.5 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((cuenta) => (
                <FilaCredencial
                  key={cuenta.id}
                  cuenta={cuenta}
                  onActivar={() => activarUsuario(cuenta.id)}
                  onDesactivar={() => desactivarUsuario(cuenta.id)}
                  onRestablecer={() => restablecerClave(cuenta.id)}
                />
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                    Todavía no hay cuentas — se crean al promover a alguien a Líder, Gestor o Digitador desde Roles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
