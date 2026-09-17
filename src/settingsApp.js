import { authService } from "./services/authService.js";
import { recordService } from "./services/recordService.js";
import { createSettingsController } from "./controllers/settingsController.js";
import { mountShell } from "./ui/appShell.js";
import { escHtml } from "./utils/html.js";

const root = document.querySelector("#root");
const modalRoot = document.querySelector("#modal-root");

// Los enlaces antiguos apuntaban a ?tab=records, que ahora vive en Historial.
const TAB_ALIASES = { password: "security", records: null, profile: "profile", security: "security", data: "data" };

(async () => {
  try {
    const userData = await authService.loadCurrentUser();

    if (!userData?.user) {
      window.location.replace("index.html");
      return;
    }

    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "records") {
      window.location.replace("history.html");
      return;
    }

    const content = mountShell(root, {
      active: "ajustes",
      title: "Configuración",
      profile: userData.profile,
      modalRoot
    });

    const records = await recordService.getUserRecords(userData.user.id);

    const controller = createSettingsController({ root: content, currentUserId: userData.user.id });
    controller.render(userData.profile, records);

    const tab = TAB_ALIASES[requestedTab];
    if (tab) controller.activateTab(tab);
  } catch (error) {
    root.innerHTML = `
      <div class="app-main"><div class="content">
        <article class="card">
          <h2 style="margin-bottom:6px;">No se pudo cargar la configuración</h2>
          <p class="message error">${escHtml(error.message)}</p>
          <p class="helper" style="margin-top:10px;"><a href="index.html">Volver al inicio</a></p>
        </article>
      </div></div>
    `;
  }
})();
