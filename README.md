# Concejo Valledupar · CRM Electoral (simulación)

Simulación de front-end (React + Vite + TypeScript + Tailwind) de una plataforma CRM electoral para
una campaña al Concejo de Valledupar (Cesar, Colombia). Datos e identidades 100% ficticios.

## Dónde vive el proyecto

**El código fuente vive en dos lugares:**

- `C:\Users\Lenovo\dev\plataforma` — copia de trabajo local. Aquí se corre `npm install` y `npm run dev`.
- `G:\My Drive\LEO\plataforma` — copia sincronizada por Google Drive, solo para respaldo/consulta.

Google Drive bloquea archivos mientras `npm` escribe en `node_modules`, lo que corrompe la instalación.
Por eso el desarrollo activo ocurre en la copia local (`C:\Users\Lenovo\dev\plataforma`) y el código
fuente (sin `node_modules` ni `dist`) se copia periódicamente de vuelta a Drive. **No corras `npm install`
dentro de la carpeta de Drive.**

## Cómo correr la simulación

```bash
cd C:\Users\Lenovo\dev\plataforma
npm install
npm run dev
```

Abre `http://localhost:5173`. En el login usa cualquiera de los usuarios de prueba listados (clave: `1234`).

## Qué incluye esta iteración

- Login simulado con usuarios de prueba por rol (admin, padrino, líder, gestor, digitador).
- Sidebar reestructurado: Dashboard, Roles (Padrino/Líder/Simpatizante/Gestor/Digitador), Gestiones,
  Comunicaciones, Día-E, Mapa de Talento.
- Módulo **Roles → Simpatizante** completo: Dashboard analítico (~16 métricas/gráficas) y Directorio
  (tabla con 14 columnas, filtros de residencia y de puesto de votación, paginación de 50, modal
  "Nuevo Simpatizante").
- ~500 personas simuladas (nombres en español, geografía de Valledupar/Cesar, catálogo de puestos y
  mesas de votación).
- Permisos por rol: alcance de datos, edición de campos básicos vs. no básicos, eliminación restringida.

Las demás secciones del sidebar (Padrino, Líder, Gestor, Digitador, Gestiones, Comunicaciones, Día-E,
Mapa de Talento) están como placeholders "Próximamente" — se detallarán en próximas iteraciones.
