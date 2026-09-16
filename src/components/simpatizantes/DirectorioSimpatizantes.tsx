import { useEffect, useMemo, useRef, useState } from 'react';
import type { Persona } from '../../types';
import { useSessionStore } from '../../state/sessionStore';
import { useDataStore } from '../../state/dataStore';
import { alcanceDeDatos, puedeCrear, puedeEditar, puedeMarcarVoto } from '../../lib/permisos';
import { esDiaE, fechaDiaEFormateada } from '../../lib/diaE';
import { nombreCompleto, personaPorId, superiorDe } from '../../data/generarDatos';
import { zonaDeComuna } from '../../data/geografia';
import { FiltrosSimpatizantes, FILTROS_VACIOS, type FiltrosState } from './FiltrosSimpatizantes';
import { NuevoSimpatizanteModal } from './NuevoSimpatizanteModal';
import { Pagination } from '../common/Pagination';

const TAMANO_PAGINA = 20;
const COLUMNAS_KEY = 'directorio-simpatizantes-columnas';

export function coincide(p: Persona, filtros: FiltrosState, busqueda: string) {
  if (filtros.municipio && p.municipio !== filtros.municipio) return false;
  if (filtros.comuna && p.comuna !== filtros.comuna) return false;
  if (filtros.corregimiento && p.comuna !== filtros.corregimiento) return false;
  if (filtros.barrio && p.barrio !== filtros.barrio) return false;
  if (filtros.zona && zonaDeComuna(p.municipio, p.comuna) !== filtros.zona) return false;
  if (filtros.liderId && p.liderId !== filtros.liderId) return false;
  if (filtros.padrinoId) {
    const esElPadrino = p.id === filtros.padrinoId;
    const esSuLider = p.rol === 'Líder' && p.padrinoId === filtros.padrinoId;
    const suLider = p.liderId ? personaPorId(p.liderId) : undefined;
    const bajoEsePadrino = suLider?.padrinoId === filtros.padrinoId;
    if (!esElPadrino && !esSuLider && !bajoEsePadrino) return false;
  }
  if (filtros.rol && p.rol !== filtros.rol) return false;
  if (filtros.validez && p.validez !== filtros.validez) return false;
  if (filtros.nivel && p.nivel !== filtros.nivel) return false;
  if (filtros.dptoVotacion && p.dptoVotacion !== filtros.dptoVotacion) return false;
  if (filtros.municVotacion && p.municVotacion !== filtros.municVotacion) return false;
  if (filtros.puestoVotacionId && p.puestoVotacionId !== filtros.puestoVotacionId) return false;
  if (filtros.mesaVotacion && p.mesaVotacion !== filtros.mesaVotacion.trim()) return false;
  if (filtros.tieneVehiculo && (p.vehiculoDisponible ? 'Sí' : 'No') !== filtros.tieneVehiculo) return false;
  if (filtros.tipoVehiculo && !p.vehiculos.some((v) => v.tipo === filtros.tipoVehiculo)) return false;
  if (filtros.rolDiaE && p.rolDiaE !== filtros.rolDiaE) return false;
  if (filtros.interes && !p.gustosIntereses?.includes(filtros.interes)) return false;
  if (filtros.grupoSocial && !p.gruposSociales?.includes(filtros.grupoSocial)) return false;
  if (filtros.profesion && p.profesion !== filtros.profesion) return false;
  if (filtros.nivelFormacion && p.nivelFormacion !== filtros.nivelFormacion) return false;
  if (filtros.posgrado && p.posgrado !== filtros.posgrado) return false;
  if (filtros.tieneGestiones && (p.tieneGestiones ? 'Sí' : 'No') !== filtros.tieneGestiones) return false;

  if (busqueda) {
    const q = busqueda.toLowerCase();
    const texto = `${nombreCompleto(p)} ${p.cedula} ${p.telefono} ${p.barrio} ${p.correo}`.toLowerCase();
    if (!texto.includes(q)) return false;
  }
  return true;
}

function BadgeValidez({ validez }: { validez: Persona['validez'] }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        validez === 'Válido' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {validez}
    </span>
  );
}

const ROL_ESTILOS: Record<Persona['rol'], string> = {
  Candidato: 'bg-rose-50 text-rose-700',
  Simpatizante: 'bg-gray-100 text-gray-700',
  Líder: 'bg-blue-50 text-blue-700',
  Padrino: 'bg-purple-50 text-purple-700',
  Gestor: 'bg-amber-50 text-amber-700',
  Digitador: 'bg-teal-50 text-teal-700',
};

function BadgeRol({ rol }: { rol: Persona['rol'] }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROL_ESTILOS[rol]}`}>{rol}</span>;
}

const th = 'px-4 py-2.5 font-semibold whitespace-nowrap';
const td = 'px-4 py-3 text-gray-600 whitespace-nowrap';
const vacio = <span className="text-gray-300">—</span>;

function VotoCheckbox({ persona }: { persona: Persona }) {
  const usuario = useSessionStore((s) => s.usuario);
  const actualizarPersona = useDataStore((s) => s.actualizarPersona);

  if (persona.validez !== 'Válido') return vacio;

  const puedeMarcar = puedeMarcarVoto(usuario) && esDiaE();
  return (
    <input
      type="checkbox"
      checked={persona.voto}
      disabled={!puedeMarcar}
      onChange={(e) => actualizarPersona(persona.id, { voto: e.target.checked })}
      title={puedeMarcar ? '¿Ya votó?' : `Solo se puede marcar el día de la jornada electoral (${fechaDiaEFormateada()})`}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

interface ColumnaDef {
  key: string;
  label: string;
  grupo?: 'Residencia' | 'Puesto de Votación' | 'Caracterización' | 'Día E';
  defaultVisible: boolean;
  render: (p: Persona, superior?: Persona) => React.ReactNode;
}

const COLUMNAS: ColumnaDef[] = [
  { key: 'cedula', label: 'Cédula', defaultVisible: true, render: (p) => p.cedula },
  { key: 'telefono', label: 'Teléfono', defaultVisible: true, render: (p) => p.telefono || vacio },
  { key: 'correo', label: 'Correo', defaultVisible: false, render: (p) => p.correo || vacio },
  { key: 'departamento', label: 'Departamento', grupo: 'Residencia', defaultVisible: true, render: (p) => p.departamento },
  { key: 'municipio', label: 'Municipio', grupo: 'Residencia', defaultVisible: true, render: (p) => p.municipio },
  { key: 'comuna', label: 'Comuna/Correg.', grupo: 'Residencia', defaultVisible: true, render: (p) => p.comuna },
  { key: 'barrio', label: 'Barrio', grupo: 'Residencia', defaultVisible: true, render: (p) => p.barrio },
  {
    key: 'lider',
    label: 'Reporta a',
    defaultVisible: true,
    render: (p, superior) => {
      if (superior) return `${nombreCompleto(superior)} (${superior.rol})`;
      return p.rol === 'Candidato' ? <span className="italic text-gray-400">Raíz de la estructura</span> : vacio;
    },
  },
  { key: 'planilla', label: 'Planilla', defaultVisible: true, render: (p) => p.planilla ?? vacio },
  { key: 'rol', label: 'Rol', defaultVisible: true, render: (p) => <BadgeRol rol={p.rol} /> },
  { key: 'validez', label: 'Validez', defaultVisible: true, render: (p) => <BadgeValidez validez={p.validez} /> },
  { key: 'nivel', label: 'Nivel de voto', defaultVisible: false, render: (p) => p.nivel },
  { key: 'dptoVotacion', label: 'Dpto-Votación', grupo: 'Puesto de Votación', defaultVisible: true, render: (p) => p.dptoVotacion ?? vacio },
  { key: 'municVotacion', label: 'Munic-Votación', grupo: 'Puesto de Votación', defaultVisible: true, render: (p) => p.municVotacion ?? vacio },
  { key: 'puestoVotacion', label: 'Pto-Votación', grupo: 'Puesto de Votación', defaultVisible: true, render: (p) => p.puestoVotacion ?? vacio },
  { key: 'mesaVotacion', label: 'Mesa-Votación', grupo: 'Puesto de Votación', defaultVisible: true, render: (p) => p.mesaVotacion ?? vacio },
  { key: 'profesion', label: 'Profesión', grupo: 'Caracterización', defaultVisible: false, render: (p) => p.profesion ?? vacio },
  { key: 'ocupacion', label: 'Ocupación', grupo: 'Caracterización', defaultVisible: false, render: (p) => p.ocupacion ?? vacio },
  { key: 'nivelFormacion', label: 'Nivel académico', grupo: 'Caracterización', defaultVisible: false, render: (p) => p.nivelFormacion },
  { key: 'posgrado', label: 'Posgrado', grupo: 'Caracterización', defaultVisible: false, render: (p) => p.posgrado ?? vacio },
  {
    key: 'gruposSociales',
    label: 'Grupos sociales',
    grupo: 'Caracterización',
    defaultVisible: false,
    render: (p) => (p.gruposSociales?.length ? p.gruposSociales.join(', ') : vacio),
  },
  {
    key: 'gustosIntereses',
    label: 'Intereses',
    grupo: 'Caracterización',
    defaultVisible: false,
    render: (p) => (p.gustosIntereses?.length ? p.gustosIntereses.join(', ') : vacio),
  },
  {
    key: 'vehiculos',
    label: 'Vehículo(s) para campaña',
    grupo: 'Día E',
    defaultVisible: false,
    render: (p) =>
      p.vehiculos.length
        ? p.vehiculos.map((v) => `${v.tipo}${v.pasajeros ? ` · ${v.pasajeros} pax` : ''}${v.placa ? ` (${v.placa})` : ''}`).join(', ')
        : vacio,
  },
  { key: 'rolDiaE', label: 'Rol Día E', grupo: 'Día E', defaultVisible: false, render: (p) => p.rolDiaE ?? vacio },
  { key: 'voto', label: '¿Ya votó?', grupo: 'Día E', defaultVisible: true, render: (p) => <VotoCheckbox persona={p} /> },
];

const COLUMNAS_VISIBLES_DEFECTO = COLUMNAS.filter((c) => c.defaultVisible).map((c) => c.key);

function cargarColumnasGuardadas(): string[] {
  try {
    const guardado = localStorage.getItem(COLUMNAS_KEY);
    if (!guardado) return COLUMNAS_VISIBLES_DEFECTO;
    const parseado: string[] = JSON.parse(guardado);
    const validas = parseado.filter((k) => COLUMNAS.some((c) => c.key === k));
    return validas.length ? validas : COLUMNAS_VISIBLES_DEFECTO;
  } catch {
    return COLUMNAS_VISIBLES_DEFECTO;
  }
}

function SelectorColumnas({ visibles, onChange }: { visibles: string[]; onChange: (v: string[]) => void }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', onClickFuera);
    return () => document.removeEventListener('mousedown', onClickFuera);
  }, []);

  const grupos: (ColumnaDef['grupo'] | 'General')[] = ['General', 'Residencia', 'Puesto de Votación', 'Caracterización', 'Día E'];
  const toggle = (key: string) => {
    onChange(visibles.includes(key) ? visibles.filter((v) => v !== key) : [...visibles, key]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium ${
          abierto ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Columnas ({visibles.length + 1})
      </button>
      {abierto && (
        <div className="absolute right-0 z-20 mt-2 max-h-96 w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">Elegir columnas visibles</p>
            <button type="button" onClick={() => onChange(COLUMNAS_VISIBLES_DEFECTO)} className="text-xs font-medium text-blue-600 hover:underline">
              Restablecer
            </button>
          </div>
          <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-400">
            <input type="checkbox" checked disabled className="rounded" />
            Nombre (fija)
          </label>
          {grupos.map((grupo) => {
            const cols = COLUMNAS.filter((c) => (grupo === 'General' ? !c.grupo : c.grupo === grupo));
            if (!cols.length) return null;
            return (
              <div key={grupo} className="mt-2">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{grupo}</p>
                {cols.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                    <input type="checkbox" checked={visibles.includes(c.key)} onChange={() => toggle(c.key)} className="rounded" />
                    {c.label}
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface Props {
  rolFijo?: Persona['rol'];
  /** Roles adicionales que se incluyen SOLO mientras hay texto de búsqueda (ej. buscar un
   * Simpatizante cualquiera para promoverlo, sin que aparezcan al navegar sin buscar). */
  rolesBuscables?: Persona['rol'][];
  accionExtra?: (p: Persona) => React.ReactNode;
  botonCrearPersonalizado?: { label: string; onClick: () => void };
  /** Restringe la vista a un conjunto específico de personas (ej. llegando desde un drill-down del dashboard). */
  idsFiltro?: string[];
  bannerFiltro?: { texto: string; onQuitar: () => void };
}

export function DirectorioSimpatizantes({ rolFijo, rolesBuscables, accionExtra, botonCrearPersonalizado, idsFiltro, bannerFiltro }: Props = {}) {
  const usuario = useSessionStore((s) => s.usuario);
  const personas = useDataStore((s) => s.personas);

  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_VACIOS);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [personaEditando, setPersonaEditando] = useState<Persona | undefined>(undefined);
  const [columnasVisibles, setColumnasVisibles] = useState<string[]>(cargarColumnasGuardadas);

  useEffect(() => {
    try {
      localStorage.setItem(COLUMNAS_KEY, JSON.stringify(columnasVisibles));
    } catch {
      /* almacenamiento no disponible, se ignora */
    }
  }, [columnasVisibles]);

  const dataAlcance = useMemo(() => {
    let resultado = alcanceDeDatos(usuario, personas);
    if (rolFijo) {
      const rolesIncluidos = busqueda.trim() && rolesBuscables ? [rolFijo, ...rolesBuscables] : [rolFijo];
      resultado = resultado.filter((p) => rolesIncluidos.includes(p.rol));
    }
    if (idsFiltro) {
      const idsSet = new Set(idsFiltro);
      resultado = resultado.filter((p) => idsSet.has(p.id));
    }
    return resultado;
  }, [usuario, personas, rolFijo, rolesBuscables, busqueda, idsFiltro]);
  const lideres = useMemo(() => personas.filter((p) => p.rol === 'Líder'), [personas]);
  const padrinos = useMemo(() => personas.filter((p) => p.rol === 'Padrino'), [personas]);

  const filtrados = useMemo(
    () => dataAlcance.filter((p) => coincide(p, filtros, busqueda)),
    [dataAlcance, filtros, busqueda],
  );

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANO_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const enPagina = filtrados.slice((paginaSegura - 1) * TAMANO_PAGINA, paginaSegura * TAMANO_PAGINA);

  const columnas = useMemo(() => COLUMNAS.filter((c) => columnasVisibles.includes(c.key)), [columnasVisibles]);

  const gruposCabecera = useMemo(() => {
    const grupos: { grupo: ColumnaDef['grupo']; cols: ColumnaDef[] }[] = [];
    for (const c of columnas) {
      const ultimo = grupos[grupos.length - 1];
      if (c.grupo && ultimo && ultimo.grupo === c.grupo) {
        ultimo.cols.push(c);
      } else {
        grupos.push({ grupo: c.grupo, cols: [c] });
      }
    }
    return grupos;
  }, [columnas]);

  function cambiarFiltros(f: FiltrosState) {
    setFiltros(f);
    setPagina(1);
  }

  function cambiarBusqueda(v: string) {
    setBusqueda(v);
    setPagina(1);
  }

  function abrirNuevo() {
    setPersonaEditando(undefined);
    setModalAbierto(true);
  }

  function abrirEdicion(p: Persona) {
    if (!puedeEditar(usuario, p)) return;
    setPersonaEditando(p);
    setModalAbierto(true);
  }

  return (
    <div>
      {bannerFiltro && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          <span>{bannerFiltro.texto}</span>
          <button type="button" onClick={bannerFiltro.onQuitar} className="whitespace-nowrap text-xs font-medium text-blue-700 hover:underline">
            Quitar filtro
          </button>
        </div>
      )}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            value={busqueda}
            onChange={(e) => cambiarBusqueda(e.target.value)}
            placeholder="Buscar por nombre, cédula, teléfono, barrio, correo…"
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setMostrarFiltros((v) => !v)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium ${
              mostrarFiltros ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Filtros
          </button>
          <SelectorColumnas visibles={columnasVisibles} onChange={setColumnasVisibles} />
        </div>
        {botonCrearPersonalizado ? (
          <button
            type="button"
            onClick={botonCrearPersonalizado.onClick}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {botonCrearPersonalizado.label}
          </button>
        ) : (
          !rolFijo &&
          puedeCrear(usuario) && (
            <button type="button" onClick={abrirNuevo} className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              + Nuevo Simpatizante
            </button>
          )
        )}
      </div>

      {mostrarFiltros && (
        <div className="mb-4">
          <FiltrosSimpatizantes filtros={filtros} onChange={cambiarFiltros} lideres={lideres} padrinos={padrinos} ocultarFiltroRol={Boolean(rolFijo)} />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className={`${th} sticky left-0 z-20 border-b border-gray-200 bg-gray-50`} rowSpan={2}>
                  Nombre
                </th>
                {gruposCabecera.map((g, i) =>
                  g.grupo ? (
                    <th
                      key={`${g.grupo}-${i}`}
                      className={`border-b border-gray-200 px-4 py-1.5 text-center text-[11px] ${
                        g.grupo === 'Residencia'
                          ? 'bg-blue-50/60 text-blue-700'
                          : g.grupo === 'Puesto de Votación'
                            ? 'bg-emerald-50/60 text-emerald-700'
                            : g.grupo === 'Caracterización'
                              ? 'bg-amber-50/60 text-amber-700'
                              : 'bg-purple-50/60 text-purple-700'
                      }`}
                      colSpan={g.cols.length}
                    >
                      {g.grupo}
                    </th>
                  ) : (
                    g.cols.map((c) => (
                      <th key={c.key} className={`${th} border-b border-gray-200`} rowSpan={2}>
                        {c.label}
                      </th>
                    ))
                  ),
                )}
                {accionExtra && <th className={`${th} border-b border-gray-200`} rowSpan={2} />}
              </tr>
              <tr>
                {gruposCabecera
                  .filter((g) => g.grupo)
                  .flatMap((g) =>
                    g.cols.map((c) => (
                      <th
                        key={c.key}
                        className={`${th} ${
                          g.grupo === 'Residencia'
                            ? 'bg-blue-50/30'
                            : g.grupo === 'Puesto de Votación'
                              ? 'bg-emerald-50/30'
                              : g.grupo === 'Caracterización'
                                ? 'bg-amber-50/30'
                                : 'bg-purple-50/30'
                        }`}
                      >
                        {c.label}
                      </th>
                    )),
                  )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enPagina.map((p, i) => {
                const superior = superiorDe(p);
                const editable = puedeEditar(usuario, p);
                const filaBg = i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white';
                return (
                  <tr key={p.id} className={`${filaBg} hover:bg-gray-100/60`}>
                    <td className={`sticky left-0 z-10 px-4 py-3 ${filaBg}`}>
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => abrirEdicion(p)}
                        className="whitespace-nowrap font-medium text-blue-700 hover:underline disabled:cursor-default disabled:text-gray-700 disabled:no-underline"
                      >
                        {nombreCompleto(p)}
                      </button>
                    </td>
                    {columnas.map((c) => (
                      <td key={c.key} className={td}>
                        {c.render(p, superior)}
                      </td>
                    ))}
                    {accionExtra && <td className="px-4 py-3 text-right">{accionExtra(p)}</td>}
                  </tr>
                );
              })}
              {enPagina.length === 0 && (
                <tr>
                  <td colSpan={columnas.length + 1 + (accionExtra ? 1 : 0)} className="px-4 py-10 text-center text-sm text-gray-400">
                    No hay simpatizantes que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          paginaActual={paginaSegura}
          totalPaginas={totalPaginas}
          totalRegistros={filtrados.length}
          tamanoPagina={TAMANO_PAGINA}
          onCambiarPagina={setPagina}
        />
      </div>

      {modalAbierto && (
        <NuevoSimpatizanteModal onClose={() => setModalAbierto(false)} personaExistente={personaEditando} lideres={lideres} />
      )}
    </div>
  );
}
