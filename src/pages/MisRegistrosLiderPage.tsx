import { DirectorioSimpatizantes } from '../components/simpatizantes/DirectorioSimpatizantes';

export function MisRegistrosLiderPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Mis Registros</h1>
      <p className="mb-6 text-sm text-gray-500">Simpatizantes que tú mismo has registrado. Vista de solo lectura — no puedes editarlos ni eliminarlos.</p>
      <DirectorioSimpatizantes />
    </div>
  );
}
