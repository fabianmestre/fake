interface PaginationProps {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  tamanoPagina: number;
  onCambiarPagina: (pagina: number) => void;
}

export function Pagination({ paginaActual, totalPaginas, totalRegistros, tamanoPagina, onCambiarPagina }: PaginationProps) {
  if (totalRegistros === 0) return null;

  const desde = (paginaActual - 1) * tamanoPagina + 1;
  const hasta = Math.min(paginaActual * tamanoPagina, totalRegistros);

  const paginas: number[] = [];
  const inicio = Math.max(1, paginaActual - 2);
  const fin = Math.min(totalPaginas, inicio + 4);
  for (let i = inicio; i <= fin; i++) paginas.push(i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm">
      <p className="text-gray-500">
        Mostrando <span className="font-medium text-gray-900">{desde}-{hasta}</span> de{' '}
        <span className="font-medium text-gray-900">{totalRegistros}</span> registros
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={paginaActual === 1}
          onClick={() => onCambiarPagina(paginaActual - 1)}
          className="rounded-md border border-gray-300 px-2.5 py-1.5 text-gray-600 disabled:opacity-40 enabled:hover:bg-gray-50"
        >
          Anterior
        </button>
        {inicio > 1 && <span className="px-1 text-gray-400">…</span>}
        {paginas.map((p) => (
          <button
            type="button"
            key={p}
            onClick={() => onCambiarPagina(p)}
            className={`min-w-[2rem] rounded-md px-2.5 py-1.5 ${
              p === paginaActual ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
        {fin < totalPaginas && <span className="px-1 text-gray-400">…</span>}
        <button
          type="button"
          disabled={paginaActual === totalPaginas}
          onClick={() => onCambiarPagina(paginaActual + 1)}
          className="rounded-md border border-gray-300 px-2.5 py-1.5 text-gray-600 disabled:opacity-40 enabled:hover:bg-gray-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
