import { useMemo, useState } from 'react';
import { useDataStore } from '../state/dataStore';
import { useGestionesStore } from '../state/gestionesStore';
import { CATEGORIAS_GESTION, ESTADOS_GESTION, RESPONSABLES_GESTION } from '../data/catalogosGestiones';
import { nombreCompleto } from '../data/generarDatos';
import type { CategoriaGestion, EstadoGestion, Gestion, Persona } from '../types';
import { StatCard } from '../components/common/StatCard';
import { DonutChartCard, BarChartCard } from '../components/common/ChartCard';
import { Pagination } from '../components/common/Pagination';

const TAMANO_PAGINA = 10;

function formatCOP(n: number): string {
  return `$${Math.round(n).toLocaleString('es-CO')}`;
}

function agrupar<T>(lista: T[], clave: (x: T) => string) {
  const mapa = new Map<string, number>();
  lista.forEach((x) => {
    const k = clave(x);
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  });
  return Array.from(mapa.entries())
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor);
}

function sumarPor<T>(lista: T[], clave: (x: T) => string, valor: (x: T) => number) {
  const mapa = new Map<string, number>();
  lista.forEach((x) => {
    const k = clave(x);
    mapa.set(k, (mapa.get(k) ?? 0) + valor(x));
  });
  return Array.from(mapa.entries())
    .map(([nombre, valor]) => ({ nombre, valor }))
    .filter((d) => d.valor > 0)
    .sort((a, b) => b.valor - a.valor);
}

/** A quién le pesa la gestión en el árbol territorial: el líder mismo, el líder del simpatizante, o "general" si no está ligada a nadie. */
function liderDeGestion(g: Gestion, personas: Persona[]): string {
  if (!g.personaId) return 'Sin líder (general)';
  const persona = personas.find((p) => p.id === g.personaId);
  if (!persona) return 'Sin líder (general)';
  if (persona.rol === 'Líder') return nombreCompleto(persona);
  const lider = persona.liderId ? personas.find((p) => p.id === persona.liderId) : undefined;
  return lider ? nombreCompleto(lider) : 'Sin líder asignado';
}

/** Id del líder al que le pesa la gestión (para filtrar) — mismo criterio que liderDeGestion. */
function liderIdDeGestion(g: Gestion, personas: Persona[]): string | undefined {
  if (!g.personaId) return undefined;
  const persona = personas.find((p) => p.id === g.personaId);
  if (!persona) return undefined;
  if (persona.rol === 'Líder') return persona.id;
  return persona.liderId;
}

interface FiltrosGestionState {
  categoria: string;
  estado: string;
  responsable: string;
  liderId: string;
  fechaDesde: string;
  fechaHasta: string;
  conMonto: string;
}

const FILTROS_GESTION_VACIOS: FiltrosGestionState = {
  categoria: '',
  estado: '',
  responsable: '',
  liderId: '',
  fechaDesde: '',
  fechaHasta: '',
  conMonto: '',
};

const ESTADO_ESTILOS: Record<EstadoGestion, string> = {
  Pendiente: 'bg-gray-100 text-gray-700',
  'En Proceso': 'bg-amber-50 text-amber-700',
  Resuelto: 'bg-emerald-50 text-emerald-700',
};

const CATEGORIA_ESTILOS: Record<CategoriaGestion, string> = {
  Salud: 'bg-blue-50 text-blue-700',
  Empleo: 'bg-emerald-50 text-emerald-700',
  'Ayudas/Mercados': 'bg-amber-50 text-amber-700',
  'Recursos/Dinero': 'bg-red-50 text-red-700',
  'Trámites/Asesoría': 'bg-cyan-50 text-cyan-700',
  'Obras comunitarias': 'bg-purple-50 text-purple-700',
};

type VistaGrafica = 'categoria' | 'lider' | 'invertido' | 'responsable';
const VISTAS_GRAFICA: { key: VistaGrafica; label: string }[] = [
  { key: 'categoria', label: 'Gestiones por categoría' },
  { key: 'lider', label: 'Gestiones por líder' },
  { key: 'invertido', label: 'Invertido ($) por categoría' },
  { key: 'responsable', label: 'Gestiones por responsable' },
];

interface FormGestionValores {
  personaId?: string;
  fecha: string;
  categoria: CategoriaGestion;
  descripcion: string;
  monto?: number;
  estado: EstadoGestion;
  responsable: string;
}

function ModalFiltrosGestion({
  filtros,
  onChange,
  lideres,
  totalResultado,
  onClose,
}: {
  filtros: FiltrosGestionState;
  onChange: (f: FiltrosGestionState) => void;
  lideres: Persona[];
  totalResultado: number;
  onClose: () => void;
}) {
  const set = (campo: keyof FiltrosGestionState, valor: string) => onChange({ ...filtros, [campo]: valor });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Filtros de consulta</h2>
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-blue-700">{totalResultado}</span> gestión(es) con los filtros actuales
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Categoría</label>
              <select
                value={filtros.categoria}
                onChange={(e) => set('categoria', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Todas</option>
                {CATEGORIAS_GESTION.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => set('estado', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Todos</option>
                {ESTADOS_GESTION.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Responsable</label>
              <select
                value={filtros.responsable}
                onChange={(e) => set('responsable', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Todos</option>
                {RESPONSABLES_GESTION.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Líder (territorial)</label>
              <select
                value={filtros.liderId}
                onChange={(e) => set('liderId', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Todos</option>
                {lideres.map((l) => (
                  <option key={l.id} value={l.id}>
                    {nombreCompleto(l)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Fecha desde</label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => set('fechaDesde', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Fecha hasta</label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => set('fechaHasta', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">¿Tiene monto asociado?</label>
            <select
              value={filtros.conMonto}
              onChange={(e) => set('conMonto', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Indistinto</option>
              <option value="Sí">Sí, con monto</option>
              <option value="No">No, sin monto</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={() => onChange(FILTROS_GESTION_VACIOS)} className="text-xs font-medium text-blue-600 hover:underline">
            Limpiar filtros
          </button>
          <button type="button" onClick={onClose} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Ver {totalResultado} gestión(es)
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalGestion({
  gestion,
  personasBuscables,
  onClose,
  onGuardar,
}: {
  gestion?: Gestion;
  personasBuscables: Persona[];
  onClose: () => void;
  onGuardar: (valores: FormGestionValores) => void;
}) {
  const [personaId, setPersonaId] = useState(gestion?.personaId ?? '');
  const [busquedaPersona, setBusquedaPersona] = useState('');
  const [fecha, setFecha] = useState(gestion?.fecha ?? new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState<CategoriaGestion>(gestion?.categoria ?? CATEGORIAS_GESTION[0]);
  const [descripcion, setDescripcion] = useState(gestion?.descripcion ?? '');
  const [monto, setMonto] = useState(gestion?.monto ? String(gestion.monto) : '');
  const [estado, setEstado] = useState<EstadoGestion>(gestion?.estado ?? 'Pendiente');
  const [responsable, setResponsable] = useState(gestion?.responsable ?? RESPONSABLES_GESTION[0]);
  const [error, setError] = useState<string | null>(null);

  const personaSeleccionada = personaId ? personasBuscables.find((p) => p.id === personaId) : undefined;
  const resultados = useMemo(() => {
    const q = busquedaPersona.trim().toLowerCase();
    if (!q) return [];
    return personasBuscables.filter((p) => `${nombreCompleto(p)} ${p.cedula}`.toLowerCase().includes(q)).slice(0, 8);
  }, [personasBuscables, busquedaPersona]);

  function guardar() {
    if (!fecha || !descripcion.trim() || !responsable.trim()) {
      setError('Completa los campos obligatorios (fecha, descripción y responsable).');
      return;
    }
    onGuardar({
      personaId: personaId || undefined,
      fecha,
      categoria,
      descripcion: descripcion.trim(),
      monto: monto.trim() ? Number(monto) : undefined,
      estado,
      responsable: responsable.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{gestion ? 'Editar gestión / favor' : 'Registrar gestión / favor'}</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Trazabilidad de favores y compromisos</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Persona (simpatizante / líder)</label>
            {personaSeleccionada ? (
              <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
                <span className="text-blue-800">
                  {nombreCompleto(personaSeleccionada)} <span className="text-blue-500">({personaSeleccionada.rol})</span>
                </span>
                <button type="button" onClick={() => setPersonaId('')} className="text-xs font-medium text-blue-700 hover:underline">
                  Quitar
                </button>
              </div>
            ) : (
              <div>
                <input
                  value={busquedaPersona}
                  onChange={(e) => setBusquedaPersona(e.target.value)}
                  placeholder="— Sin simpatizante (gestión general) — buscar por nombre o cédula…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                {resultados.length > 0 && (
                  <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200">
                    {resultados.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setPersonaId(p.id);
                            setBusquedaPersona('');
                          }}
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                        >
                          {nombreCompleto(p)} <span className="text-gray-400">· {p.cedula} · {p.rol}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaGestion)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                {CATEGORIAS_GESTION.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Descripción del favor / compromiso <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Detalle de la gestión realizada o compromiso adquirido…"
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Valor / Monto ($)</label>
              <input
                type="number"
                min={0}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoGestion)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                {ESTADOS_GESTION.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Responsable de la campaña <span className="text-red-500">*</span>
            </label>
            <input
              list="responsables-gestion"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <datalist id="responsables-gestion">
              {RESPONSABLES_GESTION.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="button" onClick={guardar} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Guardar gestión
          </button>
        </div>
      </div>
    </div>
  );
}

export function GestionesPage() {
  const personas = useDataStore((s) => s.personas);
  const gestiones = useGestionesStore((s) => s.gestiones);
  const agregarGestion = useGestionesStore((s) => s.agregarGestion);
  const actualizarGestion = useGestionesStore((s) => s.actualizarGestion);
  const eliminarGestion = useGestionesStore((s) => s.eliminarGestion);

  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState<FiltrosGestionState>(FILTROS_GESTION_VACIOS);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vistaGrafica, setVistaGrafica] = useState<VistaGrafica>('categoria');
  const [gestionEditando, setGestionEditando] = useState<Gestion | undefined>(undefined);

  const personasBuscables = useMemo(() => personas.filter((p) => p.rol === 'Simpatizante' || p.rol === 'Líder'), [personas]);
  const lideres = useMemo(
    () => [...personas.filter((p) => p.rol === 'Líder')].sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b))),
    [personas],
  );
  const filtrosActivos = Object.values(filtros).filter(Boolean).length;

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return gestiones.filter((g) => {
      if (filtros.categoria && g.categoria !== filtros.categoria) return false;
      if (filtros.estado && g.estado !== filtros.estado) return false;
      if (filtros.responsable && g.responsable !== filtros.responsable) return false;
      if (filtros.liderId && liderIdDeGestion(g, personas) !== filtros.liderId) return false;
      if (filtros.fechaDesde && g.fecha < filtros.fechaDesde) return false;
      if (filtros.fechaHasta && g.fecha > filtros.fechaHasta) return false;
      if (filtros.conMonto === 'Sí' && !g.monto) return false;
      if (filtros.conMonto === 'No' && g.monto) return false;
      if (q) {
        const persona = g.personaId ? personas.find((p) => p.id === g.personaId) : undefined;
        const texto = `${g.descripcion} ${persona ? nombreCompleto(persona) : 'general campaña'} ${g.responsable}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [gestiones, filtros, busqueda, personas]);

  const stats = useMemo(() => {
    const total = filtradas.length;
    const pendientesEnProceso = filtradas.filter((g) => g.estado !== 'Resuelto').length;
    const resueltas = total - pendientesEnProceso;
    const totalInvertido = filtradas.reduce((s, g) => s + (g.monto ?? 0), 0);
    return { total, pendientesEnProceso, resueltas, totalInvertido };
  }, [filtradas]);

  const porCategoria = useMemo(() => agrupar(filtradas, (g) => g.categoria), [filtradas]);
  const invertidoPorCategoria = useMemo(() => sumarPor(filtradas, (g) => g.categoria, (g) => g.monto ?? 0), [filtradas]);
  const porLider = useMemo(
    () => agrupar(filtradas, (g) => liderDeGestion(g, personas)).slice(0, 10),
    [filtradas, personas],
  );
  const porResponsable = useMemo(() => agrupar(filtradas, (g) => g.responsable), [filtradas]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / TAMANO_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const enPagina = filtradas.slice((paginaSegura - 1) * TAMANO_PAGINA, paginaSegura * TAMANO_PAGINA);

  function cambiarBusqueda(v: string) {
    setBusqueda(v);
    setPagina(1);
  }

  function cambiarFiltros(f: FiltrosGestionState) {
    setFiltros(f);
    setPagina(1);
  }

  function abrirNueva() {
    setGestionEditando(undefined);
    setModalAbierto(true);
  }
  function abrirEdicion(g: Gestion) {
    setGestionEditando(g);
    setModalAbierto(true);
  }
  function guardar(valores: FormGestionValores) {
    if (gestionEditando) {
      actualizarGestion(gestionEditando.id, valores);
    } else {
      agregarGestion({ id: `gestion-${Date.now()}-${Math.round(Math.random() * 9999)}`, ...valores });
    }
    setModalAbierto(false);
  }
  function eliminar(g: Gestion) {
    if (!confirm(`¿Eliminar la gestión "${g.descripcion}"? Esta acción no se puede deshacer.`)) return;
    eliminarGestion(g.id);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Trazabilidad de Gestiones</h1>
        <p className="text-sm text-gray-500">Favores, compromisos y balance de lo invertido por la campaña</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            value={busqueda}
            onChange={(e) => cambiarBusqueda(e.target.value)}
            placeholder="Buscar descripción, persona o responsable…"
            className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setMostrarFiltros(true)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
              filtrosActivos ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Filtros
            {filtrosActivos > 0 && (
              <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">{filtrosActivos}</span>
            )}
          </button>
          {filtrosActivos > 0 && (
            <button type="button" onClick={() => cambiarFiltros(FILTROS_GESTION_VACIOS)} className="text-xs font-medium text-blue-600 hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
        <button type="button" onClick={abrirNueva} className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + Nueva gestión
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gestiones (filtro)" value={stats.total} />
        <StatCard label="Pendientes / en proceso" value={stats.pendientesEnProceso} tone="warning" />
        <StatCard label="Resueltas" value={stats.resueltas} tone="success" />
        <StatCard label="Total invertido" value={formatCOP(stats.totalInvertido)} tone="dark" />
      </div>

      <div className="mb-6">
        {vistaGrafica === 'categoria' ? (
          <DonutChartCard
            title="Gestiones por categoría"
            datos={porCategoria}
            controles={
              <select
                value={vistaGrafica}
                onChange={(e) => setVistaGrafica(e.target.value as VistaGrafica)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
              >
                {VISTAS_GRAFICA.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            }
          />
        ) : (
          <BarChartCard
            title={VISTAS_GRAFICA.find((v) => v.key === vistaGrafica)?.label ?? ''}
            datos={vistaGrafica === 'lider' ? porLider : vistaGrafica === 'invertido' ? invertidoPorCategoria : porResponsable}
            horizontal
            controles={
              <select
                value={vistaGrafica}
                onChange={(e) => setVistaGrafica(e.target.value as VistaGrafica)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
              >
                {VISTAS_GRAFICA.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            }
          />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Fecha</th>
                <th className="px-4 py-2.5 font-semibold">Persona</th>
                <th className="px-4 py-2.5 font-semibold">Categoría</th>
                <th className="px-4 py-2.5 font-semibold">Descripción</th>
                <th className="px-4 py-2.5 font-semibold">Monto</th>
                <th className="px-4 py-2.5 font-semibold">Estado</th>
                <th className="px-4 py-2.5 font-semibold">Responsable</th>
                <th className="px-4 py-2.5 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enPagina.map((g) => {
                const persona = g.personaId ? personas.find((p) => p.id === g.personaId) : undefined;
                return (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{g.fecha}</td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {persona ? (
                        <span className="font-medium text-gray-900">
                          {nombreCompleto(persona)} <span className="text-xs text-gray-400">({persona.rol})</span>
                        </span>
                      ) : (
                        <span className="text-gray-500">General / Campaña</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORIA_ESTILOS[g.categoria]}`}>{g.categoria}</span>
                    </td>
                    <td className="max-w-xs px-4 py-2.5 text-gray-600" title={g.descripcion}>
                      {g.descripcion}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-gray-700">{g.monto ? formatCOP(g.monto) : <span className="text-gray-300">—</span>}</td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_ESTILOS[g.estado]}`}>{g.estado}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{g.responsable}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      <button type="button" onClick={() => abrirEdicion(g)} className="mr-3 text-xs font-medium text-blue-600 hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => eliminar(g)} className="text-xs font-medium text-red-600 hover:underline">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {enPagina.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                    No hay gestiones que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination paginaActual={paginaSegura} totalPaginas={totalPaginas} totalRegistros={filtradas.length} tamanoPagina={TAMANO_PAGINA} onCambiarPagina={setPagina} />
      </div>

      {mostrarFiltros && (
        <ModalFiltrosGestion
          filtros={filtros}
          onChange={cambiarFiltros}
          lideres={lideres}
          totalResultado={filtradas.length}
          onClose={() => setMostrarFiltros(false)}
        />
      )}

      {modalAbierto && (
        <ModalGestion gestion={gestionEditando} personasBuscables={personasBuscables} onClose={() => setModalAbierto(false)} onGuardar={guardar} />
      )}
    </div>
  );
}
