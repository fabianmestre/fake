import { create } from 'zustand';
import { PERSONAS, nombreCompleto } from '../data/generarDatos';

export type CanalComunicacion = 'WhatsApp API' | 'SMS' | 'Email' | 'Llamada';
export type TipoEnvio = 'Segmento' | 'Individual';

export interface EnvioRegistro {
  id: string;
  fecha: string; // ISO timestamp
  tipo: TipoEnvio;
  canal: CanalComunicacion;
  destinatarios: number;
  detalleDestinatario: string; // resumen de filtros (segmento) o nombre (individual)
  mensaje: string;
  registradoPor: string;
}

interface ComunicacionesState {
  envios: EnvioRegistro[];
  registrarEnvio: (envio: Omit<EnvioRegistro, 'id' | 'fecha'>) => void;
}

// Plantillas de envíos ya "hechos" antes de que el admin abra el módulo por primera vez, para que
// el Historial no arranque vacío — igual de simulado/en memoria que el resto del dataset.
const CANDIDATO = PERSONAS.find((p) => p.rol === 'Candidato');
const NOMBRE_CANDIDATO = CANDIDATO ? nombreCompleto(CANDIDATO) : 'Leonardo Mestre';
const REGISTRADO_POR = 'Administrador de Campaña';

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ENVIOS_SEGMENTO: { canal: CanalComunicacion; detalle: string; destinatarios: number; mensaje: string; diasAtras: number }[] = [
  {
    canal: 'WhatsApp API',
    detalle: 'Sin filtros — todos los simpatizantes',
    destinatarios: 738,
    mensaje: `¡Hola! Soy parte del equipo de ${NOMBRE_CANDIDATO} al Concejo de Valledupar. Gracias por tu respaldo, seguimos trabajando por nuestra comuna.`,
    diasAtras: 2,
  },
  {
    canal: 'WhatsApp API',
    detalle: 'Validez: Válido · Nivel de voto: Indeciso',
    destinatarios: 214,
    mensaje: 'Este sábado tenemos un conversatorio abierto en el Coliseo de Ferias. Queremos escucharte y resolver tus dudas. ¡Te esperamos!',
    diasAtras: 5,
  },
  {
    canal: 'SMS',
    detalle: 'Faltante de puesto/mesa de votación',
    destinatarios: 86,
    mensaje: 'Aún no tenemos registrado tu puesto de votación. Responde este mensaje o contacta a tu líder para actualizarlo antes del Día E.',
    diasAtras: 6,
  },
  {
    canal: 'WhatsApp API',
    detalle: 'Comuna: Comuna 3 · Barrio: San Martín',
    destinatarios: 41,
    mensaje: 'Mañana hacemos jornada de arreglo del parque de San Martín junto a la comunidad. ¡Anímate a acompañarnos!',
    diasAtras: 9,
  },
  {
    canal: 'Email',
    detalle: 'Nivel académico: Profesional',
    destinatarios: 97,
    mensaje: 'Te compartimos el plan de gobierno actualizado con las propuestas para Valledupar en materia de empleo y educación. Tu opinión nos importa.',
    diasAtras: 11,
  },
  {
    canal: 'WhatsApp API',
    detalle: 'Grupo social: Jóvenes',
    destinatarios: 63,
    mensaje: 'Este viernes: torneo relámpago de microfútbol y feria de empleo joven en el barrio Alfonso López. ¡Los esperamos desde las 3pm!',
    diasAtras: 13,
  },
  {
    canal: 'Llamada',
    detalle: 'Rol Día E: Testigo Electoral',
    destinatarios: 34,
    mensaje: 'Confirmación de asistencia a la capacitación de testigos electorales del próximo martes en la sede de campaña.',
    diasAtras: 15,
  },
  {
    canal: 'WhatsApp API',
    detalle: 'Corregimiento: Guacoche',
    destinatarios: 28,
    mensaje: 'La brigada de salud llega este jueves a Guacoche. Traigan su documento de identidad para la atención prioritaria.',
    diasAtras: 18,
  },
  {
    canal: 'SMS',
    detalle: '¿Vehículo disponible?: Sí',
    destinatarios: 52,
    mensaje: 'Necesitamos confirmar tu disponibilidad de vehículo para el Día E. Contesta SI o NO a este mensaje, gracias por tu apoyo.',
    diasAtras: 21,
  },
  {
    canal: 'WhatsApp API',
    detalle: 'Grupo social: Adulto mayor',
    destinatarios: 45,
    mensaje: 'Recordatorio: jornada de vacunación y control médico gratuito este sábado en el Centro de Comuna 1, de 8am a 12m.',
    diasAtras: 24,
  },
  {
    canal: 'WhatsApp API',
    detalle: 'Validez: Inválido',
    destinatarios: 118,
    mensaje: 'Notamos que tu puesto de votación registrado está fuera de Valledupar. Si ya vives aquí, te ayudamos a hacer el cambio de inscripción, escríbenos.',
    diasAtras: 27,
  },
  {
    canal: 'Email',
    detalle: 'Interés: Empleo',
    destinatarios: 71,
    mensaje: 'Abrimos convocatoria de empleo con empresas aliadas de la campaña. Adjuntamos el formulario para que apliques.',
    diasAtras: 32,
  },
];

const ENVIOS_INDIVIDUALES: { canal: CanalComunicacion; mensaje: string; diasAtras: number }[] = [
  {
    canal: 'WhatsApp API',
    mensaje: 'Hola, gracias por avisarnos del inconveniente con el registro de tu ficha. Ya quedó corregido, cualquier cosa nos escribes.',
    diasAtras: 4,
  },
  {
    canal: 'Llamada',
    mensaje: 'Llamada de seguimiento para confirmar su rol de logística el Día E y coordinar el punto de encuentro.',
    diasAtras: 8,
  },
  {
    canal: 'Email',
    mensaje: 'Adjunto el certificado de asistencia al conversatorio del sábado pasado, como nos lo solicitó. Gracias por participar.',
    diasAtras: 17,
  },
];

function generarHistorialInicial(): EnvioRegistro[] {
  const simpatizantes = PERSONAS.filter((p) => p.rol === 'Simpatizante');
  const ahora = Date.now();
  const unDiaMs = 24 * 60 * 60 * 1000;

  const fechaHaceNDias = (dias: number, indice: number) => new Date(ahora - dias * unDiaMs - indice * 3 * 60 * 60 * 1000).toISOString();

  const segmentos: EnvioRegistro[] = ENVIOS_SEGMENTO.map((e, i) => ({
    id: `env-seed-seg-${i}`,
    fecha: fechaHaceNDias(e.diasAtras, i),
    tipo: 'Segmento',
    canal: e.canal,
    destinatarios: e.destinatarios,
    detalleDestinatario: e.detalle,
    mensaje: e.mensaje,
    registradoPor: REGISTRADO_POR,
  }));

  const individuales: EnvioRegistro[] = ENVIOS_INDIVIDUALES.map((e, i) => {
    const persona = simpatizantes.length ? pick(simpatizantes) : undefined;
    return {
      id: `env-seed-ind-${i}`,
      fecha: fechaHaceNDias(e.diasAtras, i),
      tipo: 'Individual',
      canal: e.canal,
      destinatarios: 1,
      detalleDestinatario: persona ? `${nombreCompleto(persona)} (${persona.cedula})` : 'Simpatizante',
      mensaje: e.mensaje,
      registradoPor: REGISTRADO_POR,
    };
  });

  return [...segmentos, ...individuales].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export const useComunicacionesStore = create<ComunicacionesState>((set) => ({
  envios: generarHistorialInicial(),
  registrarEnvio: (envio) =>
    set((s) => ({
      envios: [{ ...envio, id: `env-${Date.now()}-${Math.round(Math.random() * 9999)}`, fecha: new Date().toISOString() }, ...s.envios],
    })),
}));
