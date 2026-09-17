import { authService } from "./services/authService.js";
import { createAuthController } from "./controllers/authController.js";
import { createDashboardController } from "./controllers/dashboardController.js";
import { mountShell } from "./ui/appShell.js";
import { escHtml } from "./utils/html.js";

const root = document.querySelector("#root");
const modalRoot = document.querySelector("#modal-root");

const authController = createAuthController();
const dashboardController = createDashboardController();

/**
 * El listener de sesión es la única fuente de verdad sobre qué se muestra.
 * Antes el formulario de acceso también montaba el panel por su cuenta y, al
 * iniciar sesión, se cargaban y dibujaban los datos dos veces.
 */
const HANDLED_EVENTS = new Set(["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT", "PASSWORD_RECOVERY"]);

let mountedUserId = null;
let recovering = false;

function renderError(message) {
  root.innerHTML = `
    <div class="auth-panel">
      <article class="card auth-card">
        <h2 style="margin-bottom:6px;">No se pudo cargar la aplicación</h2>
        <p class="message error">${escHtml(message ?? "Error desconocido")}</p>
        <p class="helper" style="margin-top:10px;">Si el problema continúa, recarga la página.</p>
      </article>
    </div>
  `;
}

function showAuth() {
  mountedUserId = null;
  modalRoot.innerHTML = "";
  authController.render(root);
}

async function showDashboard(userData) {
  const content = mountShell(root, {
    active: "inicio",
    title: "Inicio",
    profile: userData.profile,
    modalRoot
  });

  await dashboardController.bootstrap({ root: content, modalRoot, userData });
  mountedUserId = userData.user.id;
}

authService.listenAuthChanges((event, session) => {
  if (!HANDLED_EVENTS.has(event)) return;

  // Se difiere fuera del callback de Supabase: hacer llamadas a la librería
  // dentro del propio callback puede bloquear su cerrojo interno de auth.
  setTimeout(async () => {
    try {
      if (event === "PASSWORD_RECOVERY") {
        recovering = true;
        modalRoot.innerHTML = "";
        authController.renderRecovery(root, {
          onDone: () => {
            recovering = false;
            window.location.replace("index.html");
          }
        });
        return;
      }

      // Mientras se elige la contraseña nueva, nada más puede tomar la pantalla.
      if (recovering) return;

      if (!session?.user) {
        showAuth();
        return;
      }

      // Evita volver a montar el panel si ya está montado para este usuario.
      if (session.user.id === mountedUserId) return;

      const userData = await authService.loadCurrentUser(session);
      await showDashboard(userData);
    } catch (error) {
      renderError(error.message);
    }
  }, 0);
});
