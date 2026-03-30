import { authRepository } from "./repositories/authRepository.js";
import { profileRepository } from "./repositories/profileRepository.js";
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
    const session = await authRepository.getSession();

    if (!session?.user) {
      window.location.href = "index.html";
      return;
    }

    const [profile, records] = await Promise.all([
      profileRepository.getProfileByUserId(session.user.id),
      recordRepository.getRecordsByUserId(session.user.id),
    ]);

    const controller = createSettingsController({ root, modalRoot });
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
