import type { Departamento } from '../types';

// Geografía basada en la división político-administrativa real de Valledupar y municipios
// vecinos del Cesar (fuente: Wikipedia — Comunas de Valledupar, Anexo:Barrios de Valledupar,
// Anexo:Corregimientos y Centros poblados de Valledupar; alcaldías de La Paz y San Diego).
// Circunscripción: Concejo de Valledupar. La Paz y San Diego se incluyen para poder simular
// registros "Inválidos" (puesto de votación fuera de la circunscripción).

export const CESAR: Departamento = {
  nombre: 'Cesar',
  municipios: [
    {
      nombre: 'Valledupar',
      comunas: [
        // 6 comunas urbanas reales (no 10) — Valledupar agrupa sus ~175 barrios en 6 comunas.
        {
          nombre: 'Comuna 1',
          tipo: 'Comuna',
          barrios: ['Centro', 'Loperena', 'Altagracia', 'La Garita', 'San Antonio', 'Alfonso López', 'Las Delicias'],
        },
        {
          nombre: 'Comuna 2',
          tipo: 'Comuna',
          barrios: ['Villa del Rosario', 'Candelaria Sur', 'Simón Bolívar', 'Mayales', 'San Fernando', 'Santa Rita'],
        },
        {
          nombre: 'Comuna 3',
          tipo: 'Comuna',
          barrios: ['Primero de Mayo', 'El Prado', 'San Martín', 'Los Álamos', 'San Francisco', 'Rincón de Ziruma'],
        },
        {
          nombre: 'Comuna 4',
          tipo: 'Comuna',
          barrios: ['Los Fundadores', 'Jorge Dangond', 'Los Caciques', 'Villa Corelca', 'Manantial', 'El Cerrito'],
        },
        {
          nombre: 'Comuna 5',
          tipo: 'Comuna',
          barrios: ['Villalba', 'Altos del Rosario', 'Arizona', 'Los Músicos', 'San Isidro', 'Los Cortijos'],
        },
        {
          nombre: 'Comuna 6',
          tipo: 'Comuna',
          barrios: ['Los Ángeles', 'Ciudad Jardín', 'Pontevedra', 'San Carlos', 'Rosanía', 'Pasadena'],
        },
        // 25 corregimientos reales, agrupados por zona en la fuente (se listan sin la zona
        // porque el modelo de datos no distingue esa capa, solo Comuna/Corregimiento).
        // Zona Norte
        { nombre: 'Atánquez', tipo: 'Corregimiento', barrios: ['Atánquez Centro'] },
        { nombre: 'Chemesquemena', tipo: 'Corregimiento', barrios: ['Chemesquemena Centro'] },
        { nombre: 'Guatapurí', tipo: 'Corregimiento', barrios: ['Guatapurí Centro'] },
        { nombre: 'La Mina', tipo: 'Corregimiento', barrios: ['La Mina Centro'] },
        { nombre: 'Los Haticos', tipo: 'Corregimiento', barrios: ['Los Haticos Centro'] },
        // Zona Nororiental
        { nombre: 'Badillo', tipo: 'Corregimiento', barrios: ['Badillo Centro'] },
        { nombre: 'El Alto de La Vuelta', tipo: 'Corregimiento', barrios: ['El Alto de La Vuelta Centro'] },
        { nombre: 'Guacoche', tipo: 'Corregimiento', barrios: ['Guacoche Centro'] },
        { nombre: 'Guacochito', tipo: 'Corregimiento', barrios: ['Guacochito Centro'] },
        { nombre: 'El Jabo', tipo: 'Corregimiento', barrios: ['El Jabo Centro'] },
        { nombre: 'Las Raíces', tipo: 'Corregimiento', barrios: ['Las Raíces Centro'] },
        { nombre: 'Los Corazones', tipo: 'Corregimiento', barrios: ['Los Corazones Centro'] },
        { nombre: 'Patillal', tipo: 'Corregimiento', barrios: ['Patillal Centro'] },
        { nombre: 'La Vega Arriba', tipo: 'Corregimiento', barrios: ['La Vega Arriba Centro'] },
        { nombre: 'Río Seco', tipo: 'Corregimiento', barrios: ['Río Seco Centro'] },
        // Zona Suroriental
        { nombre: 'Aguas Blancas', tipo: 'Corregimiento', barrios: ['Aguas Blancas Centro'] },
        { nombre: 'Valencia de Jesús', tipo: 'Corregimiento', barrios: ['Valencia de Jesús Centro'] },
        // Zona Sur
        { nombre: 'Guaymaral', tipo: 'Corregimiento', barrios: ['Guaymaral Centro'] },
        { nombre: 'Caracolí', tipo: 'Corregimiento', barrios: ['Caracolí Centro'] },
        { nombre: 'Los Venados', tipo: 'Corregimiento', barrios: ['Los Venados Centro'] },
        { nombre: 'El Perro', tipo: 'Corregimiento', barrios: ['El Perro Centro'] },
        // Zona Suroccidental
        { nombre: 'Mariangola', tipo: 'Corregimiento', barrios: ['Mariangola Centro'] },
        { nombre: 'Villa Germania', tipo: 'Corregimiento', barrios: ['Villa Germania Centro'] },
        // Zona Noroccidental
        { nombre: 'Sabana Crespo', tipo: 'Corregimiento', barrios: ['Sabana Crespo Centro'] },
        { nombre: 'Azúcar Buena', tipo: 'Corregimiento', barrios: ['Azúcar Buena Centro'] },
      ],
    },
    {
      // Municipio de La Paz — su casco urbano/cabecera municipal se llama Robles.
      nombre: 'La Paz',
      comunas: [
        { nombre: 'Robles', tipo: 'Comuna', barrios: ['Centro', 'Robles'] },
        { nombre: 'Los Encantos', tipo: 'Corregimiento', barrios: ['Los Encantos Centro'] },
        { nombre: 'San José del Oriente', tipo: 'Corregimiento', barrios: ['San José del Oriente Centro'] },
        { nombre: 'Minguillo', tipo: 'Corregimiento', barrios: ['Minguillo Centro'] },
        { nombre: 'La Laguna de los Indios', tipo: 'Corregimiento', barrios: ['La Laguna de los Indios Centro'] },
        { nombre: 'Guaimaral', tipo: 'Corregimiento', barrios: ['Guaimaral Centro'] },
        { nombre: 'Varas Blancas', tipo: 'Corregimiento', barrios: ['Varas Blancas Centro'] },
      ],
    },
    {
      nombre: 'San Diego',
      comunas: [
        {
          nombre: 'Casco Urbano',
          tipo: 'Comuna',
          barrios: ['Centro', 'Arabia', 'Chico', 'Guayabal', 'Las Delicias', 'Las Flores', 'Pablo VI'],
        },
        { nombre: 'Tocaima', tipo: 'Corregimiento', barrios: ['Tocaima Centro'] },
        { nombre: 'Media Luna', tipo: 'Corregimiento', barrios: ['Media Luna Centro'] },
        { nombre: 'El Rincón', tipo: 'Corregimiento', barrios: ['El Rincón Centro'] },
      ],
    },
  ],
};

export const MUNICIPIOS_CIRCUNSCRIPCION = ['Valledupar'];

export function listaMunicipios(): string[] {
  return CESAR.municipios.map((m) => m.nombre);
}

export function comunasDeMunicipio(municipio: string) {
  return CESAR.municipios.find((m) => m.nombre === municipio)?.comunas ?? [];
}

export function barriosDeComuna(municipio: string, comuna: string): string[] {
  return comunasDeMunicipio(municipio).find((c) => c.nombre === comuna)?.barrios ?? [];
}

export type Zona = 'Urbana' | 'Rural';

export function zonaDeComuna(municipio: string, comuna: string): Zona | undefined {
  const tipo = comunasDeMunicipio(municipio).find((c) => c.nombre === comuna)?.tipo;
  if (!tipo) return undefined;
  return tipo === 'Comuna' ? 'Urbana' : 'Rural';
}

export function comunasPorTipo(municipio: string, tipo: 'Comuna' | 'Corregimiento') {
  return comunasDeMunicipio(municipio).filter((c) => c.tipo === tipo);
}

/**
 * Localidad "mostrable" de una persona: su barrio real si vive en una comuna urbana, o el nombre
 * del corregimiento si vive en zona rural (un corregimiento no es un barrio — mostrar su pseudo-
 * barrio "X Centro" como si fuera uno confunde la lectura de comunas/corregimientos vs. barrios).
 */
export function localidadDeResidencia(p: { municipio: string; comuna: string; barrio: string }): string {
  return zonaDeComuna(p.municipio, p.comuna) === 'Rural' ? p.comuna : p.barrio;
}
