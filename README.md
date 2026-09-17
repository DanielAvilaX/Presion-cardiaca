# Tensión — Control de tensión arterial

Aplicación web para registrar y visualizar tensión arterial y frecuencia cardíaca,
con clasificación clínica automática, estadísticas por periodo y autenticación
propia. Pensada como una herramienta simple para llevar un seguimiento personal
sin depender de una app de escritorio o una libreta física.

Se instala en el teléfono: al añadirla a la pantalla de inicio se abre a pantalla
completa, con su propio icono y sin la barra del navegador.

## Funcionalidades

- **Clasificación clínica automática** (ACC/AHA): Normal, Elevada, Hipertensión 1
  y 2, y Crisis — calculada en el frontend a partir de cada lectura.
- **Panel** con la última medición destacada, promedios del periodo, tendencia
  frente al periodo anterior y distribución por categoría.
- **Historial** completo con búsqueda, filtros por posición y categoría, orden
  por columna, paginación y edición o borrado de cualquier lectura.
- **Gráfica** SVG con bandas de referencia clínicas, cruceta, tooltip con todas
  las series, valores al final de cada línea y navegación por teclado.
- **Asistente de registro** paso a paso, con valores sugeridos, aviso clínico en
  vivo y avisos suaves cuando un valor es inusual.
- Exportación a CSV (compatible con Excel y Google Sheets), tema claro/oscuro y
  recuperación de contraseña.

## Diseño

La interfaz usa una paleta «clínica serena»: la marca es teal y el rojo, el
ámbar y el naranja quedan **reservados** para la categoría clínica de una
lectura, de modo que un color de alerta nunca compite con un color de interfaz.

En la gráfica hay solo dos identidades de color, validadas para daltonismo
(protanopia y deuteranopia) y contraste en ambos temas:

| Serie | Color | Rol |
|---|---|---|
| Sistólica / Diastólica | azul, dos pasos del mismo tono | una misma magnitud, con techo y piso |
| Frecuencia cardíaca | magenta | identidad aparte |

La navegación es una barra lateral en escritorio y una barra inferior de cuatro
pestañas en el teléfono, con respeto por las áreas seguras del iPhone.

## Stack técnico

JavaScript (módulos ES nativos, sin framework ni bundler) + Supabase
(autenticación y base de datos con Row Level Security) + Vercel.

## Estructura del proyecto

```text
.
├── index.html               # Acceso y panel principal
├── history.html             # Historial: buscar, filtrar, editar, eliminar
├── chart.html               # Gráfica de evolución ampliada
├── settings.html            # Perfil, seguridad y datos
├── manifest.webmanifest     # Instalación en pantalla de inicio (PWA)
├── sql/schema.sql           # Esquema, trigger y políticas RLS de Supabase
├── styles/                  # main.css (sistema de diseño) y chart.css
├── test/                    # Unit tests (node:test)
├── api/config.js            # Función serverless: sirve la config de Supabase
└── src/
    ├── app.js, historyApp.js, chartApp.js, settingsApp.js   # Puntos de entrada
    ├── config/              # Cliente de Supabase
    ├── repositories/        # Acceso a datos
    ├── services/            # Reglas de negocio y validaciones
    ├── controllers/         # Flujo y eventos de la interfaz
    ├── ui/                  # Vistas y componentes
    └── utils/               # Helpers puros y reutilizables
```

## Rangos de captura

Los límites de la app se alinean con los `CHECK` de la base de datos y con la
propia clasificación clínica:

| Medición | Rango aceptado | Rango habitual (solo avisa) |
|---|---|---|
| TA sistólica | 60 – 260 mmHg | 90 – 180 |
| TA diastólica | 30 – 200 mmHg | 50 – 110 |
| Frecuencia cardíaca | 25 – 250 lpm | 45 – 130 |

Fuera del rango habitual la app muestra un aviso, pero deja registrar el valor:
una crisis hipertensiva se define por una diastólica mayor a 120 y tiene que
poder guardarse.

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
npx vercel dev   # sirve también la función de api/
```

La app usa módulos ES, así que necesita servirse por HTTP (no abrir el HTML
directamente). `npm run serve` levanta un estático sin la función de `api/`, así
que no podrá conectarse a Supabase.

## Tests

Las funciones puras (clasificación clínica, estadísticas, validaciones, tabla y
exportación) se prueban con el runner nativo de Node:

```bash
npm test
```

## Desplegar

1. Importa el repositorio en Vercel.
2. Agrega `SUPABASE_URL` y `SUPABASE_ANON_KEY` en Environment Variables.
3. Ejecuta [`sql/schema.sql`](sql/schema.sql) en el SQL Editor de tu proyecto de
   Supabase (crea las tablas, RLS y el trigger que da de alta el perfil al
   registrarse).
4. En Supabase → Authentication → URL Configuration, añade la URL del despliegue
   a las *Redirect URLs* para que funcione la recuperación de contraseña.

Sin build step — Vercel lo sirve como sitio estático y detecta `api/` como
función serverless automáticamente.

## Aviso

Es una herramienta de seguimiento personal. No sustituye un diagnóstico ni el
criterio de un profesional de la salud.
