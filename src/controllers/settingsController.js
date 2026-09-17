import { profileRepository } from "../repositories/profileRepository.js";
import { authService } from "../services/authService.js";
import { renderSettingsHTML } from "../ui/settingsView.js";
import { bindPasswordToggles } from "../ui/dom.js";
import { exportRecords } from "../utils/export.js";

export function createSettingsController({ root, currentUserId }) {
  let records = [];

  function showMessage(containerId, type, text) {
    const bar = root.querySelector(`#${containerId}`);
    if (!bar) return;

    bar.className = `message-bar ${type}`;
    bar.textContent = text;
    setTimeout(() => {
      bar.className = "message-bar";
      bar.textContent = "";
    }, 4000);
  }

  function bindTabs() {
    root.querySelectorAll(".settings-tab").forEach((button) => {
      button.addEventListener("click", () => {
        root.querySelectorAll(".settings-tab").forEach((tab) => tab.classList.remove("active"));
        root.querySelectorAll(".settings-panel").forEach((panel) => panel.classList.remove("active"));
        button.classList.add("active");
        root.querySelector(`#panel-${button.dataset.tab}`)?.classList.add("active");
      });
    });
  }

  function bindProfile(profile) {
    root.querySelector("#save-profile")?.addEventListener("click", async () => {
      const firstName = root.querySelector("#p-firstName").value.trim();
      const lastName = root.querySelector("#p-lastName").value.trim();
      const age = Number(root.querySelector("#p-age").value);
      const documentNumber = root.querySelector("#p-document").value.trim();

      if (!firstName || !lastName || !documentNumber) {
        showMessage("msg-profile", "error", "Nombre, apellido y documento son obligatorios.");
        return;
      }

      if (!Number.isFinite(age) || age < 1 || age > 120) {
        showMessage("msg-profile", "error", "La edad debe estar entre 1 y 120 años.");
        return;
      }

      try {
        await profileRepository.upsertProfile({
          id: profile.id,
          first_name: firstName,
          last_name: lastName,
          age,
          document_number: documentNumber,
          email: profile.email
        });
        showMessage("msg-profile", "success", "Perfil actualizado.");
      } catch (error) {
        showMessage("msg-profile", "error", error.message);
      }
    });
  }

  function bindPassword() {
    root.querySelector("#save-password")?.addEventListener("click", async () => {
      const newPassword = root.querySelector("#p-newPass");
      const confirmPassword = root.querySelector("#p-confirmPass");

      try {
        await authService.updatePassword(newPassword.value, confirmPassword.value);
        newPassword.value = "";
        confirmPassword.value = "";
        showMessage("msg-password", "success", "Contraseña actualizada.");
      } catch (error) {
        showMessage("msg-password", "error", error.message);
      }
    });
  }

  function bindData() {
    root.querySelector("#export-csv")?.addEventListener("click", () => {
      if (!records.length) {
        showMessage("msg-data", "error", "Todavía no tienes mediciones que exportar.");
        return;
      }

      exportRecords(records);
      showMessage("msg-data", "success", `Se descargaron ${records.length} mediciones.`);
    });
  }

  return {
    render(profile, userRecords) {
      records = userRecords;
      root.innerHTML = renderSettingsHTML(profile, { recordCount: records.length });

      bindTabs();
      bindProfile(profile);
      bindPassword();
      bindData();
      bindPasswordToggles(root);
    },

    /** Activa una pestaña por su id (para enlaces con ?tab=). */
    activateTab(tabId) {
      root.querySelector(`.settings-tab[data-tab="${tabId}"]`)?.click();
    }
  };
}
