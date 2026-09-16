import { fakerES as faker } from '@faker-js/faker';
import type { NivelFormacion, Persona, VehiculoCampania, VehiculoTipo } from '../types';
import { CESAR, comunasDeMunicipio, barriosDeComuna } from './geografia';
import { PUESTOS_VOTACION, PUESTOS_OTRO_DEPARTAMENTO } from './puestosVotacion';
import { GRUPOS_SOCIALES, GUSTOS_INTERESES, OCUPACIONES, PASAJEROS_FIJOS, POSGRADOS, ROLES_DIA_E, TIPOS_VEHICULO } from './catalogosCaracterizacion';

faker.seed(2026);

const MUNICIPIOS_RESIDENCIA = [
  { nombre: 'Valledupar', peso: 0.85 },
  { nombre: 'La Paz', peso: 0.1 },
  { nombre: 'San Diego', peso: 0.05 },
];

const PROFESION_POR_NIVEL: { profesion: string; nivel: NivelFormacion }[] = [
  { profesion: 'Sin profesión', nivel: 'Bachiller' },
  { profesion: 'Sin profesión', nivel: 'Ninguno' },
  { profesion: 'Sin profesión', nivel: 'Primaria' },
  { profesion: 'Sin profesión', nivel: 'Bachiller' },
  { profesion: 'Psicólogo/a', nivel: 'Técnico' },
  { profesion: 'Docente', nivel: 'Profesional' },
  { profesion: 'Enfermero/a', nivel: 'Tecnólogo' },
  { profesion: 'Ingeniero Civil', nivel: 'Profesional' },
  { profesion: 'Abogado/a', nivel: 'Profesional' },
  { profesion: 'Contador/a', nivel: 'Profesional' },
  { profesion: 'Técnico Agropecuario', nivel: 'Técnico' },
  { profesion: 'Administrador/a', nivel: 'Tecnólogo' },
  { profesion: 'Médico/a', nivel: 'Posgrado' },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pesoAleatorio<T extends { peso: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.peso, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.peso;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function generarCedula(usadas: Set<string>): string {
  let c: string;
  do {
    c = String(faker.number.int({ min: 10_000_000, max: 1_199_999_999 }));
  } while (usadas.has(c));
  usadas.add(c);
  return c;
}

function generarTelefono(): string {
  return `3${faker.number.int({ min: 100000000, max: 249999999 })}`;
}

function generarPlaca(): string {
  const letras = faker.string.alpha({ length: 3, casing: 'upper' });
  const numeros = faker.number.int({ min: 100, max: 999 });
  return `${letras}${numeros}`;
}

function generarPlanillaPorLider(index: number): string {
  return `PL-${String(index + 1).padStart(5, '0')}`;
}

function generarPasajeros(tipo: VehiculoTipo): number | undefined {
  return PASAJEROS_FIJOS[tipo] ?? (tipo === 'Bus/Buseta' ? faker.number.int({ min: 8, max: 40 }) : undefined);
}

// Una persona puede poner a disposición uno o varios vehículos (ej. moto y carro a la vez).
function generarVehiculosCampania(personaId: string): VehiculoCampania[] {
  const cantidad = Math.random() > 0.85 ? 2 : 1; // ~15% de quienes ofrecen vehículo, ofrecen más de uno
  const tipos = faker.helpers.arrayElements(TIPOS_VEHICULO, Math.min(cantidad, TIPOS_VEHICULO.length));
  return tipos.map((tipo, i) => ({
    id: `veh-${personaId}-${i + 1}`,
    tipo,
    pasajeros: generarPasajeros(tipo),
    placa: generarPlaca(),
  }));
}

interface ContextoGeneracion {
  cedulas: Set<string>;
}

function generarBase(id: string, ctx: ContextoGeneracion): Omit<Persona, 'rol' | 'liderId' | 'padrinoId' | 'liderIds' | 'planilla' | 'registradoPor'> {
  const genero = faker.person.sexType();
  const nombres = faker.person.firstName(genero).split(' ')[0];
  const apellidos = `${faker.person.lastName().split(' ')[0]} ${faker.person.lastName().split(' ')[0]}`;
  const municipio = pesoAleatorio(MUNICIPIOS_RESIDENCIA).nombre;
  const comunas = comunasDeMunicipio(municipio);
  const comuna = pick(comunas).nombre;
  const barrio = pick(barriosDeComuna(municipio, comuna));

  const tieneDatosVotacion = Math.random() > 0.12; // ~12% sin datos de puesto/mesa
  let puesto: (typeof PUESTOS_VOTACION)[number] | undefined;
  let mesaVotacion: string | undefined;
  if (tieneDatosVotacion) {
    const dentroCircunscripcion = Math.random() > 0.12; // ~12% registrados fuera de la circunscripción
    const candidatos = dentroCircunscripcion
      ? PUESTOS_VOTACION.filter((p) => p.municipio === 'Valledupar')
      : PUESTOS_VOTACION.filter((p) => p.departamento === 'Cesar' && p.municipio !== 'Valledupar'); // municipios cercanos
    puesto = pick(candidatos.length ? candidatos : PUESTOS_VOTACION);
    mesaVotacion = pick(puesto.mesas).numero;
  }

  const conCaracterizacion = Math.random() > 0.68; // ~32% con caracterización adicional
  const { profesion, nivel: nivelFormacion } = pick(PROFESION_POR_NIVEL);
  const posgrado = nivelFormacion === 'Posgrado' ? pick(POSGRADOS.filter((p) => p !== 'Ninguno')) : 'Ninguno';

  const vehiculoDisponible = Math.random() > 0.85; // ~15% pone al menos un vehículo a disposición de la campaña
  const vehiculos: VehiculoCampania[] = vehiculoDisponible ? generarVehiculosCampania(id) : [];

  const fechaRegistro = faker.date.between({ from: '2026-01-15', to: '2026-09-10' }).toISOString().slice(0, 10);
  const validez: Persona['validez'] = puesto && puesto.municipio === 'Valledupar' ? 'Válido' : 'Inválido';
  // Solo tiene sentido para la campaña llevar el check de "ya votó" sobre simpatizantes Válidos
  // (los que votan en la circunscripción); se deja ~35% ya marcado para simular una jornada en curso.
  const voto = validez === 'Válido' && Math.random() < 0.35;

  return {
    id,
    nombres,
    apellidos,
    cedula: generarCedula(ctx.cedulas),
    telefono: generarTelefono(),
    correo: faker.internet.email({ firstName: nombres, lastName: apellidos.split(' ')[0] }).toLowerCase(),
    departamento: CESAR.nombre,
    municipio,
    comuna,
    barrio,
    dptoVotacion: puesto ? puesto.departamento : undefined,
    municVotacion: puesto ? puesto.municipio : undefined,
    puestoVotacionId: puesto?.id,
    puestoVotacion: puesto?.nombre,
    mesaVotacion,
    profesion,
    nivelFormacion,
    posgrado,
    gruposSociales: conCaracterizacion ? faker.helpers.arrayElements(GRUPOS_SOCIALES, { min: 1, max: 2 }) : [],
    gustosIntereses: conCaracterizacion ? faker.helpers.arrayElements(GUSTOS_INTERESES, { min: 1, max: 3 }) : [],
    ocupacion: conCaracterizacion ? pick(OCUPACIONES) : undefined,
    observaciones: undefined,
    vehiculoDisponible,
    vehiculos,
    rolDiaE: pick(ROLES_DIA_E),
    voto,
    nivel: Math.random() > 0.3 ? 'Firme' : 'Indeciso',
    validez,
    finalizado: Math.random() > 0.1,
    fechaRegistro,
    tieneGestiones: Math.random() > 0.75,
  };
}

function construirDataset(): Persona[] {
  const ctx: ContextoGeneracion = { cedulas: new Set() };
  const personas: Persona[] = [];
  let idx = 0;
  const nextId = () => `p-${String(++idx).padStart(4, '0')}`;

  // 0. El Candidato — raíz única de la estructura, todo el árbol cuelga de él.
  const candidato: Persona = {
    ...generarBase(nextId(), ctx),
    nombres: 'Leonardo',
    apellidos: 'Mestre',
    correo: 'leonardo.mestre@campana.co',
    rol: 'Candidato',
    liderIds: [],
    planilla: undefined,
    registradoPor: 'admin',
  };

  // 1. Padrinos (15) — todos reportan al Candidato
  const padrinos: Persona[] = Array.from({ length: 15 }, () => ({
    ...generarBase(nextId(), ctx),
    rol: 'Padrino',
    candidatoId: candidato.id,
    liderIds: [],
    planilla: undefined,
    registradoPor: 'admin',
  }));

  // 2. Líderes (60) — cada uno reporta a un padrino, o directamente al Candidato (~10%)
  const lideres: Persona[] = Array.from({ length: 60 }, (_, i) => {
    const reportaAlCandidato = Math.random() < 0.1;
    const padrinoId = reportaAlCandidato ? candidato.id : padrinos[i % padrinos.length].id;
    return {
      ...generarBase(nextId(), ctx),
      rol: 'Líder',
      padrinoId,
      planilla: generarPlanillaPorLider(i),
      registradoPor: 'admin',
    };
  });
  padrinos.forEach((padrino) => {
    padrino.liderIds = lideres.filter((l) => l.padrinoId === padrino.id).map((l) => l.id);
  });
  candidato.liderIds = lideres.filter((l) => l.padrinoId === candidato.id).map((l) => l.id);

  // 3. Gestores (15) — supervisan varios líderes, reportaron originalmente a un líder
  const gestores: Persona[] = Array.from({ length: 15 }, () => {
    const liderHistorico = pick(lideres);
    const supervisados = faker.helpers.arrayElements(lideres, { min: 2, max: 5 }).map((l) => l.id);
    return {
      ...generarBase(nextId(), ctx),
      rol: 'Gestor',
      liderId: liderHistorico.id,
      liderIds: supervisados,
      planilla: liderHistorico.planilla,
      registradoPor: 'admin',
    };
  });

  // 4. Digitadores (10) — reportaron originalmente a un líder
  const digitadores: Persona[] = Array.from({ length: 10 }, (_, i) => {
    const liderHistorico = lideres[i % lideres.length];
    return {
      ...generarBase(nextId(), ctx),
      rol: 'Digitador',
      liderId: liderHistorico.id,
      planilla: liderHistorico.planilla,
      registradoPor: 'admin',
    };
  });

  // 5. Simpatizantes (400) — cada uno asignado a un líder; capturado por admin o algún digitador
  const simpatizantesBase: Persona[] = Array.from({ length: 400 }, (_, i) => {
    const lider = pick(lideres);
    const capturador = i % 4 === 0 ? 'admin' : digitadores[i % digitadores.length].id;
    return {
      ...generarBase(nextId(), ctx),
      rol: 'Simpatizante',
      liderId: lider.id,
      planilla: lider.planilla,
      registradoPor: capturador,
    };
  });

  // 5b. Simpatizantes adicionales (150) registrados para votar en otro departamento — personas
  // nuevas (no una reasignación de las 400 anteriores) que nunca cambiaron su lugar de votación
  // al mudarse a Valledupar. Quedan "Inválidos" y sirven para mostrar ese escenario.
  const simpatizantesOtroDepartamento: Persona[] = Array.from({ length: 150 }, (_, i) => {
    const lider = pick(lideres);
    const capturador = i % 4 === 0 ? 'admin' : digitadores[i % digitadores.length].id;
    const puesto = pick(PUESTOS_OTRO_DEPARTAMENTO);
    return {
      ...generarBase(nextId(), ctx),
      rol: 'Simpatizante',
      liderId: lider.id,
      planilla: lider.planilla,
      registradoPor: capturador,
      dptoVotacion: puesto.departamento,
      municVotacion: puesto.municipio,
      puestoVotacionId: puesto.id,
      puestoVotacion: puesto.nombre,
      mesaVotacion: pick(puesto.mesas).numero,
      validez: 'Inválido',
      voto: false, // no vota en la circunscripción, no aplica el conteo del Día E
    };
  });

  // 5c. Simpatizantes de ejemplo (variable) — 3 líderes concretos se llevan a exactamente 30, 65
  // y 100 simpatizantes válidos, para poder ver poblados los rangos altos de votos en el dashboard.
  const LIDERES_EJEMPLO_VOTOS = [
    { indice: 0, votos: 30 },
    { indice: 1, votos: 65 },
    { indice: 2, votos: 100 },
  ];
  const puestosValledupar = PUESTOS_VOTACION.filter((p) => p.municipio === 'Valledupar');
  const simpatizantesEjemplo: Persona[] = [];
  LIDERES_EJEMPLO_VOTOS.forEach(({ indice, votos }) => {
    const lider = lideres[indice];
    const validosActuales = [...simpatizantesBase, ...simpatizantesOtroDepartamento].filter(
      (s) => s.liderId === lider.id && s.validez === 'Válido',
    ).length;
    const faltantes = Math.max(0, votos - validosActuales);
    for (let i = 0; i < faltantes; i++) {
      const puesto = pick(puestosValledupar);
      simpatizantesEjemplo.push({
        ...generarBase(nextId(), ctx),
        rol: 'Simpatizante',
        liderId: lider.id,
        planilla: lider.planilla,
        registradoPor: 'admin',
        dptoVotacion: puesto.departamento,
        municVotacion: puesto.municipio,
        puestoVotacionId: puesto.id,
        puestoVotacion: puesto.nombre,
        mesaVotacion: pick(puesto.mesas).numero,
        validez: 'Válido',
        voto: Math.random() < 0.35,
      });
    }
  });

  const simpatizantes: Persona[] = [...simpatizantesBase, ...simpatizantesOtroDepartamento, ...simpatizantesEjemplo];

  // Meta de simpatizantes válidos por líder — algunos la superan, otros se quedan cortos (a propósito).
  lideres.forEach((lider) => {
    const validosEnEquipo = simpatizantes.filter((s) => s.liderId === lider.id && s.validez === 'Válido').length;
    const factor = 0.7 + Math.random() * 0.6; // entre 70% y 130% de lo que ya tiene
    lider.metaSimpatizantes = Math.max(5, Math.round((validosEnEquipo * factor) / 5) * 5);
  });

  personas.push(candidato, ...padrinos, ...lideres, ...gestores, ...digitadores, ...simpatizantes);
  return personas;
}

export const PERSONAS: Persona[] = construirDataset();

export function personaPorId(id?: string): Persona | undefined {
  if (!id) return undefined;
  return PERSONAS.find((p) => p.id === id);
}

export function nombreCompleto(p: Persona): string {
  return `${p.nombres} ${p.apellidos}`;
}

/**
 * Superior jerárquico directo de una persona, sea cual sea su rol:
 * Simpatizante/Gestor/Digitador → su Líder; Líder → su Padrino (o el Candidato); Padrino → el Candidato.
 * El Candidato es la raíz y no tiene superior.
 */
export function superiorDe(p: Persona): Persona | undefined {
  if (p.rol === 'Líder') return personaPorId(p.padrinoId);
  if (p.rol === 'Padrino') return personaPorId(p.candidatoId);
  return personaPorId(p.liderId);
}

/** Próximo código de planilla disponible (para promociones a Líder, que estrenan planilla propia). */
export function siguientePlanilla(personas: Persona[]): string {
  const numeros = personas
    .map((p) => p.planilla)
    .filter((p): p is string => Boolean(p))
    .map((p) => Number(p.replace('PL-', '')))
    .filter((n) => !Number.isNaN(n));
  const siguiente = (numeros.length ? Math.max(...numeros) : 0) + 1;
  return `PL-${String(siguiente).padStart(5, '0')}`;
}

/** Meta inicial de simpatizantes válidos para un líder recién promovido. */
export const META_DEFECTO_LIDER = 20;
