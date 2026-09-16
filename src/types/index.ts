export type Rol = 'Simpatizante' | 'Líder' | 'Padrino' | 'Gestor' | 'Digitador' | 'Candidato';

export type Validez = 'Válido' | 'Inválido';

export type Nivel = 'Firme' | 'Indeciso';

export type NivelFormacion = 'Ninguno' | 'Primaria' | 'Bachiller' | 'Técnico' | 'Tecnólogo' | 'Profesional' | 'Posgrado';

export type RolDiaE = 'Votante' | 'Testigo Electoral' | 'Transportador' | 'Logística' | 'Coordinador de Puesto';

export type VehiculoTipo = 'Moto' | 'Carro' | 'Bus/Buseta';

export type CategoriaGestion = 'Salud' | 'Empleo' | 'Ayudas/Mercados' | 'Recursos/Dinero' | 'Trámites/Asesoría' | 'Obras comunitarias';

export type EstadoGestion = 'Pendiente' | 'En Proceso' | 'Resuelto';

// Un favor/compromiso que el candidato o su equipo le gestiona a alguien (o a la comunidad en
// general, si personaId queda vacío) — la trazabilidad de "lo que se debe" y "lo que ya se cumplió".
export interface Gestion {
  id: string;
  personaId?: string; // simpatizante o líder beneficiado; vacío = gestión general de campaña
  fecha: string; // YYYY-MM-DD
  categoria: CategoriaGestion;
  descripcion: string;
  monto?: number; // COP; algunas categorías (trámites, obras) no siempre implican dinero
  estado: EstadoGestion;
  responsable: string; // texto libre: quién de la campaña la está gestionando
}

// Un vehículo aquí implica que el simpatizante lo puso a disposición de la campaña
// (transporte de votantes, logística del Día E) — una persona puede ofrecer varios (ej. moto y carro).
export interface VehiculoCampania {
  id: string;
  tipo: VehiculoTipo;
  pasajeros?: number; // Carro = 4 fijo; Bus/Buseta se pregunta; Moto no aplica
  placa?: string;
}

export interface Comuna {
  nombre: string;
  tipo: 'Comuna' | 'Corregimiento';
  barrios: string[];
}

export interface Municipio {
  nombre: string;
  comunas: Comuna[];
}

export interface Departamento {
  nombre: string;
  municipios: Municipio[];
}

export interface Mesa {
  numero: string;
}

export interface PuestoVotacion {
  id: string;
  nombre: string;
  departamento: string;
  municipio: string;
  mesas: Mesa[];
  // Comunas/corregimientos de Valledupar a los que corresponde este puesto (solo aplica a
  // puestos dentro de Valledupar) — se usa para asignarle a cada persona un puesto acorde a
  // dónde vive, en vez de uno aleatorio sin relación con su residencia.
  comunas?: string[];
}

export interface Persona {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  correo: string;

  // Residencia
  departamento: string;
  municipio: string;
  comuna: string;
  barrio: string;

  // Puesto de votación
  dptoVotacion?: string;
  municVotacion?: string;
  puestoVotacionId?: string;
  puestoVotacion?: string;
  mesaVotacion?: string;

  // Estructura — toda la base (menos el Candidato, que es la raíz) debe tener alguien asociado por encima.
  rol: Rol;
  liderId?: string; // líder al que reporta (simpatizante, gestor, digitador) o líder histórico que lo vinculó
  padrinoId?: string; // a quién reporta un Líder: un Padrino, o directamente el Candidato
  candidatoId?: string; // candidato al que reporta un Padrino (siempre el único Candidato de la campaña)
  liderIds?: string[]; // líderes a cargo (padrino o el candidato) o líderes que supervisa (gestor)
  planilla?: string;
  metaSimpatizantes?: number; // solo Rol === 'Líder': meta de simpatizantes válidos para el Día E

  // Caracterización social
  ocupacion?: string;
  profesion?: string;
  nivelFormacion: NivelFormacion;
  posgrado?: string;
  gustosIntereses?: string[];
  gruposSociales?: string[];
  observaciones?: string;

  // Logística Día E
  vehiculoDisponible: boolean; // ¿tiene al menos un vehículo a disposición de la campaña?
  vehiculos: VehiculoCampania[]; // uno o varios (ej. moto y carro a la vez)
  rolDiaE?: RolDiaE;
  voto: boolean; // ¿ya votó? Solo se puede marcar/editar el día de la jornada electoral (Día E)

  // Electoral / campaña
  nivel: Nivel;
  validez: Validez;

  // Metadatos de captura
  registradoPor: string; // id de usuario digitador/admin que la creó
  finalizado: boolean;
  fechaRegistro: string;

  // Trazabilidad de Gestiones (favores/compromisos) — módulo detallado en una próxima iteración,
  // por ahora solo un indicador simulado para poder filtrar por él.
  tieneGestiones: boolean;
}

// El Padrino no inicia sesión en la plataforma; el Líder tiene acceso temporal para ingresar datos
// hasta que la campaña defina lo contrario.
export type RolUsuario = 'admin' | 'lider' | 'gestor' | 'digitador';

export interface UsuarioPrueba {
  id: string;
  nombre: string;
  usuario: string;
  clave: string;
  rolUsuario: RolUsuario;
  personaId?: string; // ficha de Persona asociada (todos menos admin)
  activo: boolean; // acceso habilitado/deshabilitado a la plataforma
  fechaCreacion: string; // YYYY-MM-DD
}
