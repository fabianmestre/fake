interface Props {
  titulo: string;
  descripcion?: string;
}

export function PaginaProximamente({ titulo, descripcion }: Props) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-blue-500">
          <path d="M12 8v5l3 3M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-800">{titulo}</h2>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {descripcion ?? 'Esta sección se detallará y construirá en una próxima iteración de la simulación.'}
      </p>
    </div>
  );
}
