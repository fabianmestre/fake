// Fecha de la jornada electoral (Día E) — ajustar cuando la campaña confirme la fecha real.
// El check de "¿ya votó?" solo se puede marcar ese día, para evitar registros anticipados o tardíos.
export const FECHA_DIA_E = '2026-09-15';

function fechaLocalISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function esDiaE(): boolean {
  return fechaLocalISO(new Date()) === FECHA_DIA_E;
}

export function fechaDiaEFormateada(): string {
  const [anio, mes, dia] = FECHA_DIA_E.split('-');
  return `${dia}/${mes}/${anio}`;
}
