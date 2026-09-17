import { createField } from "./dom.js";
import { icon } from "./icons.js";
import { escHtml } from "../utils/html.js";
import { categoryScaleMarkup } from "./chart.js";

/**
 * Configuración: solo lo que es de la cuenta.
 * Editar y eliminar mediciones vive en Historial, que es donde se buscan.
 */

const TABS = [
  { id: "profile", label: "Perfil", icon: "user" },
  { id: "security", label: "Seguridad", icon: "lock" },
  { id: "data", label: "Datos", icon: "download" }
];

export function renderSettingsHTML(profile, { recordCount = 0 } = {}) {
  const tabs = TABS.map(
    (tab, index) =>
      `<button class="settings-tab ${index === 0 ? "active" : ""}" data-tab="${tab.id}" type="button">${escHtml(tab.label)}</button>`
  ).join("");

  return `
    <section class="page-head">
      <div>
        <h1>Configuración</h1>
        <p class="helper">Tu perfil, tu contraseña y tus datos.</p>
      </div>
    </section>

    <div class="settings-section">
      <div class="settings-tabs" role="tablist">${tabs}</div>

      <!-- Perfil -->
      <div class="settings-panel active" id="panel-profile">
        <article class="card">
          <div class="card-head">
            <div>
              <h3>Datos personales</h3>
              <p class="helper">Así te identificamos dentro de la app.</p>
            </div>
          </div>

          <div id="msg-profile" class="message-bar" role="status" aria-live="polite"></div>

          <div class="form-grid columns-2">
            ${createField({ id: "p-firstName", label: "Nombre", value: profile.first_name ?? "", autocomplete: "given-name" })}
            ${createField({ id: "p-lastName", label: "Apellido", value: profile.last_name ?? "", autocomplete: "family-name" })}
            ${createField({ id: "p-age", label: "Edad", type: "number", min: "1", max: "120", value: profile.age ?? "", inputmode: "numeric" })}
            ${createField({ id: "p-document", label: "Documento", value: profile.document_number ?? "" })}
          </div>

          <div class="form-grid" style="margin-top:14px;">
            <div class="field">
              <label for="p-email">Correo electrónico</label>
              <input id="p-email" type="email" value="${escHtml(profile.email ?? "")}" disabled />
              <p class="field-hint">El correo de acceso no se puede cambiar desde aquí.</p>
            </div>
          </div>

          <div class="form-actions">
            <button id="save-profile" class="button" type="button">Guardar cambios</button>
          </div>
        </article>
      </div>

      <!-- Seguridad -->
      <div class="settings-panel" id="panel-security">
        <article class="card">
          <div class="card-head">
            <div>
              <h3>Cambiar contraseña</h3>
              <p class="helper">Debe tener al menos 6 caracteres.</p>
            </div>
          </div>

          <div id="msg-password" class="message-bar" role="status" aria-live="polite"></div>

          <div class="form-grid columns-2">
            ${createField({
              id: "p-newPass",
              label: "Nueva contraseña",
              type: "password",
              placeholder: "••••••••",
              hint: true,
              autocomplete: "new-password"
            })}
            ${createField({
              id: "p-confirmPass",
              label: "Confirmar contraseña",
              type: "password",
              placeholder: "••••••••",
              hint: true,
              autocomplete: "new-password"
            })}
          </div>

          <div class="form-actions">
            <button id="save-password" class="button" type="button">Actualizar contraseña</button>
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <div>
              <h3>Sesión</h3>
              <p class="helper">Cierra la sesión en este dispositivo.</p>
            </div>
          </div>
          <div class="setting-row">
            <div>
              <strong>Cerrar sesión</strong>
              <p class="helper">Tendrás que volver a entrar con tu correo y contraseña.</p>
            </div>
            <button class="ghost-button js-logout" type="button">${icon("logout", { size: 17 })} Cerrar sesión</button>
          </div>
        </article>
      </div>

      <!-- Datos -->
      <div class="settings-panel" id="panel-data">
        <article class="card">
          <div class="card-head">
            <div>
              <h3>Tus datos</h3>
              <p class="helper">Descarga todo tu historial cuando quieras.</p>
            </div>
          </div>

          <div id="msg-data" class="message-bar" role="status" aria-live="polite"></div>

          <div class="setting-row">
            <div>
              <strong>Exportar historial</strong>
              <p class="helper">
                ${recordCount} medición${recordCount === 1 ? "" : "es"} en formato CSV, compatible con Excel
                y con Google Sheets.
              </p>
            </div>
            <button id="export-csv" class="ghost-button" type="button">
              ${icon("download", { size: 17 })} Descargar CSV
            </button>
          </div>

          <div class="setting-row">
            <div>
              <strong>Editar o eliminar mediciones</strong>
              <p class="helper">Se hace desde el historial, donde puedes buscar la lectura exacta.</p>
            </div>
            <a href="history.html" class="ghost-button">Ir al historial ${icon("chevronRight", { size: 15 })}</a>
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <div>
              <h3>Cómo se clasifica tu tensión</h3>
              <p class="helper">Categorías de las guías ACC/AHA que usa la app.</p>
            </div>
          </div>
          ${categoryScaleMarkup()}
          <p class="helper" style="margin-top:14px;">
            Esta app es una herramienta de seguimiento personal y no sustituye un diagnóstico médico.
          </p>
        </article>
      </div>
    </div>
  `;
}
