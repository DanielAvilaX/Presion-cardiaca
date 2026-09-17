import { authService } from "./services/authService.js";
import { createHistoryController } from "./controllers/historyController.js";
import { mountShell } from "./ui/appShell.js";
import { escHtml } from "./utils/html.js";

const root = document.querySelector("#root");
const modalRoot = document.querySelector("#modal-root");

(async () => {
  try {
    const userData = await authService.loadCurrentUser();

    if (!userData?.user) {
      window.location.replace("index.html");
      return;
    }

    const content = mountShell(root, {
      active: "historial",
      title: "Historial",
      profile: userData.profile,
      modalRoot
    });

    const controller = createHistoryController();
    await controller.bootstrap({ root: content, modalRoot, userData });
  } catch (error) {
    root.innerHTML = `
      <div class="app-main"><div class="content">
        <article class="card">
          <h2 style="margin-bottom:6px;">No se pudo cargar el historial</h2>
          <p class="message error">${escHtml(error.message)}</p>
          <p class="helper" style="margin-top:10px;"><a href="index.html">Volver al inicio</a></p>
        </article>
      </div></div>
    `;
  }
})();
