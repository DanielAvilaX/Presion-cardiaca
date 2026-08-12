# Tensión — Control de Tensión Arterial

Aplicación web para registrar y visualizar tensión arterial y frecuencia cardíaca,
con clasificación clínica automática, estadísticas por período y autenticación
propia. Pensada como una herramienta simple para llevar un seguimiento personal
sin depender de una app de escritorio o una libreta física.

## Funcionalidades

- Clasificación clínica automática (ACC/AHA): Normal, Elevada, Hipertensión 1 y 2,
  Crisis — calculada en el frontend a partir de cada lectura.
- Panel con historial de registros ordenable, filtrable y paginado.
- Estadísticas por 7 días, 15 días, 1 mes, 6 meses o rango personalizado, con
  promedios, tendencia frente al período anterior y distribución por categoría.
- Gráfica SVG con bandas de referencia clínicas, curvas suaves, tooltip
  (mouse y táctil) y animación de trazado.
- Modal guiado para registrar fecha, hora, tensión, frecuencia, posición y
  observaciones, con aviso clínico en vivo.
- Tema claro/oscuro, exportación de registros a CSV/Excel, y accesibilidad
  (foco visible, `aria-*`, respeto por `prefers-reduced-motion`).

## Stack técnico

JavaScript (módulos ES nativos, sin framework ni bundler) + Supabase
(autenticación y base de datos con Row Level Security) + Vercel.

La aplicación está organizada en capas simples:

- `config/` — cliente de Supabase.
- `repositories/` — acceso a datos.
- `services/` — reglas de negocio y validaciones (probadas con unit tests).
- `controllers/` — flujo y eventos de la interfaz.
- `ui/` — vistas y componentes.
- `utils/` — helpers puros y reutilizables.

## Credenciales y variables de entorno

La app nunca guarda credenciales de Supabase en el código: `src/config/supabase.js`
las obtiene en tiempo de ejecución desde una función serverless
([`api/config.js`](api/config.js)), que a su vez las lee de las variables de
entorno del proyecto en Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

La `anon key` de Supabase es pública por diseño (la seguridad real la dan las
políticas RLS del [esquema](sql/schema.sql)), pero mantenerla fuera del repo
facilita rotar de proyecto sin tocar código.

## Ejecutar en local

```bash
npm install
npm run serve   # o: npx serve .
```

La app usa módulos ES, así que necesita servirse por HTTP (no abrir el HTML
directamente). Para probar contra Supabase en local hace falta la función de
`api/`, lo más simple es correr `npx vercel dev` en su lugar.

## Tests

Las funciones puras (clasificación clínica, estadísticas, validaciones, etc.)
se prueban con el runner nativo de Node:

```bash
npm test
```

## Desplegar

1. Importa el repositorio en Vercel.
2. Agrega `SUPABASE_URL` y `SUPABASE_ANON_KEY` en Environment Variables.
3. Ejecuta [`sql/schema.sql`](sql/schema.sql) en el SQL Editor de tu proyecto
   de Supabase (crea las tablas, RLS y el trigger que da de alta el perfil al
   registrarse).

Sin build step — Vercel lo sirve como sitio estático y detecta `api/` como
función serverless automáticamente.
