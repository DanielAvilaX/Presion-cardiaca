import { authService } from "./services/authService.js";
import { recordRepository } from "./repositories/recordRepository.js";
import { createSettingsController } from "./controllers/settingsController.js";

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

(async () => {
  try {
    const userData = await authService.loadCurrentUser();

    if (!userData?.user) {
      window.location.href = "index.html";
      return;
    }

    const [profile, records] = await Promise.all([
      Promise.resolve(userData.profile),
      recordRepository.getRecordsByUserId(userData.user.id),
    ]);

    const controller = createSettingsController({ root, modalRoot, currentUserId: userData.user.id });
    controller.render(profile, records);

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
