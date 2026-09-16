import { useMemo } from 'react';
import { useSessionStore } from '../../state/sessionStore';
import { useDataStore } from '../../state/dataStore';
import { alcanceDeDatos } from '../../lib/permisos';
import { PUESTOS_VOTACION } from '../../data/puestosVotacion';
import type { Persona } from '../../types';
import { StatCard } from '../common/StatCard';
import { DonutChartCard, BarChartCard, RankingCard } from '../common/ChartCard';

function contarPor<T extends Persona, K extends keyof T>(datos: T[], campo: K) {
  const mapa = new Map<string, number>();
  for (const d of datos) {
    const valor = (d[campo] as unknown as string) || 'Sin dato';
    mapa.set(valor, (mapa.get(valor) ?? 0) + 1);
  }
  return Array.from(mapa.entries())
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor);
}

export function DashboardSimpatizante() {
  const usuario = useSessionStore((s) => s.usuario);
  const personas = useDataStore((s) => s.personas);

  const datos = useMemo(
    () => alcanceDeDatos(usuario, personas).filter((p) => p.rol === 'Simpatizante'),
    [usuario, personas],
  );

  const stats = useMemo(() => {
    const total = datos.length;
    const validos = datos.filter((p) => p.validez === 'Válido').length;
    const invalidos = total - validos;
    const firmes = datos.filter((p) => p.nivel === 'Firme').length;
    const indecisos = total - firmes;
    const sinPuestoOMesa = datos.filter((p) => !p.puestoVotacionId || !p.mesaVotacion).length;
    const sinGrupoSocial = datos.filter((p) => !p.gruposSociales?.length).length;
    const sinOcupacion = datos.filter((p) => !p.ocupacion).length;
    const sinProfesion = datos.filter((p) => !p.profesion || p.profesion === 'Sin profesión').length;
    const sinVehiculo = datos.filter((p) => !p.vehiculoDisponible).length;
    // Líder, Padrino y Candidato no tienen "líder asignado" por diseño de la estructura (no es un vacío de dato)
    const sujetosAEstructura = datos.filter((p) => p.rol !== 'Líder' && p.rol !== 'Padrino' && p.rol !== 'Candidato');
    const sinLider = sujetosAEstructura.filter((p) => !p.liderId).length;
    // Padrino y Candidato no se vinculan a una única planilla (agrupan varias), se excluyen del indicador
    const sujetosAPlanilla = datos.filter((p) => p.rol !== 'Padrino' && p.rol !== 'Candidato');
    const sinPlanilla = sujetosAPlanilla.filter((p) => !p.planilla).length;

    const mesasCubiertas = new Set(datos.filter((p) => p.puestoVotacionId && p.mesaVotacion).map((p) => `${p.puestoVotacionId}-${p.mesaVotacion}`));
    const puestosConPresencia = new Set(datos.filter((p) => p.puestoVotacionId).map((p) => p.puestoVotacionId));
    const totalMesasUniverso = PUESTOS_VOTACION.filter((pv) => puestosConPresencia.has(pv.id)).reduce((s, pv) => s + pv.mesas.length, 0);

    return {
      total,
      validos,
      invalidos,
      firmes,
      indecisos,
      sinPuestoOMesa,
      sinGrupoSocial,
      sinOcupacion,
      sinProfesion,
      sinVehiculo,
      sinLider,
      sinPlanilla,
      coberturaMesas: totalMesasUniverso ? Math.round((mesasCubiertas.size / totalMesasUniverso) * 100) : 0,
      mesasCubiertas: mesasCubiertas.size,
      totalMesasUniverso,
    };
  }, [datos]);

  const porPerfil = useMemo(() => contarPor(datos, 'profesion'), [datos]);
  const porMunicipio = useMemo(() => contarPor(datos, 'municipio'), [datos]);
  const porComuna = useMemo(() => contarPor(datos, 'comuna'), [datos]);
  const topBarrios = useMemo(() => contarPor(datos, 'barrio').slice(0, 10), [datos]);
  const porMunicVotacion = useMemo(() => contarPor(datos, 'municVotacion'), [datos]);
  const porPuestoVotacion = useMemo(
    () => contarPor(datos.filter((p) => p.puestoVotacion), 'puestoVotacion').slice(0, 10),
    [datos],
  );

  if (stats.total === 0) {
    return <p className="text-sm text-gray-500">No hay datos disponibles para tu alcance de usuario.</p>;
  }

  return (
    <div className="space-y-8">
      <section>
        <StatCard label="Total de simpatizantes registrados" value={stats.total} />
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700">Calidad y validez de la data</p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DonutChartCard
            title="Distribución por Validez"
            subtitle="Habilitados vs. fuera de la circunscripción"
            datos={[
              { nombre: 'Válido', valor: stats.validos },
              { nombre: 'Inválido', valor: stats.invalidos },
            ]}
          />
          <DonutChartCard
            title="Distribución por Nivel"
            subtitle="Compromiso declarado"
            datos={[
              { nombre: 'Firme', valor: stats.firmes },
              { nombre: 'Indeciso', valor: stats.indecisos },
            ]}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard
            label="Sin puesto o mesa de votación"
            value={`${stats.sinPuestoOMesa}`}
            sublabel={`${Math.round((stats.sinPuestoOMesa / stats.total) * 100)}% del total`}
            tone="warning"
          />
          <StatCard label="Sin grupo social" value={stats.sinGrupoSocial} sublabel={`${Math.round((stats.sinGrupoSocial / stats.total) * 100)}%`} />
          <StatCard label="Sin ocupación" value={stats.sinOcupacion} sublabel={`${Math.round((stats.sinOcupacion / stats.total) * 100)}%`} />
          <StatCard label="Sin profesión" value={stats.sinProfesion} sublabel={`${Math.round((stats.sinProfesion / stats.total) * 100)}%`} />
          <StatCard
            label="Sin vehículo disponible para campaña"
            value={stats.sinVehiculo}
            sublabel={`${Math.round((stats.sinVehiculo / stats.total) * 100)}%`}
          />
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700">Distribución por Perfil</p>
        <BarChartCard title="Cantidad por Perfil/Profesión" datos={porPerfil} horizontal />
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700">Ubicación — Residencia</p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BarChartCard title="Distribución por Municipio" subtitle="Departamento: Cesar" datos={porMunicipio} />
          <BarChartCard title="Distribución por Comuna/Corregimiento" datos={porComuna} horizontal />
        </div>
        <div className="mt-4">
          <RankingCard title="Top barrios con mayor concentración" datos={topBarrios} />
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700">Ubicación — Puesto de votación</p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BarChartCard title="Distribución por Munic-Votación" datos={porMunicVotacion} />
          <BarChartCard title="Distribución por Puesto de Votación" subtitle="Top 10" datos={porPuestoVotacion} horizontal />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Cobertura por Mesa de Votación"
            value={`${stats.coberturaMesas}%`}
            sublabel={`${stats.mesasCubiertas} de ${stats.totalMesasUniverso} mesas con presencia identificada`}
            tone="success"
          />
          <StatCard label="Sin ningún dato de puesto de votación" value={stats.sinPuestoOMesa} tone="danger" sublabel="Riesgo operativo día E" />
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700">Relación con estructura</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard label="Sin líder asignado" value={stats.sinLider} sublabel="Referencia de estructura" />
          <StatCard label="Sin planilla asociada" value={stats.sinPlanilla} sublabel="Referencia de estructura" />
        </div>
      </section>
    </div>
  );
}
