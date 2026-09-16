import { useState } from 'react';
import type { Persona } from '../../types';
import { useSessionStore } from '../../state/sessionStore';
import { useDataStore } from '../../state/dataStore';
import { nombreCompleto } from '../../data/generarDatos';
import { DirectorioSimpatizantes } from '../../components/simpatizantes/DirectorioSimpatizantes';

export function PadrinoPage() {
  const usuario = useSessionStore((s) => s.usuario);
  const personas = useDataStore((s) => s.personas);
  const actualizarPersona = useDataStore((s) => s.actualizarPersona);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  const esAdmin = usuario?.rolUsuario === 'admin';

  function contarLideres(padrinoId: string) {
    return personas.filter((p) => p.padrinoId === padrinoId).length;
  }

  function mostrarMensaje(texto: string, tipo: 'exito' | 'error' = 'exito') {
    setMensaje({ texto, tipo });
    window.setTimeout(() => setMensaje(null), 5000);
  }

  function promover(p: Persona) {
    const candidato = personas.find((c) => c.rol === 'Candidato');
    actualizarPersona(p.id, { rol: 'Padrino', candidatoId: candidato?.id, liderIds: [] });
    mostrarMensaje(`${nombreCompleto(p)} fue promovido a Padrino.`);
  }

  function quitarRol(padrino: Persona) {
    const cantidadLideres = contarLideres(padrino.id);
    if (cantidadLideres > 0) {
      mostrarMensaje(
        `No se puede quitar el rol: ${nombreCompleto(padrino)} todavía tiene ${cantidadLideres} líder(es) a cargo. Reasígnalos primero.`,
        'error',
      );
      return;
    }
    if (!confirm(`¿Quitarle el rol de Padrino a ${nombreCompleto(padrino)}? Volverá a ser Simpatizante.`)) return;
    actualizarPersona(padrino.id, { rol: 'Simpatizante', candidatoId: undefined, liderIds: undefined });
    mostrarMensaje(`${nombreCompleto(padrino)} volvió a ser Simpatizante.`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Padrino</h1>
      <p className="mb-1 text-sm text-gray-500">
        Gestiona quién tiene el rol de Padrino. Un padrino no ingresa a la plataforma — solo agrupa a los líderes que tiene a
        cargo dentro de la estructura de campaña. Esta vista es un listado de solo consulta.
      </p>

      {!esAdmin && (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
          Solo el administrador puede gestionar el rol de Padrino.
        </div>
      )}

      {esAdmin && (
        <>
          <p className="mb-3 text-xs text-gray-400">
            Por defecto ves a los padrinos. Busca por nombre o cédula para encontrar cualquier simpatizante y promoverlo.
          </p>

          {mensaje && (
            <div
              className={`mb-4 rounded-xl border p-3 text-sm font-medium ${
                mensaje.tipo === 'exito' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {mensaje.tipo === 'exito' ? '✓' : '⚠'} {mensaje.texto}
            </div>
          )}

          <DirectorioSimpatizantes
            rolFijo="Padrino"
            rolesBuscables={['Simpatizante']}
            accionExtra={(p) => {
              if (p.rol === 'Simpatizante') {
                return (
                  <button type="button" onClick={() => promover(p)} className="whitespace-nowrap text-xs font-medium text-blue-600 hover:underline">
                    Promover a Padrino
                  </button>
                );
              }
              const cantidadLideres = contarLideres(p.id);
              return (
                <button
                  type="button"
                  onClick={() => quitarRol(p)}
                  title={cantidadLideres > 0 ? `Tiene ${cantidadLideres} líder(es) a cargo` : undefined}
                  className="whitespace-nowrap text-xs font-medium text-red-600 hover:underline"
                >
                  Quitar rol
                </button>
              );
            }}
          />
        </>
      )}
    </div>
  );
}
