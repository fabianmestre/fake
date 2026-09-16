import { create } from 'zustand';
import type { UsuarioPrueba } from '../types';
import { USUARIOS_PRUEBA, CLAVE_DEMO } from '../data/usuariosPrueba';

interface SessionState {
  usuario: UsuarioPrueba | null;
  error: string | null;
  login: (usuario: string, clave: string) => boolean;
  logout: () => void;
  cambiarClave: (claveActual: string, claveNueva: string) => { ok: boolean; mensaje: string };
}

const claves = new Map<string, string>(USUARIOS_PRUEBA.map((u) => [u.id, u.clave]));

export const useSessionStore = create<SessionState>((set, get) => ({
  usuario: null,
  error: null,
  login: (usuario, clave) => {
    const encontrado = USUARIOS_PRUEBA.find((u) => u.usuario === usuario.trim().toLowerCase());
    const claveValida = encontrado ? claves.get(encontrado.id) === clave : false;
    if (!encontrado || !claveValida) {
      set({ error: 'Usuario o contraseña incorrectos.' });
      return false;
    }
    set({ usuario: encontrado, error: null });
    return true;
  },
  logout: () => set({ usuario: null, error: null }),
  cambiarClave: (claveActual, claveNueva) => {
    const usuario = get().usuario;
    if (!usuario) return { ok: false, mensaje: 'No hay sesión activa.' };
    if (claves.get(usuario.id) !== claveActual) {
      return { ok: false, mensaje: 'La contraseña actual no coincide.' };
    }
    if (claveNueva.length < 4) {
      return { ok: false, mensaje: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }
    claves.set(usuario.id, claveNueva);
    return { ok: true, mensaje: 'Contraseña actualizada correctamente.' };
  },
}));

export { CLAVE_DEMO };
