import type { Gestion, Persona } from '../types';
import { CATEGORIAS_GESTION, DESCRIPCIONES_POR_CATEGORIA, ESTADOS_GESTION, RESPONSABLES_GESTION } from './catalogosGestiones';

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function fechaAleatoria(): string {
  const inicio = new Date('2026-01-15').getTime();
  const fin = new Date('2026-09-14').getTime();
  return new Date(inicio + Math.random() * (fin - inicio)).toISOString().slice(0, 10);
}

function estadoAleatorio() {
  const r = Math.random();
  if (r < 0.25) return ESTADOS_GESTION[0]; // Pendiente
  if (r < 0.5) return ESTADOS_GESTION[1]; // En Proceso
  return ESTADOS_GESTION[2]; // Resuelto
}

function montoAleatorio(): number {
  return Math.round((40_000 + Math.random() * 460_000) / 10_000) * 10_000;
}

function generarGestion(id: string, personaId?: string): Gestion {
  const categoria = pick(CATEGORIAS_GESTION);
  const { texto, conMonto } = pick(DESCRIPCIONES_POR_CATEGORIA[categoria]);
  return {
    id,
    personaId,
    fecha: fechaAleatoria(),
    categoria,
    descripcion: texto,
    monto: conMonto ? montoAleatorio() : undefined,
    estado: estadoAleatorio(),
    responsable: pick(RESPONSABLES_GESTION),
  };
}

/** ~120 gestiones: la mayoría ligadas a simpatizantes/líderes marcados con tieneGestiones, el resto
 * gestiones generales de campaña (sin persona asociada). */
export function construirGestiones(personas: Persona[]): Gestion[] {
  const conBandera = personas.filter((p) => (p.rol === 'Simpatizante' || p.rol === 'Líder') && p.tieneGestiones);
  const beneficiarios = shuffle(conBandera).slice(0, 85);

  let idx = 0;
  const nextId = () => `gestion-${String(++idx).padStart(4, '0')}`;

  const ligadas = beneficiarios.map((p) => generarGestion(nextId(), p.id));
  const generales = Array.from({ length: 35 }, () => generarGestion(nextId()));

  return [...ligadas, ...generales].sort((a, b) => b.fecha.localeCompare(a.fecha));
}
