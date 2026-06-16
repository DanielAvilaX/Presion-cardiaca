# Tension

Aplicacion web estatica para registrar y visualizar tension arterial y frecuencia cardiaca por usuario, con clasificacion clinica automatica, autenticacion en Supabase y despliegue pensado para Vercel.

## Credenciales de Supabase

Puedes reutilizar las credenciales publicas que ya tienes.

- `Project URL`: se usa para conectar con tu proyecto.
- `Publishable Key` o `Anon Public Key`: ambas son seguras para frontend. Aqui se usa la `Publishable Key`.

Credenciales configuradas actualmente:

- `Project URL`: `https://gkwlwjjvoaohytgomwje.supabase.co`
- `Publishable Key`: `sb_publishable_dMcKGAoZd48Gs2gd_gIcrA_VhUVgnoo`

No uses `service_role` en el navegador. Solo genera nuevas credenciales si quieres rotarlas o separar ambientes.

## Estructura del proyecto

```text
.
|-- index.html              # Panel principal
|-- chart.html              # Grafica de evolucion ampliada
|-- settings.html           # Configuracion (perfil, contrasena, registros)
|-- package.json            # Scripts de test y servidor estatico
|-- assets/favicon.svg
|-- sql/schema.sql          # Esquema, trigger y politicas RLS de Supabase
|-- styles/                 # main.css, chart.css, settings.css
|-- test/                   # Unit tests (node:test)
`-- src/
    |-- app.js, chartApp.js, settingsApp.js   # Puntos de entrada
    |-- config/             # Cliente de Supabase
    |-- repositories/       # Acceso a datos
    |-- services/           # Reglas de negocio y validaciones
    |-- controllers/        # Flujo y eventos de la interfaz
    |-- ui/                 # Vistas y componentes (views, chart, icons, components, topbar)
    `-- utils/              # Helpers: date, html, validation, stats, bpClassification, recordsTable, theme, storage, animations
```

## Arquitectura por capas

- `config`: cliente de Supabase.
- `repositories`: acceso a datos.
- `services`: reglas de negocio y validaciones.
- `controllers`: flujo y eventos de la interfaz.
- `ui`: vistas y componentes.
- `utils`: helpers reutilizables y funciones puras (probadas con unit tests).

## Funcionalidades

- Inicio de sesion con correo y contrasena, con validacion en vivo y mostrar/ocultar contrasena.
- Registro con nombre, apellido, edad, documento, correo y contrasena con confirmaciones.
- Panel autenticado con tabla de registros ordenable, filtrable y paginada.
- Clasificacion clinica automatica (ACC/AHA): Normal, Elevada, Hipertension 1 y 2, Crisis; derivada en el frontend sin tocar la base de datos.
- Tarjeta de ultima medicion, promedios con tendencia frente al periodo anterior y sparklines.
- Distribucion de lecturas por categoria e insight textual del periodo.
- Estadisticas por 7 dias, 15 dias, 1 mes, 6 meses o rango personalizado (con chips de seleccion y memoria del ultimo rango).
- Grafica SVG con bandas de referencia clinicas, areas, curvas suaves, leyenda interactiva, tooltip (raton y tactil) y animacion de trazado.
- Modal wizard paso a paso para registrar fecha, hora, TA, FC, posicion y observaciones, con aviso clinico en vivo y confirmacion final.
- Tema claro/oscuro con persistencia, accesibilidad (foco visible, `aria-*`, cierre con Esc/clic fuera) y respeto por `prefers-reduced-motion`.
- Exportacion de registros a CSV/Excel.

## Unit tests

Las funciones puras (`bpClassification`, `stats`, `recordsTable`, `date`, `html`, `validation`) se prueban con el runner nativo de Node, sin dependencias.

```bash
npm test
# o directamente
node --test
```

## Como ejecutar localmente

La app usa modulos ES, asi que debes abrirla con un servidor estatico.

```bash
npm run serve
# o
npx serve .
# o
python -m http.server 3000
```

## Como desplegar en Vercel

1. Sube el proyecto a GitHub.
2. Importa el repositorio en Vercel.
3. Configura un proyecto estatico.
4. No necesitas build command.

## SQL para Supabase

Ejecuta el contenido de [sql/schema.sql](sql/schema.sql) en el SQL Editor de Supabase.

El script incluye un trigger que crea automaticamente el perfil en `user_profiles`
cuando un usuario se registra en `auth.users`, asi que el alta funciona incluso si
tienes confirmacion de correo activa en Supabase.

## Configuracion importante en Supabase

1. Ejecuta `sql/schema.sql`.
2. Activa `Email` en `Authentication > Providers`.
3. Revisa [src/config/env.js](src/config/env.js) si deseas cambiar credenciales.
