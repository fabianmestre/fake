import type { CategoriaGestion, EstadoGestion } from '../types';

export const CATEGORIAS_GESTION: CategoriaGestion[] = [
  'Salud',
  'Empleo',
  'Ayudas/Mercados',
  'Recursos/Dinero',
  'Trámites/Asesoría',
  'Obras comunitarias',
];

export const ESTADOS_GESTION: EstadoGestion[] = ['Pendiente', 'En Proceso', 'Resuelto'];

export const RESPONSABLES_GESTION = [
  'Director de Campaña',
  'Gestión Humana',
  'Asesoría Legal',
  'Finanzas',
  'Coordinador Social',
  'Equipo de Salud',
];

// Con y sin monto asociado, según qué tan plausible es que la categoría implique un desembolso.
export const DESCRIPCIONES_POR_CATEGORIA: Record<CategoriaGestion, { texto: string; conMonto: boolean }[]> = {
  Salud: [
    { texto: 'Gestión de cita médica prioritaria', conMonto: false },
    { texto: 'Apoyo para compra de medicamentos', conMonto: true },
    { texto: 'Traslado a EPS para procedimiento', conMonto: true },
    { texto: 'Gestión de autorización de exámenes', conMonto: false },
  ],
  Empleo: [
    { texto: 'Gestión de contrato temporal', conMonto: false },
    { texto: 'Vinculación a bolsa de empleo local', conMonto: false },
    { texto: 'Intermediación laboral con empresa aliada', conMonto: false },
    { texto: 'Apoyo para curso de certificación laboral', conMonto: true },
  ],
  'Ayudas/Mercados': [
    { texto: 'Entrega de mercado familiar', conMonto: true },
    { texto: 'Ayuda alimentaria de emergencia', conMonto: true },
    { texto: 'Kit escolar para hijos del hogar', conMonto: true },
  ],
  'Recursos/Dinero': [
    { texto: 'Apoyo económico para transporte', conMonto: true },
    { texto: 'Auxilio económico familiar', conMonto: true },
    { texto: 'Aporte para gastos funerarios', conMonto: true },
    { texto: 'Apoyo económico para arriendo', conMonto: true },
  ],
  'Trámites/Asesoría': [
    { texto: 'Orientación para subsidio de vivienda', conMonto: false },
    { texto: 'Asesoría jurídica gratuita', conMonto: false },
    { texto: 'Trámite de duplicado de cédula', conMonto: false },
    { texto: 'Orientación para pensión/Sisbén', conMonto: false },
  ],
  'Obras comunitarias': [
    { texto: 'Arreglo de vía barrial', conMonto: true },
    { texto: 'Instalación de luminarias', conMonto: true },
    { texto: 'Adecuación de cancha comunitaria', conMonto: true },
    { texto: 'Gestión de poda y limpieza de zona verde', conMonto: false },
  ],
};
