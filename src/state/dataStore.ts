import { create } from 'zustand';
import type { Persona } from '../types';
import { PERSONAS } from '../data/generarDatos';

interface DataState {
  personas: Persona[];
  agregarPersona: (p: Persona) => void;
  actualizarPersona: (id: string, cambios: Partial<Persona>) => void;
  eliminarPersona: (id: string) => void;
}

export const useDataStore = create<DataState>((set) => ({
  personas: PERSONAS,
  agregarPersona: (p) => set((s) => ({ personas: [p, ...s.personas] })),
  actualizarPersona: (id, cambios) =>
    set((s) => ({ personas: s.personas.map((p) => (p.id === id ? { ...p, ...cambios } : p)) })),
  eliminarPersona: (id) => set((s) => ({ personas: s.personas.filter((p) => p.id !== id) })),
}));
