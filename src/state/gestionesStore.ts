import { create } from 'zustand';
import type { Gestion } from '../types';
import { PERSONAS } from '../data/generarDatos';
import { construirGestiones } from '../data/generarGestiones';

interface GestionesState {
  gestiones: Gestion[];
  agregarGestion: (g: Gestion) => void;
  actualizarGestion: (id: string, cambios: Partial<Gestion>) => void;
  eliminarGestion: (id: string) => void;
}

export const useGestionesStore = create<GestionesState>((set) => ({
  gestiones: construirGestiones(PERSONAS),
  agregarGestion: (g) => set((s) => ({ gestiones: [g, ...s.gestiones] })),
  actualizarGestion: (id, cambios) =>
    set((s) => ({ gestiones: s.gestiones.map((g) => (g.id === id ? { ...g, ...cambios } : g)) })),
  eliminarGestion: (id) => set((s) => ({ gestiones: s.gestiones.filter((g) => g.id !== id) })),
}));
