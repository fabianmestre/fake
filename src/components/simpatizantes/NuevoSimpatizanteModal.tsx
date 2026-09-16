import { useState } from 'react';
import type { NivelFormacion, Persona, RolDiaE, VehiculoCampania, VehiculoTipo } from '../../types';
import { listaMunicipios, comunasDeMunicipio, barriosDeComuna } from '../../data/geografia';
import { PUESTOS_VOTACION } from '../../data/puestosVotacion';
import { nombreCompleto } from '../../data/generarDatos';
import {
  GRUPOS_SOCIALES,
  GUSTOS_INTERESES,
  NIVELES_FORMACION,
  OCUPACIONES,
  PASAJEROS_FIJOS,
  POSGRADOS,
  PROFESIONES,
  ROLES_DIA_E,
  TIPOS_VEHICULO,
} from '../../data/catalogosCaracterizacion';
import { useSessionStore } from '../../state/sessionStore';
import { useDataStore } from '../../state/dataStore';
import { puedeEditarCampo, puedeMarcarVoto } from '../../lib/permisos';
import { esDiaE, fechaDiaEFormateada } from '../../lib/diaE';
import { personaVacia } from '../../lib/personaVacia';

interface Props {
  onClose: () => void;
  personaExistente?: Persona;
  lideres: Persona[];
  onGuardado?: (persona: Persona) => void;
}

function Campo({ label, children, span, requerido }: { label: string; children: React.ReactNode; span?: boolean; requerido?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-gray-500">
        {label}
        {requerido && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function SeccionTitulo({ numero, titulo }: { numero: number | string; titulo: string }) {
  return <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700">{numero} · {titulo}</p>;
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400';

function ChipToggle({
  opciones,
  seleccion,
  onChange,
  disabled,
}: {
  opciones: string[];
  seleccion: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((op) => {
        const activo = seleccion.includes(op);
        return (
          <button
            key={op}
            type="button"
            disabled={disabled}
            onClick={() => onChange(activo ? seleccion.filter((s) => s !== op) : [...seleccion, op])}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              activo ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {op}
          </button>
        );
      })}
    </div>
  );
}

export function NuevoSimpatizanteModal({ onClose, personaExistente, lideres, onGuardado }: Props) {
  const usuario = useSessionStore((s) => s.usuario);
  const agregarPersona = useDataStore((s) => s.agregarPersona);
  const actualizarPersona = useDataStore((s) => s.actualizarPersona);
  const [form, setForm] = useState<Persona>(personaExistente ?? personaVacia(usuario));
  const editando = Boolean(personaExistente);

  const set = <K extends keyof Persona>(campo: K, valor: Persona[K]) => {
    setForm((f) => {
      const next = { ...f, [campo]: valor };
      if (campo === 'municipio') {
        next.comuna = '';
        next.barrio = '';
      }
      if (campo === 'comuna') {
        next.barrio = '';
      }
      if (campo === 'puestoVotacionId') {
        const puesto = PUESTOS_VOTACION.find((p) => p.id === valor);
        next.puestoVotacion = puesto?.nombre;
        next.dptoVotacion = puesto?.departamento;
        next.municVotacion = puesto?.municipio;
        next.mesaVotacion = '';
        next.validez = puesto?.municipio === 'Valledupar' ? 'Válido' : 'Inválido';
      }
      if (campo === 'liderId') {
        const lider = lideres.find((l) => l.id === valor);
        next.planilla = lider?.planilla;
      }
      if (campo === 'vehiculoDisponible' && !valor) {
        next.vehiculos = [];
      }
      return next;
    });
  };

  const bloqueado = (campo: keyof Persona) => editando && !puedeEditarCampo(usuario, campo);
  const votoBloqueado = !puedeMarcarVoto(usuario) || !esDiaE();

  const vehiculos = form.vehiculos;
  function agregarVehiculo() {
    const nuevo: VehiculoCampania = { id: `veh-${Date.now()}`, tipo: 'Moto', placa: '' };
    set('vehiculos', [...vehiculos, nuevo]);
  }
  function actualizarVehiculo(id: string, cambios: Partial<VehiculoCampania>) {
    set(
      'vehiculos',
      vehiculos.map((v) => {
        if (v.id !== id) return v;
        const actualizado = { ...v, ...cambios };
        if (cambios.tipo) actualizado.pasajeros = PASAJEROS_FIJOS[cambios.tipo];
        return actualizado;
      }),
    );
  }
  function quitarVehiculo(id: string) {
    set(
      'vehiculos',
      vehiculos.filter((v) => v.id !== id),
    );
  }
  function alternarVehiculoDisponible(disponible: boolean) {
    set('vehiculoDisponible', disponible);
    if (disponible && form.vehiculos.length === 0) {
      set('vehiculos', [{ id: `veh-${Date.now()}`, tipo: 'Moto', placa: '' }]);
    }
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombres || !form.apellidos || !form.cedula) return;
    if (editando) {
      actualizarPersona(form.id, form);
      onGuardado?.(form);
    } else {
      const nueva = { ...form, id: `p-new-${Date.now()}` };
      agregarPersona(nueva);
      onGuardado?.(nueva);
    }
    onClose();
  }

  const comunas = form.municipio ? comunasDeMunicipio(form.municipio) : [];
  const barrios = form.municipio && form.comuna ? barriosDeComuna(form.municipio, form.comuna) : [];
  const puesto = PUESTOS_VOTACION.find((p) => p.id === form.puestoVotacionId);
  const vehiculoBloqueado = bloqueado('vehiculoDisponible');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{editando ? 'Editar Simpatizante' : 'Nuevo Simpatizante'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-6 px-6 py-5">
          <section>
            <SeccionTitulo numero={1} titulo="Datos personales" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Campo label="Nombres">
                <input required disabled={bloqueado('nombres')} className={inputCls} value={form.nombres} onChange={(e) => set('nombres', e.target.value)} />
              </Campo>
              <Campo label="Apellidos">
                <input required disabled={bloqueado('apellidos')} className={inputCls} value={form.apellidos} onChange={(e) => set('apellidos', e.target.value)} />
              </Campo>
              <Campo label="Cédula">
                <input required disabled={bloqueado('cedula')} className={inputCls} value={form.cedula} onChange={(e) => set('cedula', e.target.value)} />
              </Campo>
              <Campo label="Teléfono">
                <input disabled={bloqueado('telefono')} className={inputCls} value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
              </Campo>
              <Campo label="Correo" span>
                <input disabled={bloqueado('correo')} className={inputCls} value={form.correo} onChange={(e) => set('correo', e.target.value)} />
              </Campo>
            </div>
          </section>

          <section>
            <SeccionTitulo numero={2} titulo="Ubicación — Residencia" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Campo label="Departamento">
                <input disabled className={inputCls} value={form.departamento} />
              </Campo>
              <Campo label="Municipio">
                <select disabled={bloqueado('municipio')} className={inputCls} value={form.municipio} onChange={(e) => set('municipio', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {listaMunicipios().map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Comuna/Corregimiento">
                <select disabled={bloqueado('comuna')} className={inputCls} value={form.comuna} onChange={(e) => set('comuna', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {comunas.map((c) => (
                    <option key={c.nombre} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Barrio">
                <select disabled={bloqueado('barrio')} className={inputCls} value={form.barrio} onChange={(e) => set('barrio', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {barrios.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
          </section>

          <section>
              <SeccionTitulo numero={3} titulo="Puesto de Votación" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Campo label="Pto-Votación" span>
                  <select
                    disabled={bloqueado('puestoVotacionId')}
                    className={inputCls}
                    value={form.puestoVotacionId ?? ''}
                    onChange={(e) => set('puestoVotacionId', e.target.value)}
                  >
                    <option value="">Sin asignar</option>
                    {PUESTOS_VOTACION.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.municipio})
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Dpto-Votación">
                  <input disabled className={inputCls} value={form.dptoVotacion ?? '—'} />
                </Campo>
                <Campo label="Munic-Votación">
                  <input disabled className={inputCls} value={form.municVotacion ?? '—'} />
                </Campo>
                <Campo label="Mesa-Votación">
                  <select
                    disabled={bloqueado('mesaVotacion') || !puesto}
                    className={inputCls}
                    value={form.mesaVotacion ?? ''}
                    onChange={(e) => set('mesaVotacion', e.target.value)}
                  >
                    <option value="">Sin asignar</option>
                    {puesto?.mesas.map((m) => (
                      <option key={m.numero} value={m.numero}>
                        Mesa {m.numero}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>
            </section>

          <section>
              <SeccionTitulo numero={4} titulo="Caracterización Social" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Campo label="Ocupación (actual)">
                  <select disabled={bloqueado('ocupacion')} className={inputCls} value={form.ocupacion ?? ''} onChange={(e) => set('ocupacion', e.target.value)}>
                    <option value="">Sin dato</option>
                    {OCUPACIONES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Profesión">
                  <select disabled={bloqueado('profesion')} className={inputCls} value={form.profesion ?? ''} onChange={(e) => set('profesion', e.target.value)}>
                    <option value="">Sin dato</option>
                    {PROFESIONES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Nivel académico">
                  <select
                    disabled={bloqueado('nivelFormacion')}
                    className={inputCls}
                    value={form.nivelFormacion}
                    onChange={(e) => set('nivelFormacion', e.target.value as NivelFormacion)}
                  >
                    {NIVELES_FORMACION.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Posgrado">
                  <select disabled={bloqueado('posgrado')} className={inputCls} value={form.posgrado ?? 'Ninguno'} onChange={(e) => set('posgrado', e.target.value)}>
                    {POSGRADOS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Gustos e Intereses</p>
                <ChipToggle
                  opciones={GUSTOS_INTERESES}
                  seleccion={form.gustosIntereses ?? []}
                  onChange={(v) => set('gustosIntereses', v)}
                  disabled={bloqueado('gustosIntereses')}
                />
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Grupos sociales</p>
                <ChipToggle
                  opciones={GRUPOS_SOCIALES}
                  seleccion={form.gruposSociales ?? []}
                  onChange={(v) => set('gruposSociales', v)}
                  disabled={bloqueado('gruposSociales')}
                />
              </div>

              <div className="mt-4">
                <Campo label="Observación (datos adicionales)">
                  <textarea
                    disabled={bloqueado('observaciones')}
                    className={`${inputCls} min-h-[70px] resize-y`}
                    placeholder="Cualquier dato adicional del simpatizante…"
                    value={form.observaciones ?? ''}
                    onChange={(e) => set('observaciones', e.target.value)}
                  />
                </Campo>
              </div>
            </section>

          <section>
              <SeccionTitulo numero={5} titulo='Logística Día "E" (Vehículos)' />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  disabled={vehiculoBloqueado}
                  checked={form.vehiculoDisponible}
                  onChange={(e) => alternarVehiculoDisponible(e.target.checked)}
                  className="rounded"
                />
                ¿Tiene vehículo(s) disponible(s) para la campaña?
              </label>
              <p className="mt-1 text-xs text-gray-400">Una persona puede ofrecer más de uno (ej. moto y carro a la vez).</p>

              {form.vehiculoDisponible && (
                <div className="mt-3 space-y-2">
                  {vehiculos.map((v) => (
                    <div key={v.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 rounded-lg border border-gray-200 p-2">
                      <Campo label="Tipo">
                        <select
                          required
                          disabled={vehiculoBloqueado}
                          className={inputCls}
                          value={v.tipo}
                          onChange={(e) => actualizarVehiculo(v.id, { tipo: e.target.value as VehiculoTipo })}
                        >
                          {TIPOS_VEHICULO.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </Campo>
                      {v.tipo !== 'Moto' ? (
                        <Campo label="Número de pasajeros">
                          <input
                            required
                            type="number"
                            min={1}
                            disabled={vehiculoBloqueado || v.tipo === 'Carro'}
                            className={inputCls}
                            value={v.pasajeros ?? ''}
                            onChange={(e) => actualizarVehiculo(v.id, { pasajeros: Number(e.target.value) })}
                          />
                        </Campo>
                      ) : (
                        <div />
                      )}
                      <Campo label="Placa (opcional)">
                        <input
                          disabled={vehiculoBloqueado}
                          className={inputCls}
                          value={v.placa ?? ''}
                          onChange={(e) => actualizarVehiculo(v.id, { placa: e.target.value.toUpperCase() })}
                        />
                      </Campo>
                      <button
                        type="button"
                        disabled={vehiculoBloqueado}
                        onClick={() => quitarVehiculo(v.id)}
                        className="mb-1.5 h-fit rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={vehiculoBloqueado}
                    onClick={agregarVehiculo}
                    className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-40"
                  >
                    + Agregar otro vehículo
                  </button>
                </div>
              )}
            </section>

          <section>
              <SeccionTitulo numero={6} titulo="Vinculación y Compromiso" />
              <div className="grid grid-cols-3 gap-3">
                <Campo label="Líder asignado" requerido={form.rol !== 'Líder' && form.rol !== 'Padrino' && form.rol !== 'Candidato'}>
                  <select
                    required={form.rol !== 'Líder' && form.rol !== 'Padrino' && form.rol !== 'Candidato'}
                    disabled={bloqueado('liderId')}
                    className={inputCls}
                    value={form.liderId ?? ''}
                    onChange={(e) => set('liderId', e.target.value)}
                  >
                    <option value="">{form.rol === 'Líder' || form.rol === 'Padrino' || form.rol === 'Candidato' ? 'No aplica' : 'Seleccionar'}</option>
                    {lideres.map((l) => (
                      <option key={l.id} value={l.id}>
                        {nombreCompleto(l)}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Nivel de voto" requerido>
                  <select
                    required
                    disabled={bloqueado('nivel')}
                    className={inputCls}
                    value={form.nivel}
                    onChange={(e) => set('nivel', e.target.value as Persona['nivel'])}
                  >
                    <option value="Firme">Firme</option>
                    <option value="Indeciso">Indeciso</option>
                  </select>
                </Campo>
                <Campo label="Rol asignado Día E" requerido>
                  <select
                    required
                    disabled={bloqueado('rolDiaE')}
                    className={inputCls}
                    value={form.rolDiaE ?? 'Votante'}
                    onChange={(e) => set('rolDiaE', e.target.value as RolDiaE)}
                  >
                    {ROLES_DIA_E.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="¿Ya votó? (Día E)">
                  <label
                    className={`flex h-[34px] items-center gap-2 rounded-lg border border-gray-300 px-2.5 text-sm ${
                      votoBloqueado ? 'text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.voto}
                      disabled={votoBloqueado}
                      onChange={(e) => set('voto', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 disabled:cursor-not-allowed"
                    />
                    {form.voto ? 'Sí, ya votó' : 'Aún no'}
                  </label>
                  {votoBloqueado && (
                    <p className="mt-1 text-[11px] text-gray-400">
                      {!puedeMarcarVoto(usuario) ? 'Solo admin/gestor puede marcarlo.' : `Se habilita el ${fechaDiaEFormateada()}.`}
                    </p>
                  )}
                </Campo>
                {form.rol === 'Líder' && (
                  <Campo label="Meta de simpatizantes válidos" requerido>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      required
                      disabled={bloqueado('metaSimpatizantes')}
                      className={inputCls}
                      value={form.metaSimpatizantes ?? ''}
                      onChange={(e) => set('metaSimpatizantes', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </Campo>
                )}
              </div>
            </section>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              {editando ? 'Guardar cambios' : 'Crear Simpatizante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
