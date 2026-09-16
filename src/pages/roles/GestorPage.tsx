import { useMemo, useState } from 'react';
import type { Persona } from '../../types';
import { useSessionStore } from '../../state/sessionStore';
import { useDataStore } from '../../state/dataStore';
import { nombreCompleto } from '../../data/generarDatos';
import { DirectorioSimpatizantes } from '../../components/simpatizantes/DirectorioSimpatizantes';

function AsignarLideresModal({
  persona,
  lideresActuales,
  onClose,
  onConfirmar,
}: {
  persona: Persona;
  lideresActuales: string[];
  onClose: () => void;
  onConfirmar: (liderIds: string[]) => void;
}) {
  const personas = useDataStore((s) => s.personas);
  const [seleccionados, setSeleccionados] = useState<string[]>(lideresActuales);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);

  const lideres = useMemo(() => personas.filter((p) => p.rol === 'Líder'), [personas]);
  const filtrados = useMemo(
    () => lideres.filter((l) => nombreCompleto(l).toLowerCase().includes(busqueda.trim().toLowerCase())),
    [lideres, busqueda],
  );

  function toggle(id: string) {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function confirmar() {
    if (seleccionados.length === 0) {
      setError('Selecciona al menos un líder a cargo.');
      return;
    }
    onConfirmar(seleccionados);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Líderes a cargo de {nombreCompleto(persona)}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <div className="space-y-3 px-6 py-5">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar líder…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            autoFocus
          />
          <div className="max-h-64 space-y-0.5 overflow-y-auto rounded-lg border border-gray-200 p-2">
            {filtrados.map((l) => (
              <label key={l.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                <input type="checkbox" checked={seleccionados.includes(l.id)} onChange={() => toggle(l.id)} className="rounded" />
                {nombreCompleto(l)}
              </label>
            ))}
            {filtrados.length === 0 && <p className="px-2 py-4 text-center text-xs text-gray-400">Sin resultados.</p>}
          </div>
          <p className="text-xs text-gray-400">{seleccionados.length} líder(es) seleccionado(s)</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="button" onClick={confirmar} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GestorPage() {
  const usuario = useSessionStore((s) => s.usuario);
  const actualizarPersona = useDataStore((s) => s.actualizarPersona);
  const [promoviendo, setPromoviendo] = useState<Persona | null>(null);
  const [editandoLideres, setEditandoLideres] = useState<Persona | null>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  const esAdmin = usuario?.rolUsuario === 'admin';

  function mostrarMensaje(texto: string, tipo: 'exito' | 'error' = 'exito') {
    setMensaje({ texto, tipo });
    window.setTimeout(() => setMensaje(null), 5000);
  }

  function confirmarPromocion(liderIds: string[]) {
    if (!promoviendo) return;
    actualizarPersona(promoviendo.id, { rol: 'Gestor', liderIds });
    mostrarMensaje(`${nombreCompleto(promoviendo)} fue promovido a Gestor, a cargo de ${liderIds.length} líder(es).`);
    setPromoviendo(null);
  }

  function guardarLideres(liderIds: string[]) {
    if (!editandoLideres) return;
    actualizarPersona(editandoLideres.id, { liderIds });
    mostrarMensaje(`Se actualizaron los líderes a cargo de ${nombreCompleto(editandoLideres)}.`);
    setEditandoLideres(null);
  }

  function quitarRol(gestor: Persona) {
    if (!confirm(`¿Quitarle el rol de Gestor a ${nombreCompleto(gestor)}? Volverá a ser Simpatizante.`)) return;
    actualizarPersona(gestor.id, { rol: 'Simpatizante', liderIds: undefined, liderId: undefined });
    mostrarMensaje(`${nombreCompleto(gestor)} volvió a ser Simpatizante.`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Gestor</h1>
      <p className="mb-1 text-sm text-gray-500">
        Gestiona quién tiene el rol de Gestor. Un gestor no digita fichas nuevas: mejora la caracterización de los
        simpatizantes de los líderes que tiene a cargo (perfil, ocupación, intereses, puesto/mesa de votación) para apoyar la
        toma de decisiones de la campaña. No puede eliminar registros ni editar datos básicos de identidad.
      </p>

      {!esAdmin && (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
          Solo el administrador puede gestionar el rol de Gestor.
        </div>
      )}

      {esAdmin && (
        <>
          <p className="mb-3 text-xs text-gray-400">
            Por defecto ves a los gestores. Busca por nombre o cédula para encontrar cualquier simpatizante y promoverlo.
          </p>

          {mensaje && (
            <div
              className={`mb-4 rounded-xl border p-3 text-sm font-medium ${
                mensaje.tipo === 'exito' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {mensaje.tipo === 'exito' ? '✓' : '⚠'} {mensaje.texto}
            </div>
          )}

          <DirectorioSimpatizantes
            rolFijo="Gestor"
            rolesBuscables={['Simpatizante']}
            accionExtra={(p) => {
              if (p.rol === 'Simpatizante') {
                return (
                  <button type="button" onClick={() => setPromoviendo(p)} className="whitespace-nowrap text-xs font-medium text-blue-600 hover:underline">
                    Promover a Gestor
                  </button>
                );
              }
              const cantidad = p.liderIds?.length ?? 0;
              return (
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditandoLideres(p)}
                    className="whitespace-nowrap text-xs font-medium text-blue-600 hover:underline"
                  >
                    Editar líderes ({cantidad})
                  </button>
                  <button type="button" onClick={() => quitarRol(p)} className="whitespace-nowrap text-xs font-medium text-red-600 hover:underline">
                    Quitar rol
                  </button>
                </div>
              );
            }}
          />
        </>
      )}

      {promoviendo && (
        <AsignarLideresModal persona={promoviendo} lideresActuales={[]} onClose={() => setPromoviendo(null)} onConfirmar={confirmarPromocion} />
      )}
      {editandoLideres && (
        <AsignarLideresModal
          persona={editandoLideres}
          lideresActuales={editandoLideres.liderIds ?? []}
          onClose={() => setEditandoLideres(null)}
          onConfirmar={guardarLideres}
        />
      )}
    </div>
  );
}
