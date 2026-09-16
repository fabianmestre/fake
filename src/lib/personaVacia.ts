import type { Persona, UsuarioPrueba } from '../types';

export function personaVacia(usuario: UsuarioPrueba | null): Persona {
  return {
    id: `p-tmp-${Date.now()}`,
    nombres: '',
    apellidos: '',
    cedula: '',
    telefono: '',
    correo: '',
    departamento: 'Cesar',
    municipio: '',
    comuna: '',
    barrio: '',
    rol: 'Simpatizante',
    nivelFormacion: 'Bachiller',
    posgrado: 'Ninguno',
    gustosIntereses: [],
    gruposSociales: [],
    vehiculoDisponible: false,
    vehiculos: [],
    rolDiaE: 'Votante',
    voto: false,
    nivel: 'Indeciso',
    validez: 'Inválido',
    registradoPor: usuario?.personaId ?? 'admin',
    finalizado: false,
    fechaRegistro: new Date().toISOString().slice(0, 10),
    tieneGestiones: false,
  };
}
