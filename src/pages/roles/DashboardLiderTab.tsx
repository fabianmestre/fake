import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Persona } from '../../types';
import { useDataStore } from '../../state/dataStore';
import { nombreCompleto } from '../../data/generarDatos';
import { StatCard, AlertaCard } from '../../components/common/StatCard';
import { DonutChartCard, RankingCard, BarChartCard, ComparativaBarChartCard } from '../../components/common/ChartCard';
import { IconUsers, IconMap, IconFlag, IconHelpCircle } from '../../components/layout/icons';

const UMBRAL_EQUIPO_MINIMO = 3; // debajo de esto, los porcentajes son ruido estadístico
const MARGEN_ALERTA = 0.25; // 25 puntos porcentuales por encima del promedio de la campaña

interface Alerta {
  lider: Persona;
  motivos: string[];
}

const GRAFICAS_INDIVIDUAL = [
  { key: 'barrio', label: 'Simpatizantes por barrio' },
  { key: 'puestoVotacion', label: 'Simpatizantes por puesto de votación' },
  { key: 'validezNivel', label: 'Validez y nivel de decisión' },
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

const RANGOS_AVANCE = [
  { label: '0–24%', min: 0, max: 24 },
  { label: '25–49%', min: 25, max: 49 },
  { label: '50–74%', min: 50, max: 74 },
  { label: '75–99%', min: 75, max: 99 },
  { label: '100%+', min: 100, max: Infinity },
] as const;

const VISTAS_GRUPALES = [
  { key: 'rangoVotos', label: 'Rango de votos' },
  { key: 'avanceMeta', label: 'Avance de meta' },
] as const;
type VistaGrupalKey = (typeof VISTAS_GRUPALES)[number]['key'];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Cumplimiento de metas — todos los líderes</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <ul className="space-y-2.5 px-6 py-5">
          {metas.map(({ lider, validos, meta, avance }) => (
            <li key={lider.id} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate text-gray-700">{nombreCompleto(lider)}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${avance >= 100 ? 'bg-emerald-500' : avance >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(avance, 100)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-gray-500">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Meta vs Indecisos — todos los líderes</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <ul className="space-y-2.5 px-6 py-5">
          {datos.map(({ lider, indecisos, meta, proporcion }) => (
            <li key={lider.id} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate text-gray-700">{nombreCompleto(lider)}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${proporcion >= 50 ? 'bg-red-500' : proporcion >= 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(proporcion, 100)}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-xs text-gray-500">
                {indecisos} indeciso(s) / meta {meta} · {proporcion}%
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
      barrio: agrupar(equipoLiderActivo, (p) => p.barrio),
      puestoVotacion: agrupar(equipoLiderActivo, (p) => p.puestoVotacion ?? 'Sin dato'),
      validez: [
        { nombre: 'Válido', valor: equipoLiderActivo.filter((p) => p.validez === 'Válido').length },
        { nombre: 'Inválido', valor: equipoLiderActivo.filter((p) => p.validez === 'Inválido').length },
      ],
      nivel: [
        { nombre: 'Firme', valor: equipoLiderActivo.filter((p) => p.nivel === 'Firme').length },
        { nombre: 'Indeciso', valor: equipoLiderActivo.filter((p) => p.nivel === 'Indeciso').length },
      ],
    }),
    [equipoLiderActivo],
  );

  const equipos = useMemo(
    () =>
      lideres.map((lider) => ({
        lider,
        equipo: personas.filter((p) => p.liderId === lider.id),
      })),
    [lideres, personas],
  );

  const stats = useMemo(() => {
    const total = lideres.length;
    const tamanosEquipo = equipos.map((e) => ({ lider: e.lider, tamano: e.equipo.length }));

    return { total, tamanosEquipo };
  }, [lideres, equipos]);

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

  // --- Panorama grupal: rango de votos / avance de meta --------------------------------------
  const rangosVotos = useMemo(
    () =>
      RANGOS_VOTOS.map((r) => ({
        ...r,
        entradas: metas.filter((m) => m.validos >= r.min && m.validos <= r.max),
      })),
    [metas],
  );
  const rangosAvance = useMemo(
    () =>
      RANGOS_AVANCE.map((r) => ({
        ...r,
        entradas: metas.filter((m) => m.avance >= r.min && m.avance <= r.max),
      })),
    [metas],
  );

  const datosGrupal =
    vistaGrupal === 'rangoVotos'
      ? rangosVotos.map((r) => ({ categoria: r.label, Líderes: r.entradas.length }))
      : rangosAvance.map((r) => ({ categoria: r.label, Líderes: r.entradas.length }));

  function cambiarVistaGrupal(v: VistaGrupalKey) {
    setVistaGrupal(v);
  }

  function verDirectorioDelRango(categoria: string) {
    const bracket = (vistaGrupal === 'rangoVotos' ? rangosVotos : rangosAvance).find((r) => r.label === categoria);
    if (!bracket) return;
    const etiquetaVista = VISTAS_GRUPALES.find((v) => v.key === vistaGrupal)?.label ?? '';
    navigate('/roles/lider/directorio', {
      state: {
        idsFiltro: bracket.entradas.map((e) => e.lider.id),
        motivo: `Mostrando ${bracket.entradas.length} líder(es) en el rango "${bracket.label}" — ${etiquetaVista}.`,
      },
    });
  }

  const topEquipos = useMemo(
    () =>
      [...stats.tamanosEquipo]
        .sort((a, b) => b.tamano - a.tamano)
        .slice(0, 10)
        .map((t) => ({ nombre: nombreCompleto(t.lider), valor: t.tamano })),
    [stats.tamanosEquipo],
  );

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
            label="Alerta de Inválidos"
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
          {(graficaIndividual === 'barrio' || graficaIndividual === 'puestoVotacion') && (
            <BarChartCard
              title="Gestión individual del líder"
              subtitle={subtituloIndividual}
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
        <RankingCard title="Top 10 líderes por tamaño de equipo" datos={topEquipos} />
      </section>

      {verTodasMetas && <ModalMetas metas={metas} onClose={() => setVerTodasMetas(false)} />}
      {verTodosIndecisos && <ModalIndecisos datos={indecisosVsMeta} onClose={() => setVerTodosIndecisos(false)} />}
    </div>
  );
}
