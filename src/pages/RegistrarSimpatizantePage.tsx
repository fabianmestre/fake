import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Persona } from '../types';
import { nombreCompleto } from '../data/generarDatos';
import { useDataStore } from '../state/dataStore';
import { NuevoSimpatizanteModal } from '../components/simpatizantes/NuevoSimpatizanteModal';

interface Props {
  variante: 'digitador' | 'lider';
}

export function RegistrarSimpatizantePage({ variante }: Props) {
  const personas = useDataStore((s) => s.personas);
  const [modalAbierto, setModalAbierto] = useState(true);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);

  const lideres = personas.filter((p) => p.rol === 'Líder');

  function alGuardar(persona: Persona) {
    setConfirmacion(`Ficha de ${nombreCompleto(persona)} registrada correctamente.`);
    window.setTimeout(() => setConfirmacion(null), 6000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">Registrar Simpatizante</h1>
      <p className="text-sm text-gray-500">Formulario completo — puedes diligenciar todo lo que el simpatizante te comparta.</p>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {variante === 'digitador' ? (
          <>
            <p className="font-semibold">Como digitador, tu único rol en la plataforma es registrar simpatizantes nuevos.</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
              <li>No puedes ver los simpatizantes ya cargados en la plataforma, ni los que tú mismo registraste.</li>
              <li>Una vez guardas una ficha, no podrás editarla ni eliminarla — revisa bien los datos antes de guardar.</li>
            </ul>
          </>
        ) : (
          <>
            <p className="font-semibold">Como líder, puedes registrar simpatizantes nuevos igual que un digitador.</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
              <li>
                Puedes ver, en modo lectura, lo que tú mismo has registrado en{' '}
                <Link to="/lider/mis-registros" className="font-medium underline">
                  Mis Registros
                </Link>{' '}
                — no puedes editarlo ni eliminarlo.
              </li>
              <li>Esta capacidad es temporal: la campaña puede cerrártela más adelante.</li>
            </ul>
          </>
        )}
      </div>

      {confirmacion && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">✓ {confirmacion}</div>
      )}

      {!modalAbierto && (
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Registrar otra ficha
        </button>
      )}

      {modalAbierto && (
        <NuevoSimpatizanteModal onClose={() => setModalAbierto(false)} onGuardado={alGuardar} lideres={lideres} />
      )}
    </div>
  );
}
