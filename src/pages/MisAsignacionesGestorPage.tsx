import { useMemo } from 'react';
import { useSessionStore } from '../state/sessionStore';
import { useDataStore } from '../state/dataStore';
import { alcanceDeDatos } from '../lib/permisos';
import { esDiaE, fechaDiaEFormateada } from '../lib/diaE';
import { DirectorioSimpatizantes } from '../components/simpatizantes/DirectorioSimpatizantes';

export function MisAsignacionesGestorPage() {
  const usuario = useSessionStore((s) => s.usuario);
  const personas = useDataStore((s) => s.personas);

  const conteoVotos = useMemo(() => {
    const asignados = alcanceDeDatos(usuario, personas).filter((p) => p.rol === 'Simpatizante' && p.validez === 'Válido');
    const yaVotaron = asignados.filter((p) => p.voto).length;
    return { total: asignados.length, yaVotaron };
  }, [usuario, personas]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Mis Asignaciones</h1>
      <p className="mb-1 text-sm text-gray-500">
        Simpatizantes de los líderes que tienes asignados. Puedes mejorar su caracterización (perfil, ocupación, intereses,
        grupos sociales, puesto/mesa de votación) para apoyar la toma de decisiones de la campaña — no puedes editar datos
        básicos de identidad ni eliminar registros.
      </p>
      <p className="mb-4 text-sm text-gray-500">
        Día E: activa la columna <span className="font-medium text-gray-700">"¿Ya votó?"</span> (grupo Día E) desde
        "Columnas" para ir marcando quién ya votó
        {esDiaE() ? (
          <> — <span className="font-semibold text-blue-700">hoy es el Día E</span>, el check ya está habilitado.</>
        ) : (
          <> (solo se habilita el {fechaDiaEFormateada()}).</>
        )}{' '}
        Llevas <span className="font-semibold text-gray-900">{conteoVotos.yaVotaron}</span> de{' '}
        <span className="font-semibold text-gray-900">{conteoVotos.total}</span> simpatizantes válidos con voto confirmado.
      </p>
      <DirectorioSimpatizantes />
    </div>
  );
}
