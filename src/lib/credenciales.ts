// Genera credenciales de acceso simuladas al promover a alguien a Líder/Gestor/Digitador.
// Se excluyen caracteres visualmente confundibles (0/O, 1/l/I) para que la contraseña sea
// legible cuando el admin la transcribe o la dicta por teléfono.
const CARACTERES_CLAVE = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&';

export function generarClave(longitud = 15): string {
  let clave = '';
  for (let i = 0; i < longitud; i++) {
    clave += CARACTERES_CLAVE[Math.floor(Math.random() * CARACTERES_CLAVE.length)];
  }
  return clave;
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

/** nombre.apellido — si ya existe, agrega un número (nombre.apellido2, nombre.apellido3...). */
export function generarNombreUsuario(nombres: string, apellidos: string, existentes: string[]): string {
  const base = `${normalizar(nombres.split(' ')[0])}.${normalizar(apellidos.split(' ')[0])}`;
  const enUso = new Set(existentes);
  if (!enUso.has(base)) return base;
  let n = 2;
  while (enUso.has(`${base}${n}`)) n++;
  return `${base}${n}`;
}
