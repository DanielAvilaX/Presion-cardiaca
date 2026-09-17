import { createField } from "./dom.js";
import { icon } from "./icons.js";

/**
 * Pantalla de acceso.
 *
 * En escritorio es una pantalla partida: a la izquierda qué es la app, a la
 * derecha el formulario. En móvil el panel lateral se oculta y queda solo el
 * formulario, que es lo único accionable.
 */

function sellingPoints() {
  const points = [
    ["gauge", "Clasificación clínica automática según las guías ACC/AHA."],
    ["chart", "Tendencias y promedios por periodo, sin hojas de cálculo."],
    ["shield", "Tus datos son privados: solo tú puedes verlos."]
  ];

  return points
    .map(([name, text]) => `<li>${icon(name, { size: 18 })}<span>${text}</span></li>`)
    .join("");
}

export function createAuthView() {
  return `
    <div class="auth-page">
      <aside class="auth-aside">
        <a class="brand" href="index.html">
          <img class="brand-mark" src="./assets/icon-192.png" width="32" height="32" alt="" /> Tensión
        </a>
        <div>
          <h1>Tu tensión arterial, con seguimiento claro.</h1>
          <p style="margin-top:12px;">
            Registra cada medición en segundos y observa cómo evoluciona tu presión
            arterial y tu frecuencia cardíaca a lo largo del tiempo.
          </p>
        </div>
        <ul class="auth-points">${sellingPoints()}</ul>
      </aside>

      <div class="auth-panel">
        <div class="auth-card">
          <div class="auth-mobile-brand">
            <a class="brand" href="index.html" style="padding:0;">
              <img class="brand-mark" src="./assets/icon-192.png" width="34" height="34" alt="" /> Tensión
            </a>
          </div>

          <div class="card">
            <div class="tabs" role="tablist">
              <button class="tab-button active" data-auth-tab="login" type="button" role="tab">Iniciar sesión</button>
              <button class="tab-button" data-auth-tab="register" type="button" role="tab">Crear cuenta</button>
            </div>

            <section data-auth-panel="login">
              <h2 style="margin-bottom:4px;">Bienvenido de nuevo</h2>
              <p class="helper" style="margin-bottom:18px;">Entra con tu correo y contraseña.</p>

              <form id="login-form" class="form-grid" novalidate>
                ${createField({
                  id: "login-email",
                  label: "Correo electrónico",
                  type: "email",
                  placeholder: "correo@ejemplo.com",
                  autocomplete: "email"
                })}
                ${createField({
                  id: "login-password",
                  label: "Contraseña",
                  type: "password",
                  placeholder: "••••••••",
                  autocomplete: "current-password"
                })}
                <button class="button button--block" type="submit">Entrar</button>
                <p id="login-message" class="message" role="status" aria-live="polite"></p>
              </form>

              <p style="margin-top:14px; text-align:center;">
                <button class="link-button" id="forgot-password" type="button">¿Olvidaste tu contraseña?</button>
              </p>
            </section>

            <section data-auth-panel="register" class="hidden">
              <h2 style="margin-bottom:4px;">Crea tu cuenta</h2>
              <p class="helper" style="margin-bottom:18px;">Solo necesitamos unos datos para empezar.</p>

              <form id="register-form" class="form-grid columns-2" novalidate>
                ${createField({ id: "register-first-name", label: "Nombre", placeholder: "Ana", autocomplete: "given-name" })}
                ${createField({ id: "register-last-name", label: "Apellido", placeholder: "Pérez", autocomplete: "family-name" })}
                ${createField({ id: "register-age", label: "Edad", type: "number", min: "1", max: "120", placeholder: "30", inputmode: "numeric" })}
                ${createField({ id: "register-document", label: "Documento", placeholder: "123456789" })}
                ${createField({
                  id: "register-email",
                  label: "Correo electrónico",
                  type: "email",
                  placeholder: "correo@ejemplo.com",
                  hint: true,
                  autocomplete: "email"
                })}
                ${createField({
                  id: "register-confirm-email",
                  label: "Confirma el correo",
                  type: "email",
                  placeholder: "correo@ejemplo.com",
                  hint: true
                })}
                ${createField({
                  id: "register-password",
                  label: "Contraseña",
                  type: "password",
                  placeholder: "Mínimo 6 caracteres",
                  hint: true,
                  autocomplete: "new-password"
                })}
                ${createField({
                  id: "register-confirm-password",
                  label: "Confirma la contraseña",
                  type: "password",
                  placeholder: "••••••••",
                  hint: true,
                  autocomplete: "new-password"
                })}
                <div style="grid-column: 1 / -1; display:grid; gap:10px;">
                  <button class="button button--block" type="submit">Crear cuenta</button>
                  <p id="register-message" class="message" role="status" aria-live="polite"></p>
                </div>
              </form>
            </section>

            <section data-auth-panel="reset" class="hidden">
              <h2 style="margin-bottom:4px;">Recuperar contraseña</h2>
              <p class="helper" style="margin-bottom:18px;">
                Te enviamos un enlace a tu correo para que elijas una contraseña nueva.
              </p>

              <form id="reset-form" class="form-grid" novalidate>
                ${createField({
                  id: "reset-email",
                  label: "Correo electrónico",
                  type: "email",
                  placeholder: "correo@ejemplo.com",
                  autocomplete: "email"
                })}
                <button class="button button--block" type="submit">Enviar enlace</button>
                <p id="reset-message" class="message" role="status" aria-live="polite"></p>
              </form>

              <p style="margin-top:14px; text-align:center;">
                <button class="link-button" id="back-to-login" type="button">Volver a iniciar sesión</button>
              </p>
            </section>
          </div>

          <p style="margin-top:16px; text-align:center;">
            <button class="icon-button js-theme-toggle" type="button"></button>
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Pantalla para fijar la contraseña nueva, tras abrir el enlace de
 * recuperación que envía Supabase (evento PASSWORD_RECOVERY).
 */
export function createPasswordRecoveryView() {
  return `
    <div class="auth-page">
      <div class="auth-panel" style="grid-column: 1 / -1;">
        <div class="auth-card">
          <div class="card">
            <h2 style="margin-bottom:4px;">Elige una contraseña nueva</h2>
            <p class="helper" style="margin-bottom:18px;">Debe tener al menos 6 caracteres.</p>

            <form id="recovery-form" class="form-grid" novalidate>
              ${createField({
                id: "recovery-password",
                label: "Nueva contraseña",
                type: "password",
                placeholder: "••••••••",
                autocomplete: "new-password"
              })}
              ${createField({
                id: "recovery-confirm",
                label: "Confirma la contraseña",
                type: "password",
                placeholder: "••••••••",
                autocomplete: "new-password"
              })}
              <button class="button button--block" type="submit">Guardar contraseña</button>
              <p id="recovery-message" class="message" role="status" aria-live="polite"></p>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}
