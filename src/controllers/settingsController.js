import { profileRepository } from "../repositories/profileRepository.js";
import { recordRepository } from "../repositories/recordRepository.js";
import { supabase } from "../config/supabase.js";
import {
  renderSettingsHTML,
  renderRecordsTableHTML,
  renderEditFormHTML,
  renderDeleteModalHTML,
} from "../ui/settingsView.js";

export function createSettingsController({ root, modalRoot, currentUserId }) {
  // ── Utilidades ──────────────────────────────────────────────────────────────

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

  // ── Binding de eventos ──────────────────────────────────────────────────────

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
          email: profile.email,
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
        modalRoot.innerHTML = renderEditFormHTML(rec);

        modalRoot.querySelector("#ef-cancel")?.addEventListener("click", () => {
          modalRoot.innerHTML = "";
          editingId = null;
        });

        modalRoot.querySelector("#ef-save")?.addEventListener("click", async () => {
          const payload = {
            recordDate: modalRoot.querySelector("#ef-date").value,
            recordTime: modalRoot.querySelector("#ef-time").value,
            taSystolic: Number(modalRoot.querySelector("#ef-sys").value),
            taDiastolic: Number(modalRoot.querySelector("#ef-dia").value),
            heartRate: Number(modalRoot.querySelector("#ef-hr").value),
            position: modalRoot.querySelector("#ef-pos").value,
            observations: modalRoot.querySelector("#ef-obs").value,
          };

          const { taSystolic: systolic, taDiastolic: diastolic, heartRate: hr } = payload;

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
            await recordRepository.updateRecord(editingId, currentUserId, {
              record_date: payload.recordDate,
              record_time: payload.recordTime,
              ta_systolic: systolic,
              ta_diastolic: diastolic,
              heart_rate: hr,
              position: payload.position,
              observations: payload.observations?.trim() || null,
            });

            const idx = records.findIndex((r) => r.id === editingId);
            if (idx !== -1) {
              records[idx] = {
                ...records[idx],
                record_date: payload.recordDate,
                record_time: payload.recordTime,
                ta_systolic: systolic,
                ta_diastolic: diastolic,
                heart_rate: hr,
                position: payload.position,
                observations: payload.observations?.trim() || null,
              };
            }

            modalRoot.innerHTML = "";
            editingId = null;
            root.querySelector(".records-table-wrap").innerHTML = renderRecordsTableHTML(records);
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

        modalRoot.innerHTML = renderDeleteModalHTML(rec);

        modalRoot.querySelector("#del-cancel")?.addEventListener("click", () => {
          modalRoot.innerHTML = "";
        });

        modalRoot.querySelector("#del-confirm")?.addEventListener("click", async () => {
          try {
            await recordRepository.deleteRecord(id, currentUserId);
            modalRoot.innerHTML = "";

            const idx = records.findIndex((r) => r.id === id);
            if (idx !== -1) records.splice(idx, 1);

            root.querySelector(".records-table-wrap").innerHTML = renderRecordsTableHTML(records);
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

  // ── API pública ─────────────────────────────────────────────────────────────

  return {
    render(profile, records) {
      root.innerHTML = renderSettingsHTML(profile, records);
      bindTabEvents();
      bindProfileEvents(profile);
      bindPasswordEvents();
      bindRecordEvents(records);
    },
  };
}
