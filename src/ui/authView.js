import { createField } from "./dom.js";

export function createAuthView() {
  return `
    <section class="auth-layout">
      <article class="panel auth-info">
        <p class="eyebrow">Acceso seguro</p>
        <h2>Registra y consulta tu historial cardiovascular.</h2>
        <p class="hero-copy">
          Inicia sesion o crea tu cuenta para guardar tus mediciones, revisar tendencias
          y mantener un seguimiento organizado de tu tension arterial y frecuencia cardiaca.
        </p>
      </article>

      <article class="panel auth-card">
        <div class="tabs">
          <button class="tab-button active" data-auth-tab="login" type="button">Iniciar sesion</button>
          <button class="tab-button" data-auth-tab="register" type="button">Registrarse</button>
        </div>

        <section data-auth-panel="login">
          <h2>Bienvenido</h2>
          <p class="helper">Usa tu correo y contrasena para entrar al panel principal.</p>
          <form id="login-form" class="form-grid">
            ${createField({ id: "login-email", label: "Correo", type: "email", placeholder: "correo@ejemplo.com" })}
            ${createField({ id: "login-password", label: "Contrasena", type: "password", placeholder: "******" })}
            <button class="button" type="submit">Entrar</button>
            <p id="login-message" class="message"></p>
          </form>
        </section>

        <section data-auth-panel="register" class="hidden">
          <h2>Crea tu cuenta</h2>
          <p class="helper">Completa tus datos para activar el seguimiento personal.</p>
          <form id="register-form" class="form-grid columns-2">
            ${createField({ id: "register-first-name", label: "Nombre", placeholder: "Ana" })}
            ${createField({ id: "register-last-name", label: "Apellido", placeholder: "Perez" })}
            ${createField({ id: "register-age", label: "Edad", type: "number", min: "1", placeholder: "30" })}
            ${createField({ id: "register-document", label: "Documento", placeholder: "123456789" })}
            ${createField({ id: "register-email", label: "Correo", type: "email", placeholder: "correo@ejemplo.com" })}
            ${createField({ id: "register-confirm-email", label: "Confirmacion de correo", type: "email", placeholder: "correo@ejemplo.com" })}
            ${createField({ id: "register-password", label: "Contrasena", type: "password", placeholder: "******" })}
            ${createField({ id: "register-confirm-password", label: "Confirmacion de contrasena", type: "password", placeholder: "******" })}
            <div class="field" style="grid-column: 1 / -1;">
              <button class="button" type="submit">Crear cuenta</button>
            </div>
            <p id="register-message" class="message" style="grid-column: 1 / -1;"></p>
          </form>
        </section>
      </article>
    </section>
  `;
}
