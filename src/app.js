import { authService } from "./services/authService.js";
import { createAuthController } from "./controllers/authController.js";
import { createDashboardController } from "./controllers/dashboardController.js";

const appRoot = document.querySelector("#app");
const modalRoot = document.querySelector("#modal-root");

function renderError(message) {
  appRoot.innerHTML = `
    <section class="panel auth-card">
      <h2>No se pudo cargar la aplicacion</h2>
      <p class="message error">${message ?? "Error desconocido"}</p>
      <p class="helper">Si el problema persiste, recarga la pagina.</p>
    </section>
  `;
}

const dashboardController = createDashboardController({
  onLoggedOut: () => {
    modalRoot.innerHTML = "";
    authController.render(appRoot);
  }
});

const authController = createAuthController({
  onLoggedIn: async (userData) => {
    await dashboardController.bootstrap({
      root: appRoot,
      modalContainer: modalRoot,
      userData
    });
  }
});

// Eventos que deben disparar una re-renderizacion del estado de la app.
const HANDLED_EVENTS = new Set(["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT", "PASSWORD_RECOVERY"]);

authService.listenAuthChanges((event, session) => {
  // TOKEN_REFRESHED y USER_UPDATED no requieren re-inicializar la UI.
  if (!HANDLED_EVENTS.has(event)) return;

  // Se difiere la logica fuera del callback de Supabase para evitar
  // el deadlock del lock interno de autenticacion.
  setTimeout(async () => {
    try {
      if (!session?.user) {
        modalRoot.innerHTML = "";
        authController.render(appRoot);
        return;
      }

      const userData = await authService.loadCurrentUser(session);
      await dashboardController.bootstrap({
        root: appRoot,
        modalContainer: modalRoot,
        userData
      });
    } catch (error) {
      renderError(error.message);
    }
  }, 0);
});
