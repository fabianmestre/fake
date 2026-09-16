import { create } from 'zustand';
import type { UsuarioPrueba } from '../types';
import { CLAVE_DEMO } from '../data/usuariosPrueba';
import { useUsuariosStore } from './usuariosStore';

interface SessionState {
  usuario: UsuarioPrueba | null;
  error: string | null;
  login: (usuario: string, clave: string) => boolean;
  logout: () => void;
  cambiarClave: (claveActual: string, claveNueva: string) => { ok: boolean; mensaje: string };
}

export const useSessionStore = create<SessionState>((set, get) => ({
  usuario: null,
  error: null,
  login: (usuario, clave) => {
    const encontrado = useUsuariosStore.getState().usuarios.find((u) => u.usuario === usuario.trim().toLowerCase());
    if (!encontrado || encontrado.clave !== clave) {
      set({ error: 'Usuario o contraseña incorrectos.' });
      return false;
    }
    if (!encontrado.activo) {
      set({ error: 'Este usuario no tiene acceso activo a la plataforma. Contacta al administrador.' });
      return false;
    }
    set({ usuario: encontrado, error: null });
    return true;
  },
  logout: () => set({ usuario: null, error: null }),
  cambiarClave: (claveActual, claveNueva) => {
    const usuario = get().usuario;
    if (!usuario) return { ok: false, mensaje: 'No hay sesión activa.' };
    const cuenta = useUsuariosStore.getState().usuarios.find((u) => u.id === usuario.id);
    if (!cuenta || cuenta.clave !== claveActual) {
      return { ok: false, mensaje: 'La contraseña actual no coincide.' };
    }
    if (claveNueva.length < 4) {
      return { ok: false, mensaje: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }
    useUsuariosStore.getState().actualizarClave(usuario.id, claveNueva);
    return { ok: true, mensaje: 'Contraseña actualizada correctamente.' };
  },
}));

export { CLAVE_DEMO };
