import type { UsuarioPrueba } from '../types';
import { PERSONAS, nombreCompleto } from './generarDatos';

const liderDemo = PERSONAS.find((p) => p.rol === 'Líder')!;
const gestorDemo = PERSONAS.find((p) => p.rol === 'Gestor')!;
const digitadorDemo = PERSONAS.find((p) => p.rol === 'Digitador')!;

export const CLAVE_DEMO = '1234';

const FECHA_SEED = '2026-01-15';

export const USUARIOS_PRUEBA: UsuarioPrueba[] = [
  {
    id: 'u-admin',
    nombre: 'Administrador de Campaña',
    usuario: 'admin',
    clave: CLAVE_DEMO,
    rolUsuario: 'admin',
    activo: true,
    fechaCreacion: FECHA_SEED,
  },
  {
    id: 'u-lider',
    nombre: nombreCompleto(liderDemo),
    usuario: 'lider1',
    clave: CLAVE_DEMO,
    rolUsuario: 'lider',
    personaId: liderDemo.id,
    activo: true,
    fechaCreacion: FECHA_SEED,
  },
  {
    id: 'u-gestor',
    nombre: nombreCompleto(gestorDemo),
    usuario: 'gestor1',
    clave: CLAVE_DEMO,
    rolUsuario: 'gestor',
    personaId: gestorDemo.id,
    activo: true,
    fechaCreacion: FECHA_SEED,
  },
  {
    id: 'u-digitador',
    nombre: nombreCompleto(digitadorDemo),
    usuario: 'digitador1',
    clave: CLAVE_DEMO,
    rolUsuario: 'digitador',
    personaId: digitadorDemo.id,
    activo: true,
    fechaCreacion: FECHA_SEED,
  },
];
