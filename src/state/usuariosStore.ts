import { create } from 'zustand';
import type { Persona, RolUsuario, UsuarioPrueba } from '../types';
import { USUARIOS_PRUEBA } from '../data/usuariosPrueba';
import { nombreCompleto } from '../data/generarDatos';
import { generarClave, generarNombreUsuario } from '../lib/credenciales';

interface UsuariosState {
  usuarios: UsuarioPrueba[];
  /** Crea la cuenta de acceso al promover a alguien a Líder/Gestor/Digitador, o reactiva la que ya
   * tenía (por ejemplo si fue degradado y luego vuelve a ser promovido) en vez de duplicarla. */
  crearOReactivarUsuario: (persona: Persona, rolUsuario: RolUsuario) => UsuarioPrueba;
  /** Desactiva el acceso de la cuenta ligada a esa persona, si existe (al quitarle el rol). */
  desactivarPorPersona: (personaId: string) => void;
  activarUsuario: (id: string) => void;
  desactivarUsuario: (id: string) => void;
  restablecerClave: (id: string) => string;
  actualizarClave: (id: string, claveNueva: string) => void;
}

export const useUsuariosStore = create<UsuariosState>((set, get) => ({
  usuarios: USUARIOS_PRUEBA,

  crearOReactivarUsuario: (persona, rolUsuario) => {
    const existente = get().usuarios.find((u) => u.personaId === persona.id);
    if (existente) {
      const actualizado: UsuarioPrueba = { ...existente, rolUsuario, activo: true, nombre: nombreCompleto(persona) };
      set((s) => ({ usuarios: s.usuarios.map((u) => (u.id === existente.id ? actualizado : u)) }));
      return actualizado;
    }
    const existentes = get().usuarios.map((u) => u.usuario);
    const nuevo: UsuarioPrueba = {
      id: `u-${persona.id}`,
      nombre: nombreCompleto(persona),
      usuario: generarNombreUsuario(persona.nombres, persona.apellidos, existentes),
      clave: generarClave(),
      rolUsuario,
      personaId: persona.id,
      activo: true,
      fechaCreacion: new Date().toISOString().slice(0, 10),
    };
    set((s) => ({ usuarios: [...s.usuarios, nuevo] }));
    return nuevo;
  },

  desactivarPorPersona: (personaId) => {
    set((s) => ({ usuarios: s.usuarios.map((u) => (u.personaId === personaId ? { ...u, activo: false } : u)) }));
  },

  activarUsuario: (id) => set((s) => ({ usuarios: s.usuarios.map((u) => (u.id === id ? { ...u, activo: true } : u)) })),
  desactivarUsuario: (id) => set((s) => ({ usuarios: s.usuarios.map((u) => (u.id === id ? { ...u, activo: false } : u)) })),

  restablecerClave: (id) => {
    const nueva = generarClave();
    set((s) => ({ usuarios: s.usuarios.map((u) => (u.id === id ? { ...u, clave: nueva } : u)) }));
    return nueva;
  },

  actualizarClave: (id, claveNueva) => {
    set((s) => ({ usuarios: s.usuarios.map((u) => (u.id === id ? { ...u, clave: claveNueva } : u)) }));
  },
}));
