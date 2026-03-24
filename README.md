# Tension

Aplicacion web estatica para registrar tension arterial y frecuencia cardiaca por usuario, con autenticacion en Supabase y despliegue pensado para Vercel.

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
|-- index.html
|-- README.md
|-- sql/schema.sql
|-- styles/main.css
`-- src/
    |-- app.js
    |-- config/
    |-- controllers/
    |-- repositories/
    |-- services/
    |-- ui/
    `-- utils/
```

## Arquitectura por capas

- `config`: cliente de Supabase.
- `repositories`: acceso a datos.
- `services`: reglas de negocio y validaciones.
- `controllers`: flujo y eventos de la interfaz.
- `ui`: vistas y componentes.
- `utils`: helpers reutilizables.

## Funcionalidades

- Inicio de sesion con correo y contrasena.
- Registro con nombre, apellido, edad, documento, correo y contrasena con confirmaciones.
- Panel autenticado con tabla completa de registros.
- Estadisticas por 7 dias, 15 dias, 1 mes, 6 meses o rango personalizado.
- Modal wizard paso a paso para registrar fecha, hora, TA, FC, posicion y observaciones.
- Confirmacion final antes de guardar y actualizacion automatica del dashboard.

## SQL para Supabase

Ejecuta el contenido de [sql/schema.sql](/c:/Andres/Programacion/Tension/sql/schema.sql) en el SQL Editor de Supabase.

El script incluye un trigger que crea automaticamente el perfil en `user_profiles`
cuando un usuario se registra en `auth.users`, asi que el alta funciona incluso si
tienes confirmacion de correo activa en Supabase.

## Como ejecutar localmente

La app usa modulos ES, asi que debes abrirla con un servidor estatico.

```bash
npx serve .
```

O:

```bash
python -m http.server 3000
```

## Como desplegar en Vercel

1. Sube el proyecto a GitHub.
2. Importa el repositorio en Vercel.
3. Configura un proyecto estatico.
4. No necesitas build command.

## Configuracion importante en Supabase

1. Ejecuta `sql/schema.sql`.
2. Activa `Email` en `Authentication > Providers`.
3. Revisa [src/config/env.js](/c:/Andres/Programacion/Tension/src/config/env.js) si deseas cambiar credenciales.
