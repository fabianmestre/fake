import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../state/dataStore';
import { esDiaE, fechaDiaEFormateada } from '../lib/diaE';
import { nombreCompleto } from '../data/generarDatos';
import { zonaDeComuna } from '../data/geografia';
import { PUESTOS_VALLEDUPAR } from '../data/puestosVotacion';
import type { Persona } from '../types';
import { StatCard } from '../components/common/StatCard';
import { DonutChartCard, BarChartCard } from '../components/common/ChartCard';
import { IconListCheck, IconUsers, IconMegaphone, IconMap } from '../components/layout/icons';

type Tab = 'votos' | 'lideres' | 'transporte' | 'division';
const TABS: { key: Tab; label: string; icon: (c: string) => React.ReactNode }[] = [
  { key: 'votos', label: 'Votos', icon: (c) => <IconListCheck className={c} /> },
  { key: 'lideres', label: 'Líderes', icon: (c) => <IconUsers className={c} /> },
  { key: 'transporte', label: 'Transporte', icon: (c) => <IconMegaphone className={c} /> },
  { key: 'division', label: 'División Electoral', icon: (c) => <IconMap className={c} /> },
];

interface LiderDiaE {
  lider: Persona;
  territorio: string;
  equipo: Persona[];
  meta: number;
  votosHoy: number;
  porMovilizar: number;
  avance: number;
  estado: 'En meta' | 'Cerca' | 'Atrasado' | 'Sin meta';
  pendientesIds: string[];
}

const ESTADO_LIDER_ESTILOS: Record<LiderDiaE['estado'], string> = {
  'En meta': 'bg-emerald-50 text-emerald-700',
  Cerca: 'bg-amber-50 text-amber-700',
  Atrasado: 'bg-red-50 text-red-700',
  'Sin meta': 'bg-gray-100 text-gray-600',
};

export function DiaEPage() {
  const personas = useDataStore((s) => s.personas);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('votos');
  const [hora, setHora] = useState(new Date());
  const [puestoExpandido, setPuestoExpandido] = useState<string | null>(null);
  const [zonaExpandida, setZonaExpandida] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  function irADirectorio(ids: string[], motivo: string) {
    navigate('/roles/simpatizante/directorio', { state: { idsFiltro: ids, motivo } });
  }

  const validosValledupar = useMemo(() => personas.filter((p) => p.rol === 'Simpatizante' && p.validez === 'Válido'), [personas]);
  const yaVotaron = useMemo(() => validosValledupar.filter((p) => p.voto), [validosValledupar]);
  const pendientes = useMemo(() => validosValledupar.filter((p) => !p.voto), [validosValledupar]);
  const pendientesFirmes = useMemo(() => pendientes.filter((p) => p.nivel === 'Firme'), [pendientes]);
  const pctAvanceGlobal = validosValledupar.length ? Math.round((yaVotaron.length / validosValledupar.length) * 100) : 0;

  const lideres = useMemo(() => personas.filter((p) => p.rol === 'Líder'), [personas]);
  const lideresConDatos = useMemo<LiderDiaE[]>(() => {
    return lideres
      .map((lider) => {
        const equipo = validosValledupar.filter((p) => p.liderId === lider.id);
        const votosHoy = equipo.filter((p) => p.voto).length;
        const pendientesDelLider = equipo.filter((p) => !p.voto);
        const meta = lider.metaSimpatizantes ?? 0;
        const avance = meta ? Math.round((votosHoy / meta) * 100) : 0;
        let estado: LiderDiaE['estado'] = 'Sin meta';
        if (meta > 0) {
          if (avance >= 100) estado = 'En meta';
          else if (avance >= 50) estado = 'Cerca';
          else estado = 'Atrasado';
        }
        return {
          lider,
          territorio: lider.comuna,
          equipo,
          meta,
          votosHoy,
          porMovilizar: pendientesDelLider.length,
          avance,
          estado,
          pendientesIds: pendientesDelLider.map((p) => p.id),
        };
      })
      .sort((a, b) => a.avance - b.avance);
  }, [lideres, validosValledupar]);

  const topPendientesPorLider = useMemo(
    () =>
      [...lideresConDatos]
        .filter((l) => l.porMovilizar > 0)
        .sort((a, b) => b.porMovilizar - a.porMovilizar)
        .slice(0, 10)
        .map((l) => ({ nombre: nombreCompleto(l.lider), valor: l.porMovilizar })),
    [lideresConDatos],
  );

  // --- Transporte -------------------------------------------------------------------------
  const ofertantes = useMemo(() => personas.filter((p) => p.vehiculoDisponible), [personas]);
  const totalVehiculos = useMemo(() => ofertantes.reduce((s, p) => s + p.vehiculos.length, 0), [ofertantes]);
  const capacidadTotal = useMemo(
    () => ofertantes.reduce((s, p) => s + p.vehiculos.reduce((s2, v) => s2 + (v.pasajeros ?? 0), 0), 0),
    [ofertantes],
  );
  const zonasConTransporte = useMemo(() => new Set(ofertantes.map((p) => p.comuna)).size, [ofertantes]);

  const vehiculosPorZona = useMemo(() => {
    const mapa = new Map<string, { vehiculos: number; capacidad: number; personas: Persona[] }>();
    ofertantes.forEach((p) => {
      const actual = mapa.get(p.comuna) ?? { vehiculos: 0, capacidad: 0, personas: [] };
      actual.vehiculos += p.vehiculos.length;
      actual.capacidad += p.vehiculos.reduce((s, v) => s + (v.pasajeros ?? 0), 0);
      actual.personas.push(p);
      mapa.set(p.comuna, actual);
    });
    return Array.from(mapa.entries())
      .map(([zona, d]) => ({ zona, ...d }))
      .sort((a, b) => b.vehiculos - a.vehiculos);
  }, [ofertantes]);

  const cuellosDeBotella = useMemo(() => {
    const mapaFirmes = new Map<string, Persona[]>();
    pendientesFirmes.forEach((p) => mapaFirmes.set(p.comuna, [...(mapaFirmes.get(p.comuna) ?? []), p]));
    const zonas = new Set([...mapaFirmes.keys(), ...vehiculosPorZona.map((z) => z.zona)]);
    return Array.from(zonas)
      .map((zona) => {
        const firmes = mapaFirmes.get(zona) ?? [];
        const transporte = vehiculosPorZona.find((z) => z.zona === zona);
        const capacidad = transporte?.capacidad ?? 0;
        const vehiculosZona = transporte?.vehiculos ?? 0;
        const estado: 'Cubierto' | 'Insuficiente' | 'Sin transporte' =
          firmes.length === 0 ? 'Cubierto' : capacidad >= firmes.length ? 'Cubierto' : vehiculosZona > 0 ? 'Insuficiente' : 'Sin transporte';
        return { zona, firmes, vehiculos: vehiculosZona, capacidad, estado };
      })
      .filter((z) => z.firmes.length > 0)
      .sort((a, b) => b.firmes.length - a.firmes.length);
  }, [pendientesFirmes, vehiculosPorZona]);

  const ESTADO_TRANSPORTE_ESTILOS: Record<string, string> = {
    Cubierto: 'bg-emerald-50 text-emerald-700',
    Insuficiente: 'bg-amber-50 text-amber-700',
    'Sin transporte': 'bg-red-50 text-red-700',
  };

  // --- División Electoral -------------------------------------------------------------------
  const puestosConVotos = useMemo(() => {
    return PUESTOS_VALLEDUPAR.map((puesto) => {
      const asignados = validosValledupar.filter((p) => p.puestoVotacionId === puesto.id);
      const zona = puesto.comunas?.length ? zonaDeComuna('Valledupar', puesto.comunas[0]) : undefined;
      const mesas = puesto.mesas.map((m) => ({
        numero: m.numero,
        votos: asignados.filter((p) => p.mesaVotacion === m.numero).length,
        ids: asignados.filter((p) => p.mesaVotacion === m.numero).map((p) => p.id),
      }));
      return {
        puesto,
        zona: zona ?? '—',
        comunas: puesto.comunas?.join(', ') ?? '—',
        rangoMesas: puesto.mesas.length ? `${puesto.mesas[0].numero}–${puesto.mesas[puesto.mesas.length - 1].numero}` : '—',
        votos: asignados.length,
        mesas,
      };
    }).sort((a, b) => b.votos - a.votos);
  }, [validosValledupar]);

  const totalPuestos = puestosConVotos.length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Centro de Mando — Día E</h1>
        <p className="text-sm text-gray-500">Votos, líderes, transporte y censo</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-blue-600 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold">Centro de Mando — Día E</p>
          <p className="text-sm text-blue-100">
            Monitoreo en tiempo real de la movilización de votantes
            {!esDiaE() && <> — fuera de la jornada electoral ({fechaDiaEFormateada()}), mostrando el estado actual de los datos.</>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/15 px-4 py-2 text-sm">
            <span className="font-semibold">{hora.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}</span>{' '}
            <span className="text-blue-100">hora actual</span>
          </div>
          <button
            type="button"
            onClick={() => setHora(new Date())}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            ↻ Actualizar
          </button>
        </div>
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

      {tab === 'votos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Válidos en Valledupar" value={validosValledupar.length} />
            <StatCard label="Ya votaron" value={yaVotaron.length} tone="success" sublabel={`${pctAvanceGlobal}% del total`} />
            <StatCard label="Pendientes" value={pendientes.length} tone="warning" sublabel={`${100 - pctAvanceGlobal}% del total`} />
            <StatCard label="Firmes sin votar" value={pendientesFirmes.length} tone="danger" sublabel="Prioridad de movilización" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DonutChartCard
              title="Avance de votación"
              subtitle="Válidos en Valledupar"
              datos={[
                { nombre: 'Ya votó', valor: yaVotaron.length },
                { nombre: 'Pendiente', valor: pendientes.length },
              ]}
            />
            <BarChartCard
              title="Líderes con más simpatizantes por movilizar"
              subtitle="Top 10 — clic para ver el listado"
              datos={topPendientesPorLider}
              horizontal
            />
          </div>
        </div>
      )}

      {tab === 'lideres' && (
        <div>
          <p className="mb-3 text-xs text-gray-400">Ordenado por avance de meta (los más atrasados primero). Haz clic en "Simpatizantes" para ver a quién le falta votar.</p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">#</th>
                    <th className="px-4 py-2.5 font-semibold">Líder</th>
                    <th className="px-4 py-2.5 font-semibold">Territorio</th>
                    <th className="px-4 py-2.5 font-semibold">Meta</th>
                    <th className="px-4 py-2.5 font-semibold">Votos hoy</th>
                    <th className="px-4 py-2.5 font-semibold">Avance de meta</th>
                    <th className="px-4 py-2.5 font-semibold">Por movilizar</th>
                    <th className="px-4 py-2.5 font-semibold">Estado</th>
                    <th className="px-4 py-2.5 font-semibold" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lideresConDatos.map((l, i) => (
                    <tr key={l.lider.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-900">{nombreCompleto(l.lider)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{l.territorio}</td>
                      <td className="px-4 py-2.5 text-gray-600">{l.meta || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{l.votosHoy}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${l.avance >= 100 ? 'bg-emerald-500' : l.avance >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(l.avance, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{l.avance}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{l.porMovilizar}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_LIDER_ESTILOS[l.estado]}`}>{l.estado}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        {l.pendientesIds.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              irADirectorio(
                                l.pendientesIds,
                                `Mostrando ${l.pendientesIds.length} simpatizante(s) válido(s) de ${nombreCompleto(l.lider)} que aún no han votado.`,
                              )
                            }
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            Simpatizantes →
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">Completo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {lideresConDatos.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                        No hay líderes registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'transporte' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Vehículos a disposición" value={totalVehiculos} />
            <StatCard label="Conductores voluntarios" value={ofertantes.length} />
            <StatCard label="Zonas con transporte" value={zonasConTransporte} tone="success" />
            <StatCard label="Capacidad total (pax)" value={capacidadTotal} tone="dark" />
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-gray-800">🚧 Cuellos de botella de movilización</p>
            <p className="mb-3 text-xs text-gray-400">Firmes válidos que aún no votan (demanda) vs. vehículos disponibles por territorio (oferta).</p>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Territorio</th>
                      <th className="px-4 py-2.5 font-semibold">Firmes por movilizar</th>
                      <th className="px-4 py-2.5 font-semibold">Vehículos</th>
                      <th className="px-4 py-2.5 font-semibold">Capacidad (pax)</th>
                      <th className="px-4 py-2.5 font-semibold">Estado</th>
                      <th className="px-4 py-2.5 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cuellosDeBotella.map((z) => (
                      <tr key={z.zona} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-900">{z.zona}</td>
                        <td className="px-4 py-2.5 text-gray-700">{z.firmes.length}</td>
                        <td className="px-4 py-2.5 text-gray-700">{z.vehiculos}</td>
                        <td className="px-4 py-2.5 text-gray-700">{z.capacidad}</td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_TRANSPORTE_ESTILOS[z.estado]}`}>{z.estado}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              irADirectorio(
                                z.firmes.map((p) => p.id),
                                `Mostrando ${z.firmes.length} simpatizante(s) firme(s) sin votar en "${z.zona}".`,
                              )
                            }
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            Ver →
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cuellosDeBotella.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                          Sin firmes pendientes de movilizar 🎉
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-gray-800">🚗 Vehículos por comuna / corregimiento</p>
            <p className="mb-3 text-xs text-gray-400">Haz clic en una fila para ver los propietarios de los vehículos.</p>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Comuna / Corregimiento</th>
                      <th className="px-4 py-2.5 font-semibold">Vehículos</th>
                      <th className="px-4 py-2.5 font-semibold">Capacidad (pax)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vehiculosPorZona.map((z) => (
                      <Fragment key={z.zona}>
                        <tr className="cursor-pointer hover:bg-gray-50" onClick={() => setZonaExpandida(zonaExpandida === z.zona ? null : z.zona)}>
                          <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-900">
                            {zonaExpandida === z.zona ? '▾' : '▸'} {z.zona}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">{z.vehiculos}</td>
                          <td className="px-4 py-2.5 text-gray-700">{z.capacidad}</td>
                        </tr>
                        {zonaExpandida === z.zona && (
                          <tr>
                            <td colSpan={3} className="bg-gray-50 px-4 py-3">
                              <ul className="space-y-1 text-xs text-gray-600">
                                {z.personas.map((p) => (
                                  <li key={p.id}>
                                    <span className="font-medium text-gray-800">{nombreCompleto(p)}</span> ({p.rol}) ·{' '}
                                    {p.vehiculos.map((v) => `${v.tipo}${v.pasajeros ? ` (${v.pasajeros} pax)` : ''}`).join(', ')}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    {vehiculosPorZona.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-400">
                          Nadie ha ofrecido vehículo todavía.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'division' && (
        <div>
          <div className="mb-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">📖 División Político-Electoral — Valledupar · puestos de votación</p>
            <p className="mt-1 text-xs text-gray-400">
              «Votos definidos» = simpatizantes válidos (Valledupar) asignados. Haz clic en un puesto para ver sus mesas; haz clic en una mesa para
              ver sus votantes en el Directorio.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Puesto</th>
                    <th className="px-4 py-2.5 font-semibold">Zona</th>
                    <th className="px-4 py-2.5 font-semibold">Comuna/Correg.</th>
                    <th className="px-4 py-2.5 font-semibold">Mesas</th>
                    <th className="px-4 py-2.5 font-semibold">Votos definidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {puestosConVotos.map((pv) => (
                    <Fragment key={pv.puesto.id}>
                      <tr
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setPuestoExpandido(puestoExpandido === pv.puesto.id ? null : pv.puesto.id)}
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-900">
                          {puestoExpandido === pv.puesto.id ? '▾' : '▸'} {pv.puesto.nombre}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{pv.zona}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{pv.comunas}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{pv.rangoMesas}</td>
                        <td className="px-4 py-2.5 font-semibold text-blue-700">{pv.votos}</td>
                      </tr>
                      {puestoExpandido === pv.puesto.id &&
                        pv.mesas.map((m) => (
                          <tr key={`${pv.puesto.id}-${m.numero}`} className="bg-gray-50/60">
                            <td className="px-4 py-2 pl-10 text-gray-500" colSpan={4}>
                              Mesa {m.numero}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {m.votos > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => irADirectorio(m.ids, `Mostrando ${m.votos} votante(s) de la Mesa ${m.numero} — ${pv.puesto.nombre}.`)}
                                  className="text-xs font-medium text-blue-600 hover:underline"
                                >
                                  {m.votos} votos →
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300">Sin votos</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  ))}
                  {totalPuestos === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                        No hay puestos de votación registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
