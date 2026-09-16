import type { PuestoVotacion } from '../types';

function mesas(n: number) {
  return Array.from({ length: n }, (_, i) => ({ numero: String(i + 1).padStart(2, '0') }));
}

// Catálogo de puestos de votación basado en instituciones y escenarios reales de Valledupar
// (Colegio Nacional Loperena, CASD Simón Bolívar, Coliseo Cubierto Julio Monsalvo, Coliseo de
// Ferias, Universidad Popular del Cesar, SENA, Uparsistem, Fundación Universitaria del Área
// Andina, I.E. César Pompeyo Mendoza, Instituto La Salle, entre otros); las escuelas rurales se
// nombran según corregimientos reales del municipio.
//
// Cada puesto de Valledupar declara en `comunas` qué comunas/corregimientos le corresponden
// (aproximación razonable por zona geográfica, no un mapa oficial de la Registraduría), para que
// a cada persona se le asigne un puesto acorde a dónde vive — las 6 comunas y los 25
// corregimientos quedan cubiertos por al menos un puesto.
//
// Además del catálogo de Valledupar (circunscripción del Concejo), se incluyen dos grupos para
// simular simpatizantes "Inválidos" (puesto de votación fuera de la circunscripción):
//  - Municipios cercanos del Cesar (área metropolitana de Valledupar: La Paz, San Diego,
//    Agustín Codazzi, Manaure Balcón del Cesar).
//  - Otros departamentos de Colombia (personas que residen en/cerca de Valledupar pero nunca
//    cambiaron su lugar de votación): Atlántico, Bogotá D.C., La Guajira, Magdalena y Norte de
//    Santander.
export const PUESTOS_VOTACION: PuestoVotacion[] = [
  // --- Urbanos (6 comunas) --------------------------------------------------------------------
  { id: 'pv-01', nombre: 'Colegio Nacional Loperena', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(18), comunas: ['Comuna 1'] },
  { id: 'pv-02', nombre: 'CASD Simón Bolívar', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(20), comunas: ['Comuna 2'] },
  {
    id: 'pv-03',
    nombre: 'Coliseo de Ferias (Pedro Castro Monsalvo)',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(15),
    comunas: ['Comuna 1', 'Comuna 2', 'Comuna 3'],
  },
  {
    id: 'pv-04',
    nombre: 'Coliseo Cubierto Julio Monsalvo',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(16),
    comunas: ['Comuna 6'],
  },
  {
    id: 'pv-05',
    nombre: 'Universidad Popular del Cesar',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(22),
    comunas: ['Comuna 5'],
  },
  {
    id: 'pv-06',
    nombre: 'Fundación Universitaria del Área Andina',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(12),
    comunas: ['Comuna 6'],
  },
  {
    id: 'pv-07',
    nombre: 'SENA (Terminal de Transportes)',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(10),
    comunas: ['Comuna 4'],
  },
  { id: 'pv-08', nombre: 'Uparsistem', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(9), comunas: ['Comuna 4'] },
  {
    id: 'pv-09',
    nombre: 'I.E. César Pompeyo Mendoza',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(11),
    comunas: ['Comuna 3'],
  },
  { id: 'pv-10', nombre: 'Instituto La Salle', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(14), comunas: ['Comuna 3'] },
  { id: 'pv-11', nombre: 'I.E. Divina Pastora', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(9), comunas: ['Comuna 1'] },
  {
    id: 'pv-12',
    nombre: 'I.E. Nuestra Señora del Rosario',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(10),
    comunas: ['Comuna 2', 'Comuna 5'],
  },

  // --- Rurales (25 corregimientos) -------------------------------------------------------------
  {
    id: 'pv-13',
    nombre: 'Casa de la Cultura La Mina',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(6),
    comunas: ['La Mina'],
  },
  {
    id: 'pv-14',
    nombre: 'I.E. Los Corazones',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(7),
    comunas: ['Los Corazones', 'Las Raíces'],
  },
  {
    id: 'pv-15',
    nombre: 'Escuela Rural Guacoche',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(5),
    comunas: ['Guacoche', 'Guacochito', 'El Jabo', 'Badillo'],
  },
  {
    id: 'pv-16',
    nombre: 'Escuela Rural Aguas Blancas',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(5),
    comunas: ['Aguas Blancas'],
  },
  {
    id: 'pv-17',
    nombre: 'Escuela Rural Río Seco',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(4),
    comunas: ['Río Seco', 'Patillal', 'La Vega Arriba', 'El Alto de La Vuelta'],
  },
  {
    id: 'pv-18',
    nombre: 'Escuela Rural Atánquez',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(4),
    comunas: ['Atánquez', 'Chemesquemena'],
  },
  {
    id: 'pv-19',
    nombre: 'Escuela Tezhumke (Atánquez)',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(3),
    comunas: ['Guatapurí', 'Los Haticos'],
  },
  {
    id: 'pv-20',
    nombre: 'Escuela Rural Valencia de Jesús',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(5),
    comunas: ['Valencia de Jesús'],
  },
  {
    id: 'pv-21',
    nombre: 'Escuela Rural Guaymaral',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(4),
    comunas: ['Guaymaral', 'Caracolí', 'Los Venados', 'El Perro'],
  },
  {
    id: 'pv-22',
    nombre: 'Escuela Rural Mariangola',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(4),
    comunas: ['Mariangola', 'Villa Germania'],
  },
  {
    id: 'pv-23',
    nombre: 'Escuela Rural Sabana Crespo',
    departamento: 'Cesar',
    municipio: 'Valledupar',
    mesas: mesas(4),
    comunas: ['Sabana Crespo', 'Azúcar Buena'],
  },

  // --- Municipios cercanos (área metropolitana de Valledupar) — mismo departamento, fuera de la circunscripción.
  { id: 'pv-24', nombre: 'I.E. Robles', departamento: 'Cesar', municipio: 'La Paz', mesas: mesas(10) },
  { id: 'pv-25', nombre: 'I.E. San Diego Centro', departamento: 'Cesar', municipio: 'San Diego', mesas: mesas(8) },
  { id: 'pv-26', nombre: 'I.E. Agustín Codazzi Centro', departamento: 'Cesar', municipio: 'Agustín Codazzi', mesas: mesas(9) },
  { id: 'pv-27', nombre: 'I.E. Manaure Centro', departamento: 'Cesar', municipio: 'Manaure Balcón del Cesar', mesas: mesas(6) },

  // --- Otros departamentos — personas registradas para votar lejos de la circunscripción.
  { id: 'pv-28', nombre: 'Universidad del Atlántico', departamento: 'Atlántico', municipio: 'Barranquilla', mesas: mesas(25) },
  { id: 'pv-29', nombre: 'Universidad Nacional de Colombia', departamento: 'Bogotá D.C.', municipio: 'Bogotá', mesas: mesas(30) },
  { id: 'pv-30', nombre: 'I.E. Riohacha Centro', departamento: 'La Guajira', municipio: 'Riohacha', mesas: mesas(12) },
  { id: 'pv-31', nombre: 'I.E. Santa Marta Centro', departamento: 'Magdalena', municipio: 'Santa Marta', mesas: mesas(14) },
  { id: 'pv-32', nombre: 'I.E. Cúcuta Centro', departamento: 'Norte de Santander', municipio: 'Cúcuta', mesas: mesas(12) },
];

/** Puestos de Valledupar (dentro de la circunscripción). */
export const PUESTOS_VALLEDUPAR = PUESTOS_VOTACION.filter((p) => p.municipio === 'Valledupar');

/** Puestos en otros municipios del Cesar (fuera de la circunscripción, mismo departamento). */
export const PUESTOS_MUNICIPIO_CERCANO = PUESTOS_VOTACION.filter((p) => p.departamento === 'Cesar' && p.municipio !== 'Valledupar');

/** Puestos fuera del Cesar — usados para simular simpatizantes registrados en otro departamento. */
export const PUESTOS_OTRO_DEPARTAMENTO = PUESTOS_VOTACION.filter((p) => p.departamento !== 'Cesar');

export function puestoPorId(id?: string): PuestoVotacion | undefined {
  return PUESTOS_VOTACION.find((p) => p.id === id);
}

/** Puestos de Valledupar que le corresponden a una comuna/corregimiento; si ninguno la tiene declarada, cae a todos los urbanos. */
export function puestosDeComuna(comuna: string): PuestoVotacion[] {
  const propios = PUESTOS_VALLEDUPAR.filter((p) => p.comunas?.includes(comuna));
  return propios.length ? propios : PUESTOS_VALLEDUPAR;
}
