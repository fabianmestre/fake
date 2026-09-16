import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Persona } from '../../types';
import { useDataStore } from '../../state/dataStore';
import { useUsuariosStore } from '../../state/usuariosStore';
import { nombreCompleto, siguientePlanilla } from '../../data/generarDatos';
import { DirectorioSimpatizantes } from '../../components/simpatizantes/DirectorioSimpatizantes';

interface FiltroNavegacion {
  idsFiltro?: string[];
  motivo?: string;
}

function AsignarPadrinoModal({
  persona,
  onClose,
  onConfirmar,
}: {
  persona: Persona;
  onClose: () => void;
  onConfirmar: (padrinoId: string, meta: number) => void;
}) {
  const personas = useDataStore((s) => s.personas);
  const [padrinoId, setPadrinoId] = useState('');
  const [meta, setMeta] = useState('');
  const [error, setError] = useState<string | null>(null);

  const candidato = useMemo(() => personas.find((p) => p.rol === 'Candidato'), [personas]);
  const padrinos = useMemo(() => personas.filter((p) => p.rol === 'Padrino'), [personas]);
  const opcionesPadrino = useMemo(() => [...padrinos, ...(candidato ? [candidato] : [])], [padrinos, candidato]);

  function confirmar() {
    if (!padrinoId) {
      setError('Selecciona a quién va a reportar (un Padrino o el Candidato).');
      return;
    }
    const metaNumerica = Number(meta);
    if (!meta || !Number.isInteger(metaNumerica) || metaNumerica <= 0) {
      setError('Digita la meta de simpatizantes válidos que le exiges a este líder (un número mayor a 0).');
      return;
    }
    onConfirmar(padrinoId, metaNumerica);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Promover a Líder</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <span className="font-medium">{nombreCompleto(persona)}</span> · Cédula {persona.cedula}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Reporta a</label>
            <select
              value={padrinoId}
              onChange={(e) => setPadrinoId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              autoFocus
            >
              <option value="">Seleccionar…</option>
              {opcionesPadrino.map((o) => (
                <option key={o.id} value={o.id}>
                  {nombreCompleto(o)} {o.rol === 'Candidato' ? '(Candidato)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Meta de simpatizantes válidos</label>
            <input
              type="number"
              min={1}
              step={1}
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="Ej. 20"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              La define el Candidato o el Padrino para cada líder — no hay un valor por defecto, cada quien tiene la suya.
            </p>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="button" onClick={confirmar} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Promover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DirectorioLiderTab() {
  const personas = useDataStore((s) => s.personas);
  const actualizarPersona = useDataStore((s) => s.actualizarPersona);
  const crearOReactivarUsuario = useUsuariosStore((s) => s.crearOReactivarUsuario);
  const desactivarPorPersona = useUsuariosStore((s) => s.desactivarPorPersona);
  const [promoviendo, setPromoviendo] = useState<Persona | null>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const filtroInicial = location.state as FiltroNavegacion | null;
  const [filtroNavegacion, setFiltroNavegacion] = useState<FiltroNavegacion | null>(filtroInicial);

  function quitarFiltroNavegacion() {
    setFiltroNavegacion(null);
    navigate(location.pathname, { replace: true });
  }

  function mostrarMensaje(texto: string, tipo: 'exito' | 'error' = 'exito') {
    setMensaje({ texto, tipo });
    window.setTimeout(() => setMensaje(null), 5000);
  }

  function confirmarPromocion(padrinoId: string, meta: number) {
    if (!promoviendo) return;
    actualizarPersona(promoviendo.id, { rol: 'Líder', padrinoId, planilla: siguientePlanilla(personas), metaSimpatizantes: meta });
    const cuenta = crearOReactivarUsuario(promoviendo, 'lider');
    mostrarMensaje(
      `${nombreCompleto(promoviendo)} fue promovido a Líder, con una meta de ${meta} simpatizantes válidos. Usuario de acceso: ${cuenta.usuario} (ver contraseña en Credenciales).`,
    );
    setPromoviendo(null);
  }

  function quitarRol(lider: Persona) {
    const tamanoEquipo = personas.filter((p) => p.liderId === lider.id).length;
    if (tamanoEquipo > 0) {
      mostrarMensaje(`No se puede quitar el rol: ${nombreCompleto(lider)} todavía tiene ${tamanoEquipo} persona(s) a cargo. Reasígnalas primero.`, 'error');
      return;
    }
    const lideres = personas.filter((p) => p.rol === 'Líder');
    const liderHistorico = personas.find((p) => p.id === lider.liderId && p.rol === 'Líder') ?? lideres.find((l) => l.id !== lider.id);
    if (!liderHistorico) {
      mostrarMensaje(`No se puede quitar el rol: no hay otro líder activo al cual reasignar a ${nombreCompleto(lider)}.`, 'error');
      return;
    }
    if (!confirm(`¿Quitarle el rol de Líder a ${nombreCompleto(lider)}? Volverá a ser Simpatizante bajo ${nombreCompleto(liderHistorico)}.`)) return;
    actualizarPersona(lider.id, { rol: 'Simpatizante', padrinoId: undefined, planilla: liderHistorico.planilla });
    desactivarPorPersona(lider.id);
    mostrarMensaje(`${nombreCompleto(lider)} volvió a ser Simpatizante. Se desactivó su acceso a la plataforma.`);
  }

  return (
    <div>
      <p className="mb-3 text-xs text-gray-400">
        Por defecto ves a los líderes. Busca por nombre o cédula para encontrar cualquier simpatizante y promoverlo.
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
        rolFijo="Líder"
        rolesBuscables={['Simpatizante']}
        idsFiltro={filtroNavegacion?.idsFiltro}
        bannerFiltro={filtroNavegacion ? { texto: filtroNavegacion.motivo ?? 'Vista filtrada', onQuitar: quitarFiltroNavegacion } : undefined}
        accionExtra={(p) => {
          if (p.rol === 'Simpatizante') {
            return (
              <button
                type="button"
                onClick={() => setPromoviendo(p)}
                className="whitespace-nowrap text-xs font-medium text-blue-600 hover:underline"
              >
                Promover a Líder
              </button>
            );
          }
          const tamano = personas.filter((x) => x.liderId === p.id).length;
          return (
            <button
              type="button"
              onClick={() => quitarRol(p)}
              title={tamano > 0 ? `Tiene ${tamano} persona(s) a cargo` : undefined}
              className="whitespace-nowrap text-xs font-medium text-red-600 hover:underline"
            >
              Quitar rol
            </button>
          );
        }}
      />

      {promoviendo && (
        <AsignarPadrinoModal persona={promoviendo} onClose={() => setPromoviendo(null)} onConfirmar={confirmarPromocion} />
      )}
    </div>
  );
}
