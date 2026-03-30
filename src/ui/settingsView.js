import { formatDisplayDate } from "../utils/date.js";
import { escHtml } from "../utils/html.js";

export function renderSettingsHTML(profile, records) {
  return `
    <div class="settings-section">
      <div class="settings-tabs">
        <button class="settings-tab active" data-tab="profile">Perfil</button>
        <button class="settings-tab" data-tab="password">Contrasena</button>
        <button class="settings-tab" data-tab="records">Registros</button>
      </div>

      <!-- Perfil -->
      <div class="settings-panel active" id="panel-profile">
        <article class="card">
          <h3>Editar perfil</h3>
          <p class="helper">Modifica tus datos personales.</p>
          <div id="msg-profile" class="message-bar"></div>
          <div class="form-grid" style="margin-top:16px;">
            <div class="form-grid columns-2">
              <div class="field">
                <label for="p-firstName">Nombre</label>
                <input id="p-firstName" type="text" value="${escHtml(profile.first_name)}" />
              </div>
              <div class="field">
                <label for="p-lastName">Apellido</label>
                <input id="p-lastName" type="text" value="${escHtml(profile.last_name)}" />
              </div>
            </div>
            <div class="form-grid columns-2">
              <div class="field">
                <label for="p-age">Edad</label>
                <input id="p-age" type="number" min="1" max="120" value="${profile.age}" />
              </div>
              <div class="field">
                <label for="p-document">Documento</label>
                <input id="p-document" type="text" value="${escHtml(profile.document_number)}" />
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button id="save-profile" class="button" type="button">Guardar cambios</button>
          </div>
        </article>
      </div>

      <!-- Contrasena -->
      <div class="settings-panel" id="panel-password">
        <article class="card">
          <h3>Cambiar contrasena</h3>
          <p class="helper">La nueva contrasena debe tener al menos 6 caracteres.</p>
          <div id="msg-password" class="message-bar"></div>
          <div class="form-grid" style="margin-top:16px;">
            <div class="field">
              <label for="p-newPass">Nueva contrasena</label>
              <input id="p-newPass" type="password" placeholder="••••••••" />
            </div>
            <div class="field">
              <label for="p-confirmPass">Confirmar contrasena</label>
              <input id="p-confirmPass" type="password" placeholder="••••••••" />
            </div>
          </div>
          <div class="form-actions">
            <button id="save-password" class="button" type="button">Actualizar contrasena</button>
          </div>
        </article>
      </div>

      <!-- Registros -->
      <div class="settings-panel" id="panel-records">
        <article class="card">
          <h3>Mis registros</h3>
          <p class="helper">Edita o elimina cualquier registro existente.</p>
          <div id="msg-records" class="message-bar"></div>
          <div class="records-table-wrap" style="margin-top:16px;">
            ${renderRecordsTableHTML(records)}
          </div>
          <div id="edit-form-container"></div>
        </article>
      </div>
    </div>
  `;
}

export function renderRecordsTableHTML(records) {
  if (!records.length) {
    return `<div class="empty-state">No tienes registros aun.</div>`;
  }

  const rows = records
    .map(
      (rec) => `
      <tr>
        <td>${formatDisplayDate(rec.record_date)}</td>
        <td>${rec.record_time.slice(0, 5)}</td>
        <td>${rec.ta_systolic}/${rec.ta_diastolic}</td>
        <td>${rec.heart_rate}</td>
        <td>${escHtml(rec.position)}</td>
        <td>${rec.observations ? escHtml(rec.observations) : "-"}</td>
        <td style="white-space:nowrap;">
          <button class="ghost-button btn-edit-rec" data-id="${rec.id}" style="padding:8px 14px; font-size:0.85rem;" type="button">Editar</button>
          <button class="danger-button btn-del-rec" data-id="${rec.id}" style="padding:8px 14px; font-size:0.85rem;" type="button">Eliminar</button>
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <table>
      <thead>
        <tr>
          <th>Fecha</th><th>Hora</th><th>TA</th><th>FC</th><th>Posicion</th><th>Observaciones</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function renderEditFormHTML(rec) {
  return `
    <div class="edit-record-form open" id="edit-form-${rec.id}">
      <h4 style="margin:0;">Editando registro del ${formatDisplayDate(rec.record_date)}</h4>
      <div class="inline-grid-2">
        <div class="field">
          <label for="ef-date">Fecha</label>
          <input id="ef-date" type="date" value="${rec.record_date}" />
        </div>
        <div class="field">
          <label for="ef-time">Hora</label>
          <input id="ef-time" type="time" value="${rec.record_time.slice(0, 5)}" />
        </div>
      </div>
      <div class="inline-grid-2">
        <div class="field">
          <label for="ef-sys">TA Sistolica (mmHg)</label>
          <input id="ef-sys" type="number" min="1" max="200" value="${rec.ta_systolic}" />
        </div>
        <div class="field">
          <label for="ef-dia">TA Diastolica (mmHg)</label>
          <input id="ef-dia" type="number" min="1" max="120" value="${rec.ta_diastolic}" />
        </div>
      </div>
      <div class="inline-grid-2">
        <div class="field">
          <label for="ef-hr">Frecuencia Cardiaca (lpm)</label>
          <input id="ef-hr" type="number" min="1" max="120" value="${rec.heart_rate}" />
        </div>
        <div class="field">
          <label for="ef-pos">Posicion</label>
          <select id="ef-pos">
            <option ${rec.position === "Sentado" ? "selected" : ""}>Sentado</option>
            <option ${rec.position === "Acostado" ? "selected" : ""}>Acostado</option>
            <option ${rec.position === "De pie" ? "selected" : ""}>De pie</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="ef-obs">Observaciones</label>
        <textarea id="ef-obs" placeholder="Opcional">${rec.observations ?? ""}</textarea>
      </div>
      <div class="form-actions">
        <button id="ef-cancel" class="ghost-button" type="button">Cancelar</button>
        <button id="ef-save" class="button" type="button">Guardar cambios</button>
      </div>
    </div>
  `;
}

export function renderDeleteModalHTML(rec) {
  return `
    <div class="confirm-delete-overlay">
      <div class="confirm-delete-card">
        <h3>Eliminar registro</h3>
        <p>Esta seguro de que deseas eliminar el registro del <strong>${formatDisplayDate(rec.record_date)}</strong> a las <strong>${rec.record_time.slice(0, 5)}</strong>? Esta accion no se puede deshacer.</p>
        <div class="confirm-delete-actions">
          <button id="del-cancel" class="ghost-button" type="button">Cancelar</button>
          <button id="del-confirm" class="danger-button" type="button">Eliminar</button>
        </div>
      </div>
    </div>
  `;
}
