import type { PuestoVotacion } from '../types';

function mesas(n: number) {
  return Array.from({ length: n }, (_, i) => ({ numero: String(i + 1).padStart(2, '0') }));
}

// Catálogo de puestos de votación basado en instituciones y escenarios reales de Valledupar
// (Colegio Nacional Loperena, CASD Simón Bolívar, Coliseo Cubierto Julio Monsalvo, Coliseo de
// Ferias, Universidad Popular del Cesar, SENA, Uparsistem, Fundación Universitaria del Área
// Andina, I.E. César Pompeyo Mendoza, Instituto La Salle, entre otros); las escuelas rurales
// se nombran según corregimientos reales del municipio. El número de mesas es ilustrativo.
//
// Además del catálogo de Valledupar (circunscripción del Concejo), se incluyen dos grupos para
// simular simpatizantes "Inválidos" (puesto de votación fuera de la circunscripción):
//  - Municipios cercanos del Cesar (área metropolitana de Valledupar: La Paz, San Diego,
//    Agustín Codazzi, Manaure Balcón del Cesar).
//  - Otros departamentos de Colombia (personas que residen en/cerca de Valledupar pero nunca
//    cambiaron su lugar de votación): Atlántico, Bogotá D.C., La Guajira, Magdalena y Norte de
//    Santander.
export const PUESTOS_VOTACION: PuestoVotacion[] = [
  { id: 'pv-01', nombre: 'Colegio Nacional Loperena', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(18) },
  { id: 'pv-02', nombre: 'CASD Simón Bolívar', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(20) },
  { id: 'pv-03', nombre: 'Coliseo de Ferias (Pedro Castro Monsalvo)', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(15) },
  { id: 'pv-04', nombre: 'Coliseo Cubierto Julio Monsalvo', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(16) },
  { id: 'pv-05', nombre: 'Universidad Popular del Cesar', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(22) },
  { id: 'pv-06', nombre: 'Fundación Universitaria del Área Andina', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(12) },
  { id: 'pv-07', nombre: 'SENA (Terminal de Transportes)', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(10) },
  { id: 'pv-08', nombre: 'Uparsistem', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(9) },
  { id: 'pv-09', nombre: 'I.E. César Pompeyo Mendoza', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(11) },
  { id: 'pv-10', nombre: 'Instituto La Salle', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(14) },
  { id: 'pv-11', nombre: 'I.E. Divina Pastora', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(9) },
  { id: 'pv-12', nombre: 'I.E. Nuestra Señora del Rosario', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(10) },
  { id: 'pv-13', nombre: 'Casa de la Cultura La Mina', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(6) },
  { id: 'pv-14', nombre: 'I.E. Los Corazones', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(7) },
  { id: 'pv-15', nombre: 'Escuela Rural Guacoche', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(5) },
  { id: 'pv-16', nombre: 'Escuela Rural Aguas Blancas', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(5) },
  { id: 'pv-17', nombre: 'Escuela Rural Río Seco', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(4) },
  { id: 'pv-18', nombre: 'Escuela Rural Atánquez', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(4) },
  { id: 'pv-19', nombre: 'Escuela Tezhumke (Atánquez)', departamento: 'Cesar', municipio: 'Valledupar', mesas: mesas(3) },

  // Municipios cercanos (área metropolitana de Valledupar) — mismo departamento, fuera de la circunscripción.
  { id: 'pv-20', nombre: 'I.E. Robles', departamento: 'Cesar', municipio: 'La Paz', mesas: mesas(10) },
  { id: 'pv-21', nombre: 'I.E. San Diego Centro', departamento: 'Cesar', municipio: 'San Diego', mesas: mesas(8) },
  { id: 'pv-22', nombre: 'I.E. Agustín Codazzi Centro', departamento: 'Cesar', municipio: 'Agustín Codazzi', mesas: mesas(9) },
  { id: 'pv-23', nombre: 'I.E. Manaure Centro', departamento: 'Cesar', municipio: 'Manaure Balcón del Cesar', mesas: mesas(6) },

  // Otros departamentos — personas registradas para votar lejos de la circunscripción.
  { id: 'pv-24', nombre: 'Universidad del Atlántico', departamento: 'Atlántico', municipio: 'Barranquilla', mesas: mesas(25) },
  { id: 'pv-25', nombre: 'Universidad Nacional de Colombia', departamento: 'Bogotá D.C.', municipio: 'Bogotá', mesas: mesas(30) },
  { id: 'pv-26', nombre: 'I.E. Riohacha Centro', departamento: 'La Guajira', municipio: 'Riohacha', mesas: mesas(12) },
  { id: 'pv-27', nombre: 'I.E. Santa Marta Centro', departamento: 'Magdalena', municipio: 'Santa Marta', mesas: mesas(14) },
  { id: 'pv-28', nombre: 'I.E. Cúcuta Centro', departamento: 'Norte de Santander', municipio: 'Cúcuta', mesas: mesas(12) },
];

/** Puestos fuera del Cesar — usados para simular simpatizantes registrados en otro departamento. */
export const PUESTOS_OTRO_DEPARTAMENTO = PUESTOS_VOTACION.filter((p) => p.departamento !== 'Cesar');

export function puestoPorId(id?: string): PuestoVotacion | undefined {
  return PUESTOS_VOTACION.find((p) => p.id === id);
}
