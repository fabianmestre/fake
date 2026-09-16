import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../state/sessionStore';
import { useDataStore } from '../../state/dataStore';
import { alcanceDeDatos } from '../../lib/permisos';
import { nombreCompleto, personaPorId } from '../../data/generarDatos';
import { puestoPorId } from '../../data/puestosVotacion';
import { zonaDeComuna } from '../../data/geografia';
import type { Persona } from '../../types';
import { StatCard, AlertaCard } from '../common/StatCard';
import { ComparativaBarChartCard } from '../common/ChartCard';
import { IconFlag, IconMap, IconListCheck, IconMegaphone } from '../layout/icons';

function agrupar(datos: Persona[], clave: (p: Persona) => string) {
  const mapa = new Map<string, number>();
  datos.forEach((p) => {
    const k = clave(p) || 'Sin dato';
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  });
  return Array.from(mapa.entries())
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor);
}

function agruparMultivalor(datos: Persona[], obtenerValores: (p: Persona) => string[] | undefined) {
  const mapa = new Map<string, number>();
  datos.forEach((p) => {
    (obtenerValores(p) ?? []).forEach((valor) => {
      mapa.set(valor, (mapa.get(valor) ?? 0) + 1);
    });
  });
  return Array.from(mapa.entries())
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor);
}

/** Comuna/corregimiento donde realmente vota un simpatizante Válido (según el puesto asignado, no su residencia). */
function comunaVotacionDe(p: Persona): string {
  if (p.validez !== 'Válido' || !p.puestoVotacionId) return 'Sin dato';
  const puesto = puestoPorId(p.puestoVotacionId);
  if (!puesto?.comunas?.length) return 'Sin dato';
  return puesto.comunas.includes(p.comuna) ? p.comuna : puesto.comunas[0];
}

const th = 'px-4 py-2.5 font-semibold whitespace-nowrap';
const td = 'px-4 py-3 text-gray-600 whitespace-nowrap';
const vacio = <span className="text-gray-300">—</span>;

function ListaClicable({ datos, onClick }: { datos: { nombre: string; valor: number }[]; onClick: (nombre: string) => void }) {
  const max = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <ol className="space-y-1.5">
      {datos.map((d, i) => (
        <li key={d.nombre}>
          <button
            type="button"
            onClick={() => onClick(d.nombre)}
            className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left text-sm hover:bg-gray-50"
          >
            <span className="w-5 shrink-0 text-gray-400">{i + 1}.</span>
            <span className="w-32 shrink-0 truncate text-gray-700">{d.nombre}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${(d.valor / max) * 100}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right font-medium text-gray-900">{d.valor}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

type VistaTerritorial = 'comunaVotacion' | 'corregimientoVotacion' | 'comunaResidencia' | 'corregimientoResidencia';
type VistaPenetracion = 'topBarrios' | 'topCorregimientos' | 'rankingPuestosUrbanos' | 'rankingPuestosRurales' | 'destinoInvalidos';
type VistaCaracterizacion = 'intereses' | 'gruposSociales' | 'academico';

export function DashboardSimpatizante() {
  const usuario = useSessionStore((s) => s.usuario);
  const personas = useDataStore((s) => s.personas);
  const eliminarPersona = useDataStore((s) => s.eliminarPersona);
  const navigate = useNavigate();
  const refAuditoria = useRef<HTMLDivElement>(null);

  const [resueltos, setResueltos] = useState<Set<string>>(new Set());
  const [vistaTerritorial, setVistaTerritorial] = useState<VistaTerritorial>('comunaVotacion');
  const [vistaPenetracion, setVistaPenetracion] = useState<VistaPenetracion>('topBarrios');
  const [vistaCaracterizacion, setVistaCaracterizacion] = useState<VistaCaracterizacion>('intereses');

  const datos = useMemo(
    () => alcanceDeDatos(usuario, personas).filter((p) => p.rol === 'Simpatizante'),
    [usuario, personas],
  );
  const validos = useMemo(() => datos.filter((p) => p.validez === 'Válido'), [datos]);
  const invalidosLista = useMemo(() => datos.filter((p) => p.validez === 'Inválido'), [datos]);

  function irADirectorio(ids: string[], motivo: string) {
    navigate('/roles/simpatizante/directorio', { state: { idsFiltro: ids, motivo } });
  }

  function irAAuditoria() {
    refAuditoria.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const stats = useMemo(() => {
    const total = datos.length;
    const indecisosEnValidos = validos.filter((p) => p.nivel === 'Indeciso').length;
    const completos = datos.filter((p) => p.puestoVotacionId && p.mesaVotacion).length;
    return {
      total,
      validos: validos.length,
      invalidos: invalidosLista.length,
      indecisosValidos: indecisosEnValidos,
      pctValidos: total ? Math.round((validos.length / total) * 100) : 0,
      pctInvalidos: total ? Math.round((invalidosLista.length / total) * 100) : 0,
      pctIndecisosValidos: validos.length ? Math.round((indecisosEnValidos / validos.length) * 100) : 0,
      pctCompletitud: total ? Math.round((completos / total) * 100) : 0,
    };
  }, [datos, validos, invalidosLista]);

  // --- Alertas operativas de calidad de dato --------------------------------------------------
  const gruposDuplicados = useMemo(() => {
    const mapa = new Map<string, Persona[]>();
    datos.forEach((p) => mapa.set(p.cedula, [...(mapa.get(p.cedula) ?? []), p]));
    return Array.from(mapa.values())
      .filter((g) => g.length > 1)
      .map((g) => [...g].sort((a, b) => a.fechaRegistro.localeCompare(b.fechaRegistro)));
  }, [datos]);
  const personasEnConflicto = useMemo(() => gruposDuplicados.flat(), [gruposDuplicados]);
  const gruposPendientes = gruposDuplicados.filter((g) => !resueltos.has(g[0].cedula));

  const fugaTerritorial = useMemo(
    () => datos.filter((p) => p.municipio === 'Valledupar' && p.validez === 'Inválido'),
    [datos],
  );
  const datosIncompletos = useMemo(() => datos.filter((p) => !p.mesaVotacion || !p.telefono), [datos]);
  const personasConcentracion = useMemo(() => {
    const mapa = new Map<string, Persona[]>();
    datos
      .filter((p) => p.liderId && p.telefono)
      .forEach((p) => {
        const clave = `${p.liderId}-${p.telefono}`;
        mapa.set(clave, [...(mapa.get(clave) ?? []), p]);
      });
    return Array.from(mapa.values())
      .filter((g) => g.length > 1)
      .flat();
  }, [datos]);

  function asignarPaternidad(ganador: Persona, perdedor: Persona) {
    const liderGanador = personaPorId(ganador.liderId);
    const liderPerdedor = personaPorId(perdedor.liderId);
    const ok = confirm(
      `¿Asignar la paternidad de ${nombreCompleto(ganador)} (cédula ${ganador.cedula}) a ${liderGanador ? nombreCompleto(liderGanador) : 'su líder'}? Se eliminará la captura duplicada registrada bajo ${liderPerdedor ? nombreCompleto(liderPerdedor) : 'el otro líder'}.`,
    );
    if (!ok) return;
    eliminarPersona(perdedor.id);
  }

  function descartarDuplicado(cedula: string) {
    setResueltos((prev) => new Set(prev).add(cedula));
  }

  // --- Tarjeta Dinámica 1: Análisis Territorial -----------------------------------------------
  // Comuna (zona urbana) y corregimiento (zona rural) se separan en gráficas distintas — juntas
  // en una sola barra quedaban demasiado cargadas (hasta ~31 categorías con escalas muy distintas).
  const porComunaVotacion = useMemo(
    () => agrupar(validos.filter((p) => zonaDeComuna('Valledupar', comunaVotacionDe(p)) === 'Urbana'), comunaVotacionDe),
    [validos],
  );
  const porCorregimientoVotacion = useMemo(
    () => agrupar(validos.filter((p) => zonaDeComuna('Valledupar', comunaVotacionDe(p)) === 'Rural'), comunaVotacionDe),
    [validos],
  );
  const porComunaResidencia = useMemo(
    () => agrupar(datos.filter((p) => zonaDeComuna(p.municipio, p.comuna) === 'Urbana'), (p) => p.comuna),
    [datos],
  );
  const porCorregimientoResidencia = useMemo(
    () => agrupar(datos.filter((p) => zonaDeComuna(p.municipio, p.comuna) === 'Rural'), (p) => p.comuna),
    [datos],
  );
  function verComunaVotacion(categoria: string) {
    const ids = validos.filter((p) => comunaVotacionDe(p) === categoria).map((p) => p.id);
    irADirectorio(ids, `Mostrando ${ids.length} voto(s) válido(s) con comuna de votación "${categoria}".`);
  }
  function verComunaResidencia(categoria: string) {
    const ids = datos.filter((p) => p.comuna === categoria).map((p) => p.id);
    irADirectorio(ids, `Mostrando ${ids.length} simpatizante(s) que residen en "${categoria}".`);
  }

  const selectorTerritorial = (
    <select
      value={vistaTerritorial}
      onChange={(e) => setVistaTerritorial(e.target.value as VistaTerritorial)}
      className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
    >
      <option value="comunaVotacion">Votos Válidos por Comuna de Votación</option>
      <option value="corregimientoVotacion">Votos Válidos por Corregimiento de Votación</option>
      <option value="comunaResidencia">Distribución por Comuna de Residencia</option>
      <option value="corregimientoResidencia">Distribución por Corregimiento de Residencia</option>
    </select>
  );

  const esVistaVotacion = vistaTerritorial === 'comunaVotacion' || vistaTerritorial === 'corregimientoVotacion';
  const serieTerritorial = esVistaVotacion ? 'Votos Válidos' : 'Simpatizantes';
  const datosTerritorialActual =
    vistaTerritorial === 'comunaVotacion'
      ? porComunaVotacion
      : vistaTerritorial === 'corregimientoVotacion'
        ? porCorregimientoVotacion
        : vistaTerritorial === 'comunaResidencia'
          ? porComunaResidencia
          : porCorregimientoResidencia;

  // --- Tarjeta Dinámica 2: Penetración Geográfica Detallada -----------------------------------
  // Igual que en Análisis Territorial: barrio (urbano) y corregimiento (rural) no comparten
  // gráfica — los corregimientos solo tienen un "barrio" (su propio centro poblado), así que
  // mezclados ahogaban a los barrios reales de Valledupar en el Top 15.
  const topBarriosValidos = useMemo(
    () => agrupar(validos.filter((p) => zonaDeComuna(p.municipio, p.comuna) === 'Urbana'), (p) => p.barrio).slice(0, 15),
    [validos],
  );
  const topCorregimientosValidos = useMemo(
    () => agrupar(validos.filter((p) => zonaDeComuna(p.municipio, p.comuna) === 'Rural'), (p) => p.comuna).slice(0, 15),
    [validos],
  );
  const rankingPuestosUrbanos = useMemo(
    () => agrupar(validos.filter((p) => zonaDeComuna(p.municipio, p.comuna) === 'Urbana'), (p) => p.puestoVotacion ?? 'Sin dato').slice(0, 15),
    [validos],
  );
  const rankingPuestosRurales = useMemo(
    () => agrupar(validos.filter((p) => zonaDeComuna(p.municipio, p.comuna) === 'Rural'), (p) => p.puestoVotacion ?? 'Sin dato').slice(0, 15),
    [validos],
  );
  const destinoInvalidos = useMemo(() => agrupar(invalidosLista, (p) => p.municVotacion ?? 'Sin dato'), [invalidosLista]);

  function verBarrioValidos(categoria: string) {
    const ids = validos.filter((p) => p.barrio === categoria && zonaDeComuna(p.municipio, p.comuna) === 'Urbana').map((p) => p.id);
    irADirectorio(ids, `Mostrando ${ids.length} voto(s) válido(s) en el barrio "${categoria}".`);
  }
  function verCorregimientoValidos(categoria: string) {
    const ids = validos.filter((p) => p.comuna === categoria && zonaDeComuna(p.municipio, p.comuna) === 'Rural').map((p) => p.id);
    irADirectorio(ids, `Mostrando ${ids.length} voto(s) válido(s) en el corregimiento "${categoria}".`);
  }
  function verPuestoUrbanoValidos(categoria: string) {
    const ids = validos
      .filter((p) => (p.puestoVotacion ?? 'Sin dato') === categoria && zonaDeComuna(p.municipio, p.comuna) === 'Urbana')
      .map((p) => p.id);
    irADirectorio(ids, `Mostrando ${ids.length} voto(s) válido(s) en el puesto "${categoria}".`);
  }
  function verPuestoRuralValidos(categoria: string) {
    const ids = validos
      .filter((p) => (p.puestoVotacion ?? 'Sin dato') === categoria && zonaDeComuna(p.municipio, p.comuna) === 'Rural')
      .map((p) => p.id);
    irADirectorio(ids, `Mostrando ${ids.length} voto(s) válido(s) en el puesto "${categoria}".`);
  }
  function verDestinoInvalido(categoria: string) {
    const ids = invalidosLista.filter((p) => (p.municVotacion ?? 'Sin dato') === categoria).map((p) => p.id);
    irADirectorio(ids, `Mostrando ${ids.length} voto(s) inválido(s) con destino "${categoria}".`);
  }

  const selectorPenetracion = (
    <select
      value={vistaPenetracion}
      onChange={(e) => setVistaPenetracion(e.target.value as VistaPenetracion)}
      className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
    >
      <option value="topBarrios">Top Barrios con más votos válidos</option>
      <option value="topCorregimientos">Top Corregimientos con más votos válidos</option>
      <option value="rankingPuestosUrbanos">Ranking de Puestos de Votación (zona urbana)</option>
      <option value="rankingPuestosRurales">Ranking de Puestos de Votación (zona rural)</option>
      <option value="destinoInvalidos">Destino de Votos Inválidos</option>
    </select>
  );

  const PENETRACION_CONFIG = {
    topBarrios: { datos: topBarriosValidos, click: verBarrioValidos, titulo: 'Top Barrios con mayor volumen de votos válidos' },
    topCorregimientos: { datos: topCorregimientosValidos, click: verCorregimientoValidos, titulo: 'Top Corregimientos con mayor volumen de votos válidos' },
    rankingPuestosUrbanos: { datos: rankingPuestosUrbanos, click: verPuestoUrbanoValidos, titulo: 'Ranking de Puestos de Votación — zona urbana' },
    rankingPuestosRurales: { datos: rankingPuestosRurales, click: verPuestoRuralValidos, titulo: 'Ranking de Puestos de Votación — zona rural' },
    destinoInvalidos: { datos: destinoInvalidos, click: verDestinoInvalido, titulo: 'Destino de Votos Inválidos' },
  } as const;
  const seriePenetracion = vistaPenetracion === 'destinoInvalidos' ? 'Votos Inválidos' : 'Votos Válidos';
  const datosPenetracion = PENETRACION_CONFIG[vistaPenetracion].datos.map((d) => ({ categoria: d.nombre, [seriePenetracion]: d.valor }));
  const clickPenetracion = PENETRACION_CONFIG[vistaPenetracion].click;
  const tituloPenetracion = PENETRACION_CONFIG[vistaPenetracion].titulo;
  const subtituloPenetracion = vistaPenetracion === 'destinoInvalidos' ? 'Municipio externo donde votan los registros Inválidos' : 'Solo simpatizantes con validez Válido';

  // --- Tarjeta Dinámica 3: Caracterización Social y Discurso ----------------------------------
  const porIntereses = useMemo(() => agruparMultivalor(datos, (p) => p.gustosIntereses), [datos]);
  const porGruposSociales = useMemo(() => agruparMultivalor(datos, (p) => p.gruposSociales), [datos]);
  const porNivelAcademico = useMemo(() => agrupar(datos, (p) => p.nivelFormacion), [datos]);
  const porOcupacion = useMemo(() => agrupar(datos, (p) => p.ocupacion ?? 'Sin dato'), [datos]);

  function verInteres(categoria: string) {
    const ids = datos.filter((p) => p.gustosIntereses?.includes(categoria)).map((p) => p.id);
    irADirectorio(ids, `Mostrando ${ids.length} simpatizante(s) interesados en "${categoria}".`);
  }
  function verGrupoSocial(categoria: string) {
    const ids = datos.filter((p) => p.gruposSociales?.includes(categoria)).map((p) => p.id);
    irADirectorio(ids, `Mostrando ${ids.length} simpatizante(s) del grupo social "${categoria}".`);
  }
  function verNivelAcademico(categoria: string) {
    const ids = datos.filter((p) => p.nivelFormacion === categoria).map((p) => p.id);
    irADirectorio(ids, `Mostrando ${ids.length} simpatizante(s) con nivel académico "${categoria}".`);
  }
  function verOcupacion(categoria: string) {
    const ids = datos.filter((p) => (p.ocupacion ?? 'Sin dato') === categoria).map((p) => p.id);
    irADirectorio(ids, `Mostrando ${ids.length} simpatizante(s) con ocupación "${categoria}".`);
  }

  const selectorCaracterizacion = (
    <select
      value={vistaCaracterizacion}
      onChange={(e) => setVistaCaracterizacion(e.target.value as VistaCaracterizacion)}
      className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
    >
      <option value="intereses">Intereses y Temas Predominantes</option>
      <option value="gruposSociales">Distribución por Grupos Sociales</option>
      <option value="academico">Nivel Académico y Ocupación</option>
    </select>
  );

  if (stats.total === 0) {
    return <p className="text-sm text-gray-500">No hay datos disponibles para tu alcance de usuario.</p>;
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700">Panorama Electoral</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Simpatizantes Registrados" value={stats.total} sublabel="Conteo global bruto" />
          <StatCard
            label="Votos Válidos en Valledupar"
            value={stats.validos}
            tone="success"
            sublabel={`${stats.pctValidos}% del total`}
          />
          <StatCard
            label="Votos Inválidos / Fuera de Circunscripción"
            value={stats.invalidos}
            tone="danger"
            sublabel={`${stats.pctInvalidos}% del total`}
          />
          <StatCard
            label="Votos Indecisos / En Riesgo"
            value={stats.indecisosValidos}
            tone="warning"
            sublabel={`${stats.pctIndecisosValidos}% de los válidos`}
          />
          <StatCard
            label="Completitud de Datos Electorales"
            value={`${stats.pctCompletitud}%`}
            tone="success"
            sublabel="Con puesto y mesa asignados"
          />
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700">Salud e Integridad de la Base de Datos</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AlertaCard
            label={`Simpatizantes en Conflicto — ${personasEnConflicto.length}`}
            icon={<IconFlag className="h-4.5 w-4.5" />}
            tone="danger"
            onClick={irAAuditoria}
          />
          <AlertaCard
            label={`Fuga Territorial — ${fugaTerritorial.length}`}
            icon={<IconMap className="h-4.5 w-4.5" />}
            tone="danger"
            onClick={() =>
              irADirectorio(
                fugaTerritorial.map((p) => p.id),
                `Mostrando ${fugaTerritorial.length} simpatizante(s) que residen en Valledupar pero votan fuera de la circunscripción — Fuga Territorial.`,
              )
            }
          />
          <AlertaCard
            label={`Datos Incompletos — ${datosIncompletos.length}`}
            icon={<IconListCheck className="h-4.5 w-4.5" />}
            tone="danger"
            onClick={() =>
              irADirectorio(
                datosIncompletos.map((p) => p.id),
                `Mostrando ${datosIncompletos.length} simpatizante(s) sin mesa de votación o sin teléfono registrado — Datos Incompletos.`,
              )
            }
          />
          <AlertaCard
            label={`Concentración Telefónica — ${personasConcentracion.length}`}
            icon={<IconMegaphone className="h-4.5 w-4.5" />}
            tone="danger"
            onClick={() =>
              irADirectorio(
                personasConcentracion.map((p) => p.id),
                `Mostrando ${personasConcentracion.length} simpatizante(s) con un número de teléfono repetido junto a otros registros del mismo líder — Concentración Telefónica.`,
              )
            }
          />
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700">Análisis Territorial</p>
        <ComparativaBarChartCard
          title={
            vistaTerritorial === 'comunaVotacion'
              ? 'Votos Válidos por Comuna de Votación'
              : vistaTerritorial === 'corregimientoVotacion'
                ? 'Votos Válidos por Corregimiento de Votación'
                : vistaTerritorial === 'comunaResidencia'
                  ? 'Distribución por Comuna de Residencia'
                  : 'Distribución por Corregimiento de Residencia'
          }
          subtitle={esVistaVotacion ? 'Solo simpatizantes con validez Válido' : 'Todos los simpatizantes, según dónde viven'}
          datos={datosTerritorialActual.map((d) => ({ categoria: d.nombre, [serieTerritorial]: d.valor }))}
          series={[{ key: serieTerritorial, nombre: serieTerritorial, color: '#2563eb' }]}
          controles={selectorTerritorial}
          onCategoriaClick={esVistaVotacion ? verComunaVotacion : verComunaResidencia}
        />
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700">Penetración Geográfica Detallada</p>
        <ComparativaBarChartCard
          title={tituloPenetracion}
          subtitle={subtituloPenetracion}
          datos={datosPenetracion}
          series={[{ key: seriePenetracion, nombre: seriePenetracion, color: vistaPenetracion === 'destinoInvalidos' ? '#dc2626' : '#0d9488' }]}
          controles={selectorPenetracion}
          onCategoriaClick={clickPenetracion}
        />
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700">Caracterización Social y Discurso</p>
        {vistaCaracterizacion === 'academico' ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Nivel Académico y Ocupación</p>
                <p className="text-xs text-gray-400">Perfil educativo y laboral de los simpatizantes</p>
              </div>
              {selectorCaracterizacion}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Nivel académico</p>
                <ListaClicable datos={porNivelAcademico} onClick={verNivelAcademico} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Ocupación</p>
                <ListaClicable datos={porOcupacion} onClick={verOcupacion} />
              </div>
            </div>
          </div>
        ) : (
          <ComparativaBarChartCard
            title={vistaCaracterizacion === 'intereses' ? 'Intereses y Temas Predominantes' : 'Distribución por Grupos Sociales'}
            subtitle="Caracterización declarada por los propios simpatizantes"
            datos={(vistaCaracterizacion === 'intereses' ? porIntereses : porGruposSociales).map((d) => ({ categoria: d.nombre, Simpatizantes: d.valor }))}
            series={[{ key: 'Simpatizantes', nombre: 'Simpatizantes', color: '#7c3aed' }]}
            controles={selectorCaracterizacion}
            onCategoriaClick={vistaCaracterizacion === 'intereses' ? verInteres : verGrupoSocial}
          />
        )}
      </section>

      <section ref={refAuditoria}>
        <p className="mb-3 text-sm font-semibold text-gray-700">Mesa de Control y Paternidad de Duplicados</p>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className={th}>Cédula</th>
                  <th className={th}>Nombre</th>
                  <th className={th}>Primer registro</th>
                  <th className={th}>Segundo registro</th>
                  <th className={th}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gruposPendientes.map((grupo) => {
                  const [primero, segundo] = grupo;
                  const liderPrimero = personaPorId(primero.liderId);
                  const liderSegundo = personaPorId(segundo.liderId);
                  return (
                    <tr key={primero.cedula} className="hover:bg-gray-50">
                      <td className={td}>{primero.cedula}</td>
                      <td className={td}>{nombreCompleto(primero)}</td>
                      <td className={td}>
                        {primero.fechaRegistro} · {liderPrimero ? nombreCompleto(liderPrimero) : vacio}
                      </td>
                      <td className={td}>
                        {segundo.fechaRegistro} · {liderSegundo ? nombreCompleto(liderSegundo) : vacio}
                      </td>
                      <td className={`${td} space-x-2`}>
                        <button
                          type="button"
                          onClick={() => asignarPaternidad(primero, segundo)}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Asignar a {liderPrimero ? nombreCompleto(liderPrimero) : 'líder 1'}
                        </button>
                        <button
                          type="button"
                          onClick={() => asignarPaternidad(segundo, primero)}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Asignar a {liderSegundo ? nombreCompleto(liderSegundo) : 'líder 2'}
                        </button>
                        <button
                          type="button"
                          onClick={() => descartarDuplicado(primero.cedula)}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Descartar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {gruposPendientes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                      No hay duplicados pendientes de auditoría.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
