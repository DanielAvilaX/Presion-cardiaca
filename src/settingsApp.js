import { authRepository } from "./repositories/authRepository.js";
import { profileRepository } from "./repositories/profileRepository.js";
import { recordRepository } from "./repositories/recordRepository.js";
import { supabase } from "./config/supabase.js";
import { formatDisplayDate } from "./utils/date.js";

const root = document.querySelector("#settings-app");
const modalRoot = document.querySelector("#modal-root");

function renderError(msg) {
  root.innerHTML = `
    <section class="panel auth-card">
      <h2>No se pudo cargar la configuracion</h2>
      <p class="message error">${msg ?? "Error desconocido"}</p>
      <p class="helper">Intenta <a href="index.html">volver al panel</a>.</p>
    </section>
  `;
}

function showMessageBar(containerId, type, text) {
  const bar = document.querySelector(`#${containerId}`);
  if (!bar) return;
  bar.className = `message-bar ${type}`;
  bar.textContent = text;
  setTimeout(() => {
    bar.className = "message-bar";
    bar.textContent = "";
  }, 4000);
}

// ── Renderizado de pestanas ───────────────────────────────────────────────────

function renderSettings(profile, records) {
  root.innerHTML = `
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
            ${renderRecordsTable(records)}
          </div>
          <div id="edit-form-container"></div>
        </article>
      </div>
    </div>
  `;

  bindTabEvents();
  bindProfileEvents(profile);
  bindPasswordEvents();
  bindRecordEvents(records);
}

function renderRecordsTable(records) {
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

// ── Eventos ───────────────────────────────────────────────────────────────────

function bindTabEvents() {
  root.querySelectorAll(".settings-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".settings-tab").forEach((b) => b.classList.remove("active"));
      root.querySelectorAll(".settings-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      root.querySelector(`#panel-${btn.dataset.tab}`)?.classList.add("active");
    });
  });
}

function bindProfileEvents(profile) {
  root.querySelector("#save-profile")?.addEventListener("click", async () => {
    const firstName = root.querySelector("#p-firstName").value.trim();
    const lastName = root.querySelector("#p-lastName").value.trim();
    const age = Number(root.querySelector("#p-age").value);
    const document_number = root.querySelector("#p-document").value.trim();

    if (!firstName || !lastName || !document_number || age < 1) {
      showMessageBar("msg-profile", "error", "Completa todos los campos correctamente.");
      return;
    }

    try {
      await profileRepository.upsertProfile({
        id: profile.id,
        first_name: firstName,
        last_name: lastName,
        age,
        document_number,
        email: profile.email
      });
      showMessageBar("msg-profile", "success", "Perfil actualizado correctamente.");
    } catch (err) {
      showMessageBar("msg-profile", "error", err.message);
    }
  });
}

function bindPasswordEvents() {
  root.querySelector("#save-password")?.addEventListener("click", async () => {
    const newPass = root.querySelector("#p-newPass").value;
    const confirmPass = root.querySelector("#p-confirmPass").value;

    if (newPass.length < 6) {
      showMessageBar("msg-password", "error", "La contrasena debe tener al menos 6 caracteres.");
      return;
    }

    if (newPass !== confirmPass) {
      showMessageBar("msg-password", "error", "Las contrasenas no coinciden.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      root.querySelector("#p-newPass").value = "";
      root.querySelector("#p-confirmPass").value = "";
      showMessageBar("msg-password", "success", "Contrasena actualizada correctamente.");
    } catch (err) {
      showMessageBar("msg-password", "error", err.message);
    }
  });
}

function bindRecordEvents(records) {
  let editingId = null;

  root.querySelectorAll(".btn-edit-rec").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const rec = records.find((r) => r.id === id);
      if (!rec) return;

      editingId = id;
      const container = root.querySelector("#edit-form-container");
      container.innerHTML = `
        <div class="edit-record-form open" id="edit-form-${id}">
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

      container.querySelector("#ef-cancel")?.addEventListener("click", () => {
        container.innerHTML = "";
        editingId = null;
      });

      container.querySelector("#ef-save")?.addEventListener("click", async () => {
        const payload = {
          recordDate: container.querySelector("#ef-date").value,
          recordTime: container.querySelector("#ef-time").value,
          taSystolic: Number(container.querySelector("#ef-sys").value),
          taDiastolic: Number(container.querySelector("#ef-dia").value),
          heartRate: Number(container.querySelector("#ef-hr").value),
          position: container.querySelector("#ef-pos").value,
          observations: container.querySelector("#ef-obs").value
        };

        const systolic = payload.taSystolic;
        const diastolic = payload.taDiastolic;
        const hr = payload.heartRate;

        if (!payload.recordDate || !payload.recordTime) {
          showMessageBar("msg-records", "error", "Fecha y hora son obligatorias.");
          return;
        }
        if (systolic <= 0 || systolic > 200) {
          showMessageBar("msg-records", "error", "TA Sistolica fuera de rango (1-200).");
          return;
        }
        if (diastolic <= 0 || diastolic > 120 || diastolic >= systolic) {
          showMessageBar("msg-records", "error", "TA Diastolica invalida (1-120, menor que sistolica).");
          return;
        }
        if (hr <= 0 || hr > 120) {
          showMessageBar("msg-records", "error", "FC fuera de rango (1-120).");
          return;
        }

        try {
          await recordRepository.updateRecord(editingId, {
            record_date: payload.recordDate,
            record_time: payload.recordTime,
            ta_systolic: systolic,
            ta_diastolic: diastolic,
            heart_rate: hr,
            position: payload.position,
            observations: payload.observations?.trim() || null
          });

          // Actualizar el registro en memoria y re-renderizar tabla
          const idx = records.findIndex((r) => r.id === editingId);
          if (idx !== -1) {
            records[idx] = { ...records[idx], ...{
              record_date: payload.recordDate,
              record_time: payload.recordTime,
              ta_systolic: systolic,
              ta_diastolic: diastolic,
              heart_rate: hr,
              position: payload.position,
              observations: payload.observations?.trim() || null
            }};
          }

          container.innerHTML = "";
          editingId = null;
          root.querySelector(".records-table-wrap").innerHTML = renderRecordsTable(records);
          bindRecordEvents(records);
          showMessageBar("msg-records", "success", "Registro actualizado correctamente.");
        } catch (err) {
          showMessageBar("msg-records", "error", err.message);
        }
      });
    });
  });

  root.querySelectorAll(".btn-del-rec").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const rec = records.find((r) => r.id === id);
      if (!rec) return;

      // Modal de confirmacion
      modalRoot.innerHTML = `
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

      modalRoot.querySelector("#del-cancel")?.addEventListener("click", () => {
        modalRoot.innerHTML = "";
      });

      modalRoot.querySelector("#del-confirm")?.addEventListener("click", async () => {
        try {
          await recordRepository.deleteRecord(id);
          modalRoot.innerHTML = "";

          const idx = records.findIndex((r) => r.id === id);
          if (idx !== -1) records.splice(idx, 1);

          root.querySelector(".records-table-wrap").innerHTML = renderRecordsTable(records);
          root.querySelector("#edit-form-container").innerHTML = "";
          bindRecordEvents(records);
          showMessageBar("msg-records", "success", "Registro eliminado correctamente.");
        } catch (err) {
          modalRoot.innerHTML = "";
          showMessageBar("msg-records", "error", err.message);
        }
      });
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Inicio ────────────────────────────────────────────────────────────────────

(async () => {
  try {
    const session = await authRepository.getSession();

    if (!session?.user) {
      window.location.href = "index.html";
      return;
    }

    const [profile, records] = await Promise.all([
      profileRepository.getProfileByUserId(session.user.id),
      recordRepository.getRecordsByUserId(session.user.id)
    ]);

    renderSettings(profile, records);

    // Activar la pestana indicada en el URL (?tab=records, ?tab=password, ?tab=profile)
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam) {
      const tabBtn = root.querySelector(`[data-tab="${tabParam}"]`);
      if (tabBtn) tabBtn.click();
    }
  } catch (err) {
    renderError(err.message);
  }
})();
