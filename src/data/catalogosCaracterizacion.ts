import type { NivelFormacion, RolDiaE, VehiculoTipo } from '../types';

export const OCUPACIONES = [
  'Empleado público',
  'Empleado privado',
  'Independiente',
  'Comerciante',
  'Ama de casa',
  'Estudiante',
  'Jornalero',
  'Pensionado',
  'Desempleado',
];

export const PROFESIONES = [
  'Sin profesión',
  'Ingeniero Civil',
  'Abogado/a',
  'Contador/a',
  'Docente',
  'Enfermero/a',
  'Médico/a',
  'Psicólogo/a',
  'Técnico Agropecuario',
  'Administrador/a',
];

export const NIVELES_FORMACION: NivelFormacion[] = ['Ninguno', 'Primaria', 'Bachiller', 'Técnico', 'Tecnólogo', 'Profesional', 'Posgrado'];

export const POSGRADOS = ['Ninguno', 'Especialización', 'Maestría', 'Doctorado'];

export const GUSTOS_INTERESES = [
  'Deporte',
  'Animales',
  'Empleo',
  'Infraestructura',
  'Educación',
  'Salud',
  'Cultura',
  'Medio Ambiente',
  'Vivienda',
  'Emprendimiento',
  'Tercera Edad',
  'Juventud',
];

export const GRUPOS_SOCIALES = [
  'LGBTQ+',
  'Negritudes',
  'Indígenas',
  'Discapacitados',
  'Seguridad',
  'Mujeres',
  'Jóvenes',
  'Adulto mayor',
  'Víctimas del conflicto',
  'Campesinos',
  'Religiosos',
  'Migrantes',
];

export const TIPOS_VEHICULO: VehiculoTipo[] = ['Moto', 'Carro', 'Bus/Buseta'];

// Pasajeros conocidos de antemano por tipo; Bus/Buseta se pregunta porque varía, Moto no aplica.
export const PASAJEROS_FIJOS: Partial<Record<VehiculoTipo, number>> = { Carro: 4 };

export const ROLES_DIA_E: RolDiaE[] = ['Votante', 'Testigo Electoral', 'Transportador', 'Logística', 'Coordinador de Puesto'];
