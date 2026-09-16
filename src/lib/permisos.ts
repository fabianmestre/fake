import type { Persona, UsuarioPrueba } from '../types';

/**
 * Reglas de alcance y permisos simuladas para el prototipo.
 * admin: acceso total.
 * lider: puede registrar simpatizantes nuevos (como el digitador) y solo ve, en modo lectura, lo que
 *   él mismo registró — no puede editar ni eliminar. Es un acceso temporal, ver LIDER_PUEDE_DIGITAR.
 * gestor: ve los simpatizantes de los líderes que supervisa; puede editar campos no básicos, no puede eliminar.
 * digitador: solo ve lo que él mismo registró; solo puede editar/eliminar mientras no esté finalizado.
 */

// Punto único de control: cuando la campaña decida cerrarle esta capacidad a los líderes, basta con
// cambiar esto a false (oculta "Registrar Simpatizante" de su sidebar y bloquea la ruta).
export const LIDER_PUEDE_DIGITAR = true;

const CAMPOS_BASICOS: (keyof Persona)[] = ['nombres', 'apellidos', 'cedula', 'telefono', 'correo', 'departamento', 'municipio', 'comuna', 'barrio', 'liderId', 'planilla'];

export function alcanceDeDatos(usuario: UsuarioPrueba | null, dataset: Persona[]): Persona[] {
  if (!usuario) return [];
  if (usuario.rolUsuario === 'admin') return dataset;

  if (usuario.rolUsuario === 'lider') {
    return dataset.filter((p) => p.registradoPor === usuario.personaId);
  }

  if (usuario.rolUsuario === 'gestor') {
    const gestor = dataset.find((p) => p.id === usuario.personaId);
    const supervisados = new Set(gestor?.liderIds ?? []);
    return dataset.filter((p) => p.liderId && supervisados.has(p.liderId));
  }

  if (usuario.rolUsuario === 'digitador') {
    return dataset.filter((p) => p.registradoPor === usuario.personaId);
  }

  return [];
}

export function puedeCrear(usuario: UsuarioPrueba | null): boolean {
  if (!usuario) return false;
  return usuario.rolUsuario !== 'gestor'; // gestor no crea fichas nuevas, solo mejora calidad de dato existente
}

export function puedeEliminar(usuario: UsuarioPrueba | null, persona: Persona): boolean {
  if (!usuario) return false;
  if (usuario.rolUsuario === 'admin') return true;
  if (usuario.rolUsuario === 'digitador') {
    return persona.registradoPor === usuario.personaId && !persona.finalizado;
  }
  return false;
}

export function puedeEditar(usuario: UsuarioPrueba | null, persona: Persona): boolean {
  if (!usuario) return false;
  if (usuario.rolUsuario === 'admin') return true;
  if (usuario.rolUsuario === 'digitador') {
    return persona.registradoPor === usuario.personaId && !persona.finalizado;
  }
  if (usuario.rolUsuario === 'gestor') return true; // solo campos no básicos, ver puedeEditarCampo
  return false; // lider: solo lectura de lo que él mismo registró
}

export function puedeEditarCampo(usuario: UsuarioPrueba | null, campo: keyof Persona): boolean {
  if (!usuario) return false;
  if (usuario.rolUsuario === 'admin') return true;
  if (usuario.rolUsuario === 'gestor') return !CAMPOS_BASICOS.includes(campo);
  return true;
}

/** Día E: quién puede marcar si un simpatizante ya votó (admin y gestor). */
export function puedeMarcarVoto(usuario: UsuarioPrueba | null): boolean {
  if (!usuario) return false;
  return usuario.rolUsuario === 'admin' || usuario.rolUsuario === 'gestor';
}
