import { useState } from 'react';
import type { Persona } from '../../types';
import { useSessionStore } from '../../state/sessionStore';
import { useDataStore } from '../../state/dataStore';
import { useUsuariosStore } from '../../state/usuariosStore';
import { nombreCompleto } from '../../data/generarDatos';
import { DirectorioSimpatizantes } from '../../components/simpatizantes/DirectorioSimpatizantes';

export function DigitadorPage() {
  const usuario = useSessionStore((s) => s.usuario);
  const personas = useDataStore((s) => s.personas);
  const actualizarPersona = useDataStore((s) => s.actualizarPersona);
  const crearOReactivarUsuario = useUsuariosStore((s) => s.crearOReactivarUsuario);
  const desactivarPorPersona = useUsuariosStore((s) => s.desactivarPorPersona);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const esAdmin = usuario?.rolUsuario === 'admin';

  function contarFichas(digitadorId: string) {
    return personas.filter((p) => p.registradoPor === digitadorId).length;
  }

  function mostrarMensaje(texto: string) {
    setMensaje(texto);
    window.setTimeout(() => setMensaje(null), 4000);
  }

  function promover(p: Persona) {
    actualizarPersona(p.id, { rol: 'Digitador' });
    const cuenta = crearOReactivarUsuario(p, 'digitador');
    mostrarMensaje(`${nombreCompleto(p)} fue promovido a Digitador. Usuario de acceso: ${cuenta.usuario} (ver contraseña en Credenciales).`);
  }

  function quitarRol(p: Persona) {
    if (!confirm(`¿Quitarle el rol de Digitador a ${nombreCompleto(p)}? Volverá a ser Simpatizante.`)) return;
    actualizarPersona(p.id, { rol: 'Simpatizante' });
    desactivarPorPersona(p.id);
    mostrarMensaje(`${nombreCompleto(p)} volvió a ser Simpatizante. Se desactivó su acceso a la plataforma.`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Digitador</h1>
      <p className="mb-1 text-sm text-gray-500">
        Gestiona quién tiene el rol de Digitador. Un digitador solo puede registrar fichas nuevas: no ve los datos de la plataforma y no
        puede editar ni eliminar una vez guardadas.
      </p>

      {!esAdmin && (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
          Solo el administrador puede gestionar el rol de Digitador.
        </div>
      )}

      {esAdmin && (
        <>
          <p className="mb-3 text-xs text-gray-400">
            Por defecto ves a los digitadores. Busca por nombre o cédula para encontrar cualquier simpatizante y promoverlo.
          </p>

          {mensaje && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">✓ {mensaje}</div>
          )}

          <DirectorioSimpatizantes
            rolFijo="Digitador"
            rolesBuscables={['Simpatizante']}
            accionExtra={(p) =>
              p.rol === 'Simpatizante' ? (
                <button type="button" onClick={() => promover(p)} className="whitespace-nowrap text-xs font-medium text-blue-600 hover:underline">
                  Promover a Digitador
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => quitarRol(p)}
                  title={`${contarFichas(p.id)} ficha(s) registrada(s)`}
                  className="whitespace-nowrap text-xs font-medium text-red-600 hover:underline"
                >
                  Quitar rol
                </button>
              )
            }
          />
        </>
      )}
    </div>
  );
}
