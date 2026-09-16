import { listaMunicipios, comunasPorTipo, barriosDeComuna } from '../../data/geografia';
import { listaDepartamentosVotacion, listaMunicipiosVotacion, puestosDeDeptoMunic } from '../../data/puestosVotacion';
import { nombreCompleto } from '../../data/generarDatos';
import {
  GRUPOS_SOCIALES,
  GUSTOS_INTERESES,
  NIVELES_FORMACION,
  POSGRADOS,
  PROFESIONES,
  ROLES_DIA_E,
  TIPOS_VEHICULO,
} from '../../data/catalogosCaracterizacion';
import type { Persona } from '../../types';

export interface FiltrosState {
  liderId: string;
  padrinoId: string;
  departamento: string;
  municipio: string;
  zona: string;
  comuna: string;
  corregimiento: string;
  barrio: string;
  dptoVotacion: string;
  municVotacion: string;
  puestoVotacionId: string;
  mesaVotacion: string;
  nivel: string;
  validez: string;
  tieneVehiculo: string;
  tipoVehiculo: string;
  rolDiaE: string;
  interes: string;
  grupoSocial: string;
  profesion: string;
  nivelFormacion: string;
  posgrado: string;
  tieneGestiones: string;
  rol: string;
}

export const FILTROS_VACIOS: FiltrosState = {
  liderId: '',
  padrinoId: '',
  departamento: '',
  municipio: '',
  zona: '',
  comuna: '',
  corregimiento: '',
  barrio: '',
  dptoVotacion: '',
  municVotacion: '',
  puestoVotacionId: '',
  mesaVotacion: '',
  nivel: '',
  validez: '',
  tieneVehiculo: '',
  tipoVehiculo: '',
  rolDiaE: '',
  interes: '',
  grupoSocial: '',
  profesion: '',
  nivelFormacion: '',
  posgrado: '',
  tieneGestiones: '',
  rol: '',
};

type Opcion = string | { value: string; label: string };

function Select({
  label,
  value,
  onChange,
  opciones,
  todosLabel = 'Todos',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opciones: Opcion[];
  todosLabel?: string;
}) {
  const normalizadas = opciones.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
      >
        <option value="">{todosLabel}</option>
        {normalizadas.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CampoTexto({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
}

const SECCION_ESTILOS = {
  Residencia: { barra: 'bg-blue-50 text-blue-700 border-blue-100' },
  'Puesto de Votación': { barra: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  'Estructura y Caracterización': { barra: 'bg-amber-50 text-amber-700 border-amber-100' },
} as const;

function SeccionFiltros({ titulo, children }: { titulo: keyof typeof SECCION_ESTILOS; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <p className={`border-b px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${SECCION_ESTILOS[titulo].barra}`}>{titulo}</p>
      <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-4">{children}</div>
    </div>
  );
}

export function FiltrosSimpatizantes({
  filtros,
  onChange,
  lideres,
  padrinos,
  ocultarFiltroRol,
}: {
  filtros: FiltrosState;
  onChange: (f: FiltrosState) => void;
  lideres: Persona[];
  padrinos: Persona[];
  ocultarFiltroRol?: boolean;
}) {
  const set = (campo: keyof FiltrosState, valor: string) => {
    const next = { ...filtros, [campo]: valor };
    if (campo === 'municipio') {
      next.comuna = '';
      next.corregimiento = '';
      next.barrio = '';
    }
    if (campo === 'comuna') {
      next.corregimiento = '';
      next.barrio = '';
    }
    if (campo === 'corregimiento') {
      next.comuna = '';
      next.barrio = '';
    }
    if (campo === 'dptoVotacion') {
      next.municVotacion = '';
      next.puestoVotacionId = '';
    }
    if (campo === 'municVotacion') {
      next.puestoVotacionId = '';
    }
    onChange(next);
  };

  const comunas = filtros.municipio ? comunasPorTipo(filtros.municipio, 'Comuna').map((c) => c.nombre) : [];
  const corregimientos = filtros.municipio ? comunasPorTipo(filtros.municipio, 'Corregimiento').map((c) => c.nombre) : [];
  const comunaOBarrio = filtros.comuna || filtros.corregimiento;
  const barrios = filtros.municipio && comunaOBarrio ? barriosDeComuna(filtros.municipio, comunaOBarrio) : [];

  const municipiosVotacion = listaMunicipiosVotacion(filtros.dptoVotacion || undefined);
  const puestosFiltrados = puestosDeDeptoMunic(filtros.dptoVotacion || undefined, filtros.municVotacion || undefined);

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-400">
        Los filtros de <span className="font-medium text-blue-600">Residencia</span> usan la ubicación donde vive el simpatizante; los de{' '}
        <span className="font-medium text-emerald-600">Puesto de Votación</span> usan dónde está inscrito para votar — pueden no coincidir.
      </p>

      <SeccionFiltros titulo="Residencia">
        <Select label="Departamento (residencia)" value={filtros.departamento} onChange={(v) => set('departamento', v)} opciones={['Cesar']} />
        <Select label="Municipio (residencia)" value={filtros.municipio} onChange={(v) => set('municipio', v)} opciones={listaMunicipios()} />
        <Select label="Zona" value={filtros.zona} onChange={(v) => set('zona', v)} opciones={['Urbana', 'Rural']} todosLabel="Todas" />
        <Select label="Comuna" value={filtros.comuna} onChange={(v) => set('comuna', v)} opciones={comunas} todosLabel="Todas" />
        <Select label="Corregimiento" value={filtros.corregimiento} onChange={(v) => set('corregimiento', v)} opciones={corregimientos} />
        <Select label="Barrio" value={filtros.barrio} onChange={(v) => set('barrio', v)} opciones={barrios} />
      </SeccionFiltros>

      <SeccionFiltros titulo="Puesto de Votación">
        <Select
          label="Departamento (votación)"
          value={filtros.dptoVotacion}
          onChange={(v) => set('dptoVotacion', v)}
          opciones={listaDepartamentosVotacion()}
        />
        <Select
          label="Municipio (votación)"
          value={filtros.municVotacion}
          onChange={(v) => set('municVotacion', v)}
          opciones={municipiosVotacion}
        />
        <Select
          label="Puesto de votación"
          value={filtros.puestoVotacionId}
          onChange={(v) => set('puestoVotacionId', v)}
          opciones={puestosFiltrados.map((p) => ({ value: p.id, label: `${p.nombre} (${p.municipio})` }))}
        />
        <CampoTexto label="Mesa" value={filtros.mesaVotacion} onChange={(v) => set('mesaVotacion', v)} placeholder="Ej: 101" />
      </SeccionFiltros>

      <SeccionFiltros titulo="Estructura y Caracterización">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Padrino</label>
          <select
            value={filtros.padrinoId}
            onChange={(e) => set('padrinoId', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Todos</option>
            {padrinos.map((p) => (
              <option key={p.id} value={p.id}>
                {nombreCompleto(p)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Líder</label>
          <select
            value={filtros.liderId}
            onChange={(e) => set('liderId', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Todos</option>
            {lideres.map((l) => (
              <option key={l.id} value={l.id}>
                {nombreCompleto(l)}
              </option>
            ))}
          </select>
        </div>
        {!ocultarFiltroRol && (
          <Select label="Rol" value={filtros.rol} onChange={(v) => set('rol', v)} opciones={['Simpatizante', 'Líder', 'Padrino', 'Gestor', 'Digitador', 'Candidato']} />
        )}
        <Select label="Validez" value={filtros.validez} onChange={(v) => set('validez', v)} opciones={['Válido', 'Inválido']} todosLabel="Toda" />
        <Select label="Nivel de voto" value={filtros.nivel} onChange={(v) => set('nivel', v)} opciones={['Firme', 'Indeciso']} />

        <Select
          label="¿Vehículo disponible para campaña?"
          value={filtros.tieneVehiculo}
          onChange={(v) => set('tieneVehiculo', v)}
          opciones={['Sí', 'No']}
        />
        <Select label="Tipo de vehículo" value={filtros.tipoVehiculo} onChange={(v) => set('tipoVehiculo', v)} opciones={TIPOS_VEHICULO} />
        <Select label="Rol Día E" value={filtros.rolDiaE} onChange={(v) => set('rolDiaE', v)} opciones={ROLES_DIA_E} />
        <Select label="¿Tiene gestiones?" value={filtros.tieneGestiones} onChange={(v) => set('tieneGestiones', v)} opciones={['Sí', 'No']} />

        <Select label="Interés" value={filtros.interes} onChange={(v) => set('interes', v)} opciones={GUSTOS_INTERESES} />
        <Select label="Grupo social" value={filtros.grupoSocial} onChange={(v) => set('grupoSocial', v)} opciones={GRUPOS_SOCIALES} />
        <Select label="Profesión" value={filtros.profesion} onChange={(v) => set('profesion', v)} opciones={PROFESIONES} todosLabel="Todas" />
        <Select label="Nivel académico" value={filtros.nivelFormacion} onChange={(v) => set('nivelFormacion', v)} opciones={NIVELES_FORMACION} />

        <Select label="Posgrado" value={filtros.posgrado} onChange={(v) => set('posgrado', v)} opciones={POSGRADOS.filter((p) => p !== 'Ninguno')} />
      </SeccionFiltros>

      <div className="flex justify-end border-t border-gray-100 pt-3">
        <button type="button" onClick={() => onChange(FILTROS_VACIOS)} className="text-xs font-medium text-blue-600 hover:underline">
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
