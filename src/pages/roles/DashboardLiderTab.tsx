import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Persona } from '../../types';
import { useDataStore } from '../../state/dataStore';
import { nombreCompleto } from '../../data/generarDatos';
import { zonaDeComuna } from '../../data/geografia';
import { StatCard, AlertaCard } from '../../components/common/StatCard';
import { DonutChartCard, BarChartCard, ComparativaBarChartCard } from '../../components/common/ChartCard';
import { IconUsers, IconMap, IconFlag, IconHelpCircle } from '../../components/layout/icons';

const UMBRAL_EQUIPO_MINIMO = 3; // debajo de esto, los porcentajes son ruido estadístico
const MARGEN_ALERTA = 0.25; // 25 puntos porcentuales por encima del promedio de la campaña

interface Alerta {
  lider: Persona;
  motivos: string[];
}

const GRAFICAS_INDIVIDUAL = [
  { key: 'barrio', label: 'Simpatizantes por barrio' },
  { key: 'corregimiento', label: 'Simpatizantes por corregimiento' },
  { key: 'puestoVotacion', label: 'Simpatizantes por puesto de votación' },
  { key: 'validezNivel', label: 'Validez y nivel de decisión' },
  { key: 'avanceMeta', label: 'Avance de meta' },
] as const;
type GraficaIndividualKey = (typeof GRAFICAS_INDIVIDUAL)[number]['key'];

// Igual a como el candidato clasifica a sus líderes: por número de votos (simpatizantes válidos) aportados.
const RANGOS_VOTOS = [
  { label: 'Hasta 5', min: 0, max: 5 },
  { label: '6–10', min: 6, max: 10 },
  { label: '11–15', min: 11, max: 15 },
  { label: '16–20', min: 16, max: 20 },
  { label: '21–30', min: 21, max: 30 },
  { label: '31–50', min: 31, max: 50 },
  { label: '51–70', min: 51, max: 70 },
  { label: '71–100', min: 71, max: 100 },
  { label: '100+', min: 101, max: Infinity },
] as const;

const VISTAS_GRUPALES = [
  { key: 'rangoVotos', label: 'Rango de votos' },
  { key: 'puestoVotacion', label: 'Líderes por puesto de votación' },
  { key: 'padrino', label: 'Por Padrino' },
] as const;
type VistaGrupalKey = (typeof VISTAS_GRUPALES)[number]['key'];

const ESTADO_ESTILOS: Record<'Verde' | 'Amarillo' | 'Rojo', string> = {
  Verde: 'bg-emerald-50 text-emerald-700',
  Amarillo: 'bg-amber-50 text-amber-700',
  Rojo: 'bg-red-50 text-red-700',
};
const thCompacto = 'px-3 py-1.5 font-semibold whitespace-nowrap';
const tdCompacto = 'px-3 py-1.5 text-gray-600 whitespace-nowrap';
const vacioCompacto = <span className="text-gray-300">—</span>;

function agrupar(lista: Persona[], clave: (p: Persona) => string) {
  const mapa = new Map<string, number>();
  lista.forEach((p) => {
    const k = clave(p);
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  });
  return Array.from(mapa.entries())
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);
}

function ModalMetas({ metas, onClose }: { metas: { lider: Persona; validos: number; meta: number; avance: number }[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Cumplimiento de Metas - Válidos</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Comportamiento de cada líder frente a la meta de simpatizantes válidos que se comprometió a aportarle a la
            campaña — válidos logrados vs. meta asignada.
          </p>
        </div>
        <ul className="space-y-2.5 px-6 py-5">
          {metas.map(({ lider, validos, meta, avance }) => (
            <li key={lider.id} className="flex items-center gap-3 text-sm">
              <span className="w-56 shrink-0 whitespace-nowrap text-gray-700">{nombreCompleto(lider)}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${avance >= 100 ? 'bg-emerald-500' : avance >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(avance, 100)}%` }}
                />
              </div>
              <span className="w-32 shrink-0 whitespace-nowrap text-right text-xs text-gray-500">
                {validos}/{meta} · {avance}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ModalIndecisos({
  datos,
  onClose,
}: {
  datos: { lider: Persona; indecisos: number; meta: number; proporcion: number }[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Meta vs Indecisos</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Qué tan firmes están en realidad los simpatizantes válidos de cada líder.</p>
        </div>
        <ul className="space-y-2.5 px-6 py-5">
          {datos.map(({ lider, indecisos, meta, proporcion }) => (
            <li key={lider.id} className="flex items-center gap-3 text-sm">
              <span className="w-56 shrink-0 whitespace-nowrap text-gray-700">{nombreCompleto(lider)}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${proporcion >= 50 ? 'bg-red-500' : proporcion >= 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(proporcion, 100)}%` }}
                />
              </div>
              <span className="w-32 shrink-0 whitespace-nowrap text-right text-xs text-gray-500">
                {indecisos} indeciso(s) / meta {meta}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DashboardLiderTab() {
  const personas = useDataStore((s) => s.personas);
  const navigate = useNavigate();
  const [verTodasMetas, setVerTodasMetas] = useState(false);
  const [verTodosIndecisos, setVerTodosIndecisos] = useState(false);
  const [vistaGrupal, setVistaGrupal] = useState<VistaGrupalKey>('rangoVotos');

  const lideres = useMemo(() => personas.filter((p) => p.rol === 'Líder'), [personas]);
  const simpatizantes = useMemo(() => personas.filter((p) => p.rol === 'Simpatizante'), [personas]);

  const liderOpciones = useMemo(() => [...lideres].sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b))), [lideres]);
  const [liderId, setLiderId] = useState('');
  const [graficaIndividual, setGraficaIndividual] = useState<GraficaIndividualKey>('barrio');
  const liderActivo = liderOpciones.find((l) => l.id === liderId) ?? liderOpciones[0];

  const equipoLiderActivo = useMemo(
    () => (liderActivo ? simpatizantes.filter((s) => s.liderId === liderActivo.id) : []),
    [simpatizantes, liderActivo],
  );

  const gestionIndividual = useMemo(
    () => ({
      barrio: agrupar(
        equipoLiderActivo.filter((p) => p.municipio === 'Valledupar' && zonaDeComuna(p.municipio, p.comuna) === 'Urbana'),
        (p) => p.barrio,
      ),
      corregimiento: agrupar(
        equipoLiderActivo.filter((p) => p.municipio === 'Valledupar' && zonaDeComuna(p.municipio, p.comuna) === 'Rural'),
        (p) => p.comuna,
      ),
      puestoVotacion: agrupar(equipoLiderActivo, (p) => p.puestoVotacion ?? 'Sin dato'),
      validez: [
        { nombre: 'Válido', valor: equipoLiderActivo.filter((p) => p.validez === 'Válido').length },
        { nombre: 'Inválido', valor: equipoLiderActivo.filter((p) => p.validez === 'Inválido').length },
      ],
      nivel: [
        { nombre: 'Firme', valor: equipoLiderActivo.filter((p) => p.nivel === 'Firme').length },
        { nombre: 'Indeciso', valor: equipoLiderActivo.filter((p) => p.nivel === 'Indeciso').length },
      ],
      avanceMeta: [
        { nombre: 'Válidos', valor: equipoLiderActivo.filter((p) => p.validez === 'Válido').length },
        { nombre: 'Meta', valor: liderActivo?.metaSimpatizantes ?? 0 },
      ],
    }),
    [equipoLiderActivo, liderActivo],
  );

  const validosLiderActivo = equipoLiderActivo.filter((p) => p.validez === 'Válido').length;
  const metaLiderActivo = liderActivo?.metaSimpatizantes ?? 0;
  const avanceLiderActivo = metaLiderActivo ? Math.round((validosLiderActivo / metaLiderActivo) * 100) : 0;

  const equipos = useMemo(
    () =>
      lideres.map((lider) => ({
        lider,
        equipo: personas.filter((p) => p.liderId === lider.id),
      })),
    [lideres, personas],
  );

  const stats = useMemo(() => ({ total: lideres.length }), [lideres]);

  // --- Alertas de calidad de dato ------------------------------------------------------------
  const alertas = useMemo<Alerta[]>(() => {
    const consideradas = equipos.filter((e) => e.equipo.length >= UMBRAL_EQUIPO_MINIMO);
    if (!consideradas.length) return [];

    const promedioInvalido =
      consideradas.reduce((s, e) => s + e.equipo.filter((p) => p.validez === 'Inválido').length / e.equipo.length, 0) / consideradas.length;
    const promedioSinPuesto =
      consideradas.reduce((s, e) => s + e.equipo.filter((p) => !p.puestoVotacionId || !p.mesaVotacion).length / e.equipo.length, 0) /
      consideradas.length;

    return equipos
      .map(({ lider, equipo }): Alerta => {
        const motivos: string[] = [];
        const total = equipo.length;

        if (total >= UMBRAL_EQUIPO_MINIMO) {
          const pctInvalido = equipo.filter((p) => p.validez === 'Inválido').length / total;
          if (pctInvalido >= promedioInvalido + MARGEN_ALERTA) {
            motivos.push(`${Math.round(pctInvalido * 100)}% Inválido (fuera de circunscripción) — promedio ${Math.round(promedioInvalido * 100)}%`);
          }

          const pctSinPuesto = equipo.filter((p) => !p.puestoVotacionId || !p.mesaVotacion).length / total;
          if (pctSinPuesto >= promedioSinPuesto + MARGEN_ALERTA) {
            motivos.push(`${Math.round(pctSinPuesto * 100)}% sin puesto/mesa de votación — promedio ${Math.round(promedioSinPuesto * 100)}%`);
          }
        }

        const telefonos = equipo.map((p) => p.telefono).filter(Boolean);
        const telefonosDuplicados = telefonos.filter((t, i) => telefonos.indexOf(t) !== i);
        if (telefonosDuplicados.length) {
          motivos.push(`${new Set(telefonosDuplicados).size} teléfono(s) repetido(s) entre simpatizantes de su equipo`);
        }

        return { lider, motivos };
      })
      .filter((a) => a.motivos.length > 0)
      .sort((a, b) => b.motivos.length - a.motivos.length);
  }, [equipos]);

  const lideresDatosInvalidos = useMemo(
    () =>
      alertas
        .map((a) => ({ lider: a.lider, motivo: a.motivos.find((m) => m.includes('Inválido')) }))
        .filter((a): a is { lider: Persona; motivo: string } => Boolean(a.motivo)),
    [alertas],
  );

  // --- Cumplimiento de metas ------------------------------------------------------------------
  const metas = useMemo(
    () =>
      equipos
        .map(({ lider, equipo }) => {
          const validos = equipo.filter((p) => p.validez === 'Válido').length;
          const meta = lider.metaSimpatizantes ?? 0;
          const avance = meta ? Math.round((validos / meta) * 100) : 0;
          return { lider, validos, meta, avance };
        })
        .sort((a, b) => a.avance - b.avance),
    [equipos],
  );

  // --- Meta vs Indecisos (líderes que prometen votos que su gente aún no tiene decididos) ----
  const indecisosVsMeta = useMemo(
    () =>
      equipos
        .map(({ lider, equipo }) => {
          const indecisos = equipo.filter((p) => p.nivel === 'Indeciso').length;
          const meta = lider.metaSimpatizantes ?? 0;
          const proporcion = meta ? Math.round((indecisos / meta) * 100) : 0;
          return { lider, indecisos, meta, proporcion };
        })
        .sort((a, b) => b.proporcion - a.proporcion),
    [equipos],
  );
  const lideresBajoMeta = useMemo(() => metas.filter((m) => m.avance < 100).length, [metas]);
  const lideresIndecisosSobreMeta = useMemo(() => indecisosVsMeta.filter((m) => m.proporcion >= 100).length, [indecisosVsMeta]);

  // --- Panorama grupal: rango de votos / puesto de votación / padrino ------------------------
  const rangosVotos = useMemo(
    () =>
      RANGOS_VOTOS.map((r) => ({
        ...r,
        entradas: metas.filter((m) => m.validos >= r.min && m.validos <= r.max),
      })),
    [metas],
  );

  function agruparLideres(lista: Persona[], clave: (p: Persona) => string) {
    const mapa = new Map<string, Persona[]>();
    lista.forEach((lider) => {
      const etiqueta = clave(lider);
      mapa.set(etiqueta, [...(mapa.get(etiqueta) ?? []), lider]);
    });
    return Array.from(mapa.entries())
      .map(([label, lideresDelGrupo]) => ({ label, entradas: lideresDelGrupo.map((lider) => ({ lider })) }))
      .sort((a, b) => b.entradas.length - a.entradas.length)
      .slice(0, 10);
  }

  const rangosPuestoVotacion = useMemo(
    () =>
      agruparLideres(
        lideres.filter((l) => l.validez === 'Válido'),
        (l) => l.puestoVotacion ?? 'Sin dato',
      ),
    [lideres],
  );
  const rangosPadrino = useMemo(
    () =>
      agruparLideres(lideres, (lider) => {
        const padrino = personas.find((p) => p.id === lider.padrinoId);
        return padrino ? `${nombreCompleto(padrino)}${padrino.rol === 'Candidato' ? ' (Candidato)' : ''}` : 'Sin asignar';
      }),
    [lideres, personas],
  );

  function bracketsDeVista(vista: VistaGrupalKey) {
    if (vista === 'rangoVotos') return rangosVotos;
    if (vista === 'puestoVotacion') return rangosPuestoVotacion;
    return rangosPadrino;
  }

  const datosGrupal = bracketsDeVista(vistaGrupal).map((r) => ({ categoria: r.label, Líderes: r.entradas.length }));

  function cambiarVistaGrupal(v: VistaGrupalKey) {
    setVistaGrupal(v);
  }

  function verDirectorioDelRango(categoria: string) {
    const bracket = bracketsDeVista(vistaGrupal).find((r) => r.label === categoria);
    if (!bracket) return;
    const etiquetaVista = VISTAS_GRUPALES.find((v) => v.key === vistaGrupal)?.label ?? '';
    navigate('/roles/lider/directorio', {
      state: {
        idsFiltro: bracket.entradas.map((e) => e.lider.id),
        motivo: `Mostrando ${bracket.entradas.length} líder(es) en "${categoria}" — ${etiquetaVista}.`,
      },
    });
  }

  // --- Ranking de Rendimiento de Líderes ------------------------------------------------------
  // Antes existía "Top 10 líderes por tamaño de equipo", pero contaba TODOS los registros del
  // equipo sin distinguir válidos de inválidos — un líder con puras planillas inválidas parecía
  // "productivo". Este ranking sí distingue, y el semáforo se calibra contra el promedio de LA
  // CAMPAÑA (no un umbral fijo) para no castigar equipos muy pequeños por puro ruido estadístico.
  const MARGEN_AMARILLO_RANKING = 10;
  const MARGEN_ROJO_RANKING = 25;

  const cedulasEnConflicto = useMemo(() => {
    const mapa = new Map<string, number>();
    simpatizantes.forEach((p) => mapa.set(p.cedula, (mapa.get(p.cedula) ?? 0) + 1));
    return new Set(Array.from(mapa.entries()).filter(([, n]) => n > 1).map(([cedula]) => cedula));
  }, [simpatizantes]);

  const campania = useMemo(() => {
    const totalSimpatizantes = simpatizantes.length;
    const validosCampania = simpatizantes.filter((p) => p.validez === 'Válido');
    const pctInvalidos = totalSimpatizantes ? Math.round(((totalSimpatizantes - validosCampania.length) / totalSimpatizantes) * 100) : 0;
    const pctIndecisosValidos = validosCampania.length
      ? Math.round((validosCampania.filter((p) => p.nivel === 'Indeciso').length / validosCampania.length) * 100)
      : 0;
    return { pctInvalidos, pctIndecisosValidos };
  }, [simpatizantes]);

  const [verTodoElRanking, setVerTodoElRanking] = useState(false);
  const rankingLideres = useMemo(() => {
    return lideres
      .map((lider) => {
        const equipo = simpatizantes.filter((p) => p.liderId === lider.id);
        const validosEquipo = equipo.filter((p) => p.validez === 'Válido');
        const invalidosEquipo = equipo.length - validosEquipo.length;
        const indecisosEquipo = validosEquipo.filter((p) => p.nivel === 'Indeciso').length;
        const pctIndecisos = validosEquipo.length ? Math.round((indecisosEquipo / validosEquipo.length) * 100) : 0;
        const pctInvalidos = equipo.length ? Math.round((invalidosEquipo / equipo.length) * 100) : 0;
        const enConflicto = equipo.filter((p) => cedulasEnConflicto.has(p.cedula)).length;
        const pctConflicto = equipo.length ? (enConflicto / equipo.length) * 100 : 0;

        let estado: 'Verde' | 'Amarillo' | 'Rojo' = 'Verde';
        if (equipo.length >= UMBRAL_EQUIPO_MINIMO) {
          if (pctInvalidos > campania.pctInvalidos + MARGEN_ROJO_RANKING || pctIndecisos > campania.pctIndecisosValidos + MARGEN_ROJO_RANKING || pctConflicto > 15) {
            estado = 'Rojo';
          } else if (
            pctInvalidos > campania.pctInvalidos + MARGEN_AMARILLO_RANKING ||
            pctIndecisos > campania.pctIndecisosValidos + MARGEN_AMARILLO_RANKING ||
            enConflicto > 0
          ) {
            estado = 'Amarillo';
          }
        }
        return { lider, registrados: equipo.length, validos: validosEquipo.length, invalidos: invalidosEquipo, pctIndecisos, enConflicto, estado };
      })
      .sort((a, b) => b.validos - a.validos);
  }, [lideres, simpatizantes, cedulasEnConflicto, campania]);

  const resumenRanking = useMemo(
    () => ({
      Verde: rankingLideres.filter((r) => r.estado === 'Verde').length,
      Amarillo: rankingLideres.filter((r) => r.estado === 'Amarillo').length,
      Rojo: rankingLideres.filter((r) => r.estado === 'Rojo').length,
    }),
    [rankingLideres],
  );
  const filasRanking = verTodoElRanking ? rankingLideres : rankingLideres.slice(0, 10);

  if (stats.total === 0) {
    return <p className="text-sm text-gray-500">Todavía no hay líderes registrados.</p>;
  }

  const controlesIndividual = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={liderActivo?.id ?? ''}
        onChange={(e) => setLiderId(e.target.value)}
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
      >
        {liderOpciones.map((l) => (
          <option key={l.id} value={l.id}>
            {nombreCompleto(l)}
          </option>
        ))}
      </select>
      <select
        value={graficaIndividual}
        onChange={(e) => setGraficaIndividual(e.target.value as GraficaIndividualKey)}
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
      >
        {GRAFICAS_INDIVIDUAL.map((g) => (
          <option key={g.key} value={g.key}>
            {g.label}
          </option>
        ))}
      </select>
    </div>
  );

  const subtituloIndividual = `Equipo de ${equipoLiderActivo.length} simpatizante(s)`;
  const subtituloBarrioCorregimiento = `${subtituloIndividual} — solo residentes de Valledupar`;

  return (
    <div className="space-y-8">
      <section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total de líderes" value={stats.total} icon={<IconUsers className="h-4.5 w-4.5" />} />
          <AlertaCard
            label="Circunscripción Inválida"
            tone={lideresDatosInvalidos.length ? 'dark' : 'default'}
            icon={<IconMap className="h-4.5 w-4.5" />}
            onClick={() =>
              navigate('/roles/lider/directorio', {
                state: {
                  idsFiltro: lideresDatosInvalidos.map((d) => d.lider.id),
                  motivo: `Mostrando ${lideresDatosInvalidos.length} líder(es) con % de simpatizantes inválidos muy por encima del promedio de la campaña.`,
                },
              })
            }
          />
          <AlertaCard
            label="Cumplimiento de Metas"
            tone={lideresBajoMeta ? 'dark' : 'default'}
            icon={<IconFlag className="h-4.5 w-4.5" />}
            onClick={() => setVerTodasMetas(true)}
          />
          <AlertaCard
            label="Alerta de decisión"
            tone={lideresIndecisosSobreMeta ? 'dark' : 'default'}
            icon={<IconHelpCircle className="h-4.5 w-4.5" />}
            onClick={() => setVerTodosIndecisos(true)}
          />
        </div>
        <div className="mt-4">
          {(graficaIndividual === 'barrio' || graficaIndividual === 'corregimiento' || graficaIndividual === 'puestoVotacion') && (
            <BarChartCard
              title="Gestión individual del líder"
              subtitle={graficaIndividual === 'puestoVotacion' ? subtituloIndividual : subtituloBarrioCorregimiento}
              datos={gestionIndividual[graficaIndividual]}
              horizontal
              controles={controlesIndividual}
            />
          )}
          {graficaIndividual === 'validezNivel' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DonutChartCard
                title="Gestión individual del líder — Validez"
                subtitle={subtituloIndividual}
                datos={gestionIndividual.validez}
                controles={controlesIndividual}
              />
              <DonutChartCard title="Gestión individual del líder — Nivel de decisión" subtitle={subtituloIndividual} datos={gestionIndividual.nivel} />
            </div>
          )}
          {graficaIndividual === 'avanceMeta' && (
            <BarChartCard
              title="Gestión individual del líder — Avance de meta"
              subtitle={`${subtituloIndividual} — ${validosLiderActivo}/${metaLiderActivo} · ${avanceLiderActivo}%`}
              datos={gestionIndividual.avanceMeta}
              controles={controlesIndividual}
            />
          )}
        </div>
      </section>

      <section>
        <ComparativaBarChartCard
          title="Panorama grupal de líderes"
          subtitle="Cómo se agrupan los líderes según su desempeño — haz clic en una barra para ver el directorio"
          datos={datosGrupal}
          series={[{ key: 'Líderes', nombre: 'Líderes', color: '#2563eb' }]}
          onCategoriaClick={verDirectorioDelRango}
          controles={
            <select
              value={vistaGrupal}
              onChange={(e) => cambiarVistaGrupal(e.target.value as VistaGrupalKey)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
            >
              {VISTAS_GRUPALES.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </select>
          }
        />
      </section>

      <section>
        <div className="mb-1 flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-700">Alertas de calidad de dato</p>
          {alertas.length > 0 && (
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">{alertas.length}</span>
          )}
        </div>
        <p className="mb-3 text-xs text-gray-400">
          Vista general de las {alertas.length} líder(es) con alguna alerta — incluye datos fuera de jurisdicción, puesto/mesa de
          votación sin diligenciar y teléfonos duplicados. "Líderes sin Calidad de Datos" arriba muestra solo el primer caso.
        </p>
        {alertas.length === 0 ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            Sin alertas activas — ningún líder se aparta significativamente del promedio de la campaña.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-xs uppercase tracking-wide text-white">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Líder</th>
                    <th className="px-4 py-2.5 text-center font-semibold">N°</th>
                    <th className="px-4 py-2.5 font-semibold">Motivos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alertas.map(({ lider, motivos }) => (
                    <tr key={lider.id}>
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-800">{nombreCompleto(lider)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{motivos.length}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        <ul className="list-disc space-y-0.5 pl-4">
                          {motivos.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-700">Ranking de Rendimiento de Líderes</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{resumenRanking.Verde} Verde</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{resumenRanking.Amarillo} Amarillo</span>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">{resumenRanking.Rojo} Rojo</span>
          </div>
          {rankingLideres.length > 10 && (
            <button
              type="button"
              onClick={() => setVerTodoElRanking((v) => !v)}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              {verTodoElRanking ? 'Mostrar solo Top 10' : `Ver los ${rankingLideres.length} líderes`}
            </button>
          )}
        </div>
        <p className="mb-3 text-xs text-gray-400">Ordenado por votos válidos aportados — el semáforo compara a cada líder contra el promedio de la campaña.</p>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className={`overflow-x-auto ${verTodoElRanking ? 'max-h-[420px] overflow-y-auto' : ''}`}>
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-gray-50 uppercase tracking-wide text-gray-500">
                <tr>
                  <th className={thCompacto}>#</th>
                  <th className={thCompacto}>Líder</th>
                  <th className={thCompacto}>Registrados</th>
                  <th className={thCompacto}>Válidos</th>
                  <th className={thCompacto}>Inválidos</th>
                  <th className={thCompacto}>% Indecisos</th>
                  <th className={thCompacto}>Conflicto</th>
                  <th className={thCompacto}>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filasRanking.map((r, i) => (
                  <tr key={r.lider.id} className="hover:bg-gray-50">
                    <td className={tdCompacto}>{i + 1}</td>
                    <td className={`${tdCompacto} font-medium text-gray-900`}>{nombreCompleto(r.lider)}</td>
                    <td className={tdCompacto}>{r.registrados}</td>
                    <td className={tdCompacto}>{r.validos}</td>
                    <td className={tdCompacto}>{r.invalidos}</td>
                    <td className={tdCompacto}>{r.pctIndecisos}%</td>
                    <td className={tdCompacto}>{r.enConflicto || vacioCompacto}</td>
                    <td className={tdCompacto}>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTADO_ESTILOS[r.estado]}`}>{r.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {verTodasMetas && <ModalMetas metas={metas} onClose={() => setVerTodasMetas(false)} />}
      {verTodosIndecisos && <ModalIndecisos datos={indecisosVsMeta} onClose={() => setVerTodosIndecisos(false)} />}
    </div>
  );
}
