import type { UsuarioPrueba } from '../types';
import { PERSONAS, nombreCompleto } from './generarDatos';

const liderDemo = PERSONAS.find((p) => p.rol === 'Líder')!;
const gestorDemo = PERSONAS.find((p) => p.rol === 'Gestor')!;
const digitadorDemo = PERSONAS.find((p) => p.rol === 'Digitador')!;

export const CLAVE_DEMO = '1234';

export const USUARIOS_PRUEBA: UsuarioPrueba[] = [
  {
    id: 'u-admin',
    nombre: 'Administrador de Campaña',
    usuario: 'admin',
    clave: CLAVE_DEMO,
    rolUsuario: 'admin',
  },
  {
    id: 'u-lider',
    nombre: nombreCompleto(liderDemo),
    usuario: 'lider1',
    clave: CLAVE_DEMO,
    rolUsuario: 'lider',
    personaId: liderDemo.id,
  },
  {
    id: 'u-gestor',
    nombre: nombreCompleto(gestorDemo),
    usuario: 'gestor1',
    clave: CLAVE_DEMO,
    rolUsuario: 'gestor',
    personaId: gestorDemo.id,
  },
  {
    id: 'u-digitador',
    nombre: nombreCompleto(digitadorDemo),
    usuario: 'digitador1',
    clave: CLAVE_DEMO,
    rolUsuario: 'digitador',
    personaId: digitadorDemo.id,
  },
];
