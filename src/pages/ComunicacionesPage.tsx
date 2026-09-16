import { useMemo, useState } from 'react';
import { useSessionStore } from '../state/sessionStore';
import { useDataStore } from '../state/dataStore';
import { useComunicacionesStore, type CanalComunicacion, type EnvioRegistro } from '../state/comunicacionesStore';
import { alcanceDeDatos } from '../lib/permisos';
import { nombreCompleto } from '../data/generarDatos';
import { puestoPorId } from '../data/puestosVotacion';
import type { Persona } from '../types';
import { FiltrosSimpatizantes, FILTROS_VACIOS, type FiltrosState } from '../components/simpatizantes/FiltrosSimpatizantes';
import { coincide } from '../components/simpatizantes/DirectorioSimpatizantes';
import { IconTarget, IconUserSingle, IconHistory, IconSend } from '../components/layout/icons';

const CANALES: CanalComunicacion[] = ['WhatsApp API', 'SMS', 'Email', 'Llamada'];

type Tab = 'segmento' | 'individual' | 'historial';
const TABS: { key: Tab; label: string; icon: (c: string) => React.ReactNode }[] = [
  { key: 'segmento', label: 'Envío a segmento', icon: (c) => <IconTarget className={c} /> },
  { key: 'individual', label: 'Envío individual', icon: (c) => <IconUserSingle className={c} /> },
  { key: 'historial', label: 'Historial', icon: (c) => <IconHistory className={c} /> },
];

const ETIQUETAS_FILTRO: [keyof FiltrosState, string][] = [
  ['municipio', 'Municipio'],
  ['zona', 'Zona'],
  ['comuna', 'Comuna'],
  ['corregimiento', 'Corregimiento'],
  ['barrio', 'Barrio'],
  ['dptoVotacion', 'Departamento (votación)'],
  ['municVotacion', 'Municipio (votación)'],
  ['validez', 'Validez'],
  ['nivel', 'Nivel de voto'],
  ['mesaVotacion', 'Mesa'],
  ['tieneVehiculo', 'Vehículo disponible'],
  ['tipoVehiculo', 'Tipo de vehículo'],
  ['rolDiaE', 'Rol Día E'],
  ['interes', 'Interés'],
  ['grupoSocial', 'Grupo social'],
  ['profesion', 'Profesión'],
  ['nivelFormacion', 'Nivel académico'],
  ['posgrado', 'Posgrado'],
  ['tieneGestiones', '¿Tiene gestiones?'],
];

function describirFiltros(filtros: FiltrosState, personas: Persona[]): string[] {
  const partes: string[] = [];
  for (const [campo, etiqueta] of ETIQUETAS_FILTRO) {
    if (filtros[campo]) partes.push(`${etiqueta}: ${filtros[campo]}`);
  }
  if (filtros.liderId) {
    const l = personas.find((p) => p.id === filtros.liderId);
    partes.push(`Líder: ${l ? nombreCompleto(l) : filtros.liderId}`);
  }
  if (filtros.padrinoId) {
    const p = personas.find((x) => x.id === filtros.padrinoId);
    partes.push(`Padrino: ${p ? nombreCompleto(p) : filtros.padrinoId}`);
  }
  if (filtros.puestoVotacionId) {
    const pv = puestoPorId(filtros.puestoVotacionId);
    partes.push(`Puesto de votación: ${pv?.nombre ?? filtros.puestoVotacionId}`);
  }
  return partes;
}

function SelectCanal({ canal, onChange }: { canal: CanalComunicacion; onChange: (c: CanalComunicacion) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">Canal</label>
      <select
        value={canal}
        onChange={(e) => onChange(e.target.value as CanalComunicacion)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
      >
        {CANALES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

function PanelRedactarYEnviar({
  destinatarios,
  deshabilitado,
  deshabilitadoMotivo,
  onEnviar,
}: {
  destinatarios: number;
  deshabilitado?: boolean;
  deshabilitadoMotivo?: string;
  onEnviar: (canal: CanalComunicacion, mensaje: string) => void;
}) {
  const [canal, setCanal] = useState<CanalComunicacion>('WhatsApp API');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState<string | null>(null);

  function enviar() {
    if (deshabilitado) return;
    if (!mensaje.trim()) {
      setError('Escribe un mensaje antes de enviar.');
      return;
    }
    if (destinatarios === 0) {
      setError('No hay destinatarios para este envío.');
      return;
    }
    onEnviar(canal, mensaje.trim());
    setMensaje('');
    setError(null);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
        <span aria-hidden>✉️</span> Redactar y enviar
      </p>
      <div className="space-y-3">
        <SelectCanal canal={canal} onChange={setCanal} />
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Mensaje</label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={7}
            placeholder="Escribe el mensaje que se enviará…"
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {deshabilitado && deshabilitadoMotivo && <p className="text-xs text-amber-600">{deshabilitadoMotivo}</p>}
        <button
          type="button"
          onClick={enviar}
          disabled={deshabilitado}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <IconSend className="h-4 w-4" />
          Enviar
        </button>
      </div>
    </div>
  );
}

function ModalFiltros({
  filtros,
  onChange,
  lideres,
  padrinos,
  totalDestinatarios,
  onClose,
}: {
  filtros: FiltrosState;
  onChange: (f: FiltrosState) => void;
  lideres: Persona[];
  padrinos: Persona[];
  totalDestinatarios: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Filtros de segmentación</h2>
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-blue-700">{totalDestinatarios}</span> destinatario(s) con los filtros actuales
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <div className="p-6">
          <FiltrosSimpatizantes filtros={filtros} onChange={onChange} lideres={lideres} padrinos={padrinos} ocultarFiltroRol />
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Ver {totalDestinatarios} destinatario(s)
          </button>
        </div>
      </div>
    </div>
  );
}

function TabEnvioSegmento({ simpatizantes, personas }: { simpatizantes: Persona[]; personas: Persona[] }) {
  const registrarEnvio = useComunicacionesStore((s) => s.registrarEnvio);
  const usuario = useSessionStore((s) => s.usuario);
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_VACIOS);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [exito, setExito] = useState<string | null>(null);

  const lideres = useMemo(() => personas.filter((p) => p.rol === 'Líder'), [personas]);
  const padrinos = useMemo(() => personas.filter((p) => p.rol === 'Padrino'), [personas]);

  const destinatarios = useMemo(() => simpatizantes.filter((p) => coincide(p, filtros, '')), [simpatizantes, filtros]);
  const resumenFiltros = useMemo(() => describirFiltros(filtros, personas), [filtros, personas]);

  function enviar(canal: CanalComunicacion, mensaje: string) {
    registrarEnvio({
      tipo: 'Segmento',
      canal,
      destinatarios: destinatarios.length,
      detalleDestinatario: resumenFiltros.length ? resumenFiltros.join(' · ') : 'Todos los simpatizantes',
      mensaje,
      registradoPor: usuario?.nombre ?? 'Desconocido',
    });
    setExito(`✓ Mensaje enviado a ${destinatarios.length} destinatario(s) por ${canal}.`);
    window.setTimeout(() => setExito(null), 5000);
  }

  return (
    <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2">
      <div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <IconTarget className="h-4 w-4 text-blue-600" /> Segmentación
          </p>
          <button
            type="button"
            onClick={() => setMostrarFiltros(true)}
            className="mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Filtros
          </button>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">Destinatarios</p>
              <p className="text-2xl font-bold text-blue-700">{destinatarios.length}</p>
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Filtros aplicados</p>
            <p className="mt-1 text-sm text-gray-600">
              {resumenFiltros.length ? resumenFiltros.join(' · ') : 'Sin filtros — se envía a todos los simpatizantes.'}
            </p>
          </div>
        </div>
      </div>

      <div>
        {exito && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{exito}</div>}
        <PanelRedactarYEnviar destinatarios={destinatarios.length} onEnviar={enviar} />
      </div>

      {mostrarFiltros && (
        <ModalFiltros
          filtros={filtros}
          onChange={setFiltros}
          lideres={lideres}
          padrinos={padrinos}
          totalDestinatarios={destinatarios.length}
          onClose={() => setMostrarFiltros(false)}
        />
      )}
    </div>
  );
}

function TabEnvioIndividual({ simpatizantes }: { simpatizantes: Persona[] }) {
  const registrarEnvio = useComunicacionesStore((s) => s.registrarEnvio);
  const usuario = useSessionStore((s) => s.usuario);
  const [busqueda, setBusqueda] = useState('');
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return simpatizantes.filter((p) => `${nombreCompleto(p)} ${p.cedula} ${p.telefono}`.toLowerCase().includes(q)).slice(0, 8);
  }, [simpatizantes, busqueda]);

  const persona = personaId ? simpatizantes.find((p) => p.id === personaId) : undefined;

  function enviar(canal: CanalComunicacion, mensaje: string) {
    if (!persona) return;
    registrarEnvio({
      tipo: 'Individual',
      canal,
      destinatarios: 1,
      detalleDestinatario: `${nombreCompleto(persona)} (${persona.cedula})`,
      mensaje,
      registradoPor: usuario?.nombre ?? 'Desconocido',
    });
    setExito(`✓ Mensaje enviado a ${nombreCompleto(persona)} por ${canal}.`);
    window.setTimeout(() => setExito(null), 5000);
  }

  return (
    <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <IconUserSingle className="h-4 w-4 text-blue-600" /> Buscar simpatizante
        </p>
        <input
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPersonaId(null);
          }}
          placeholder="Buscar por nombre, cédula o teléfono…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        {persona ? (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
            <p className="font-semibold text-blue-800">{nombreCompleto(persona)}</p>
            <p className="text-blue-700">
              Cédula {persona.cedula} · {persona.telefono || 'sin teléfono'}
            </p>
            <button type="button" onClick={() => setPersonaId(null)} className="mt-2 text-xs font-medium text-blue-700 hover:underline">
              Cambiar destinatario
            </button>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {resultados.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setPersonaId(p.id)}
                  className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-800">{nombreCompleto(p)}</span>{' '}
                  <span className="text-gray-400">· {p.cedula}</span>
                </button>
              </li>
            ))}
            {busqueda.trim() && resultados.length === 0 && <p className="px-2 py-3 text-sm text-gray-400">Sin resultados.</p>}
            {!busqueda.trim() && <p className="px-2 py-3 text-sm text-gray-400">Escribe para buscar un simpatizante.</p>}
          </ul>
        )}
      </div>

      <div>
        {exito && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{exito}</div>}
        <PanelRedactarYEnviar
          destinatarios={persona ? 1 : 0}
          deshabilitado={!persona}
          deshabilitadoMotivo={!persona ? 'Selecciona primero a quién le vas a escribir.' : undefined}
          onEnviar={enviar}
        />
      </div>
    </div>
  );
}

const CANAL_ESTILOS: Record<CanalComunicacion, string> = {
  'WhatsApp API': 'bg-emerald-50 text-emerald-700',
  SMS: 'bg-blue-50 text-blue-700',
  Email: 'bg-purple-50 text-purple-700',
  Llamada: 'bg-amber-50 text-amber-700',
};

function TabHistorial({ envios }: { envios: EnvioRegistro[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Fecha</th>
              <th className="px-4 py-2.5 font-semibold">Tipo</th>
              <th className="px-4 py-2.5 font-semibold">Canal</th>
              <th className="px-4 py-2.5 font-semibold">Destinatarios</th>
              <th className="px-4 py-2.5 font-semibold">Mensaje</th>
              <th className="px-4 py-2.5 font-semibold">Registrado por</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {envios.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">
                  {new Date(e.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-700">{e.tipo}</td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CANAL_ESTILOS[e.canal]}`}>{e.canal}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-700">
                  {e.destinatarios}
                  <span className="ml-1 text-xs text-gray-400">— {e.detalleDestinatario}</span>
                </td>
                <td className="max-w-xs truncate px-4 py-2.5 text-gray-600" title={e.mensaje}>
                  {e.mensaje}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{e.registradoPor}</td>
              </tr>
            ))}
            {envios.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  Aún no se ha enviado ningún mensaje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ComunicacionesPage() {
  const usuario = useSessionStore((s) => s.usuario);
  const personas = useDataStore((s) => s.personas);
  const envios = useComunicacionesStore((s) => s.envios);
  const [tab, setTab] = useState<Tab>('segmento');

  const simpatizantes = useMemo(
    () => alcanceDeDatos(usuario, personas).filter((p) => p.rol === 'Simpatizante'),
    [usuario, personas],
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Comunicaciones</h1>
        <p className="text-sm text-gray-500">Envíos masivos segmentados</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
              tab === t.key ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.icon('h-4 w-4')}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'segmento' && <TabEnvioSegmento simpatizantes={simpatizantes} personas={personas} />}
      {tab === 'individual' && <TabEnvioIndividual simpatizantes={simpatizantes} />}
      {tab === 'historial' && <TabHistorial envios={envios} />}
    </div>
  );
}
