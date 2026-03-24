import { authService } from "../services/authService.js";
import { createAuthView } from "../ui/authView.js";

export function createAuthController({ onLoggedIn }) {
  function setMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
  }

  function bindTabs(root) {
    const buttons = root.querySelectorAll("[data-auth-tab]");
    const panels = root.querySelectorAll("[data-auth-panel]");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.authTab;
        buttons.forEach((item) => item.classList.toggle("active", item === button));
        panels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.authPanel !== target));
      });
    });
  }

  function bindLogin(root) {
    const form = root.querySelector("#login-form");
    const message = root.querySelector("#login-message");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      setMessage(message, "Validando credenciales...", "");

      try {
        const userData = await authService.login(
          root.querySelector("#login-email").value,
          root.querySelector("#login-password").value
        );

        setMessage(message, "Acceso concedido.", "success");
        await onLoggedIn(userData);
      } catch (error) {
        setMessage(message, error.message, "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  function bindRegister(root) {
    const form = root.querySelector("#register-form");
    const message = root.querySelector("#register-message");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      setMessage(message, "Creando cuenta...", "");

      try {
        await authService.register({
          firstName: root.querySelector("#register-first-name").value,
          lastName: root.querySelector("#register-last-name").value,
          age: root.querySelector("#register-age").value,
          document: root.querySelector("#register-document").value,
          email: root.querySelector("#register-email").value,
          confirmEmail: root.querySelector("#register-confirm-email").value,
          password: root.querySelector("#register-password").value,
          confirmPassword: root.querySelector("#register-confirm-password").value
        });

        setMessage(message, "Cuenta creada. Revisa tu correo si la confirmacion esta activa en Supabase.", "success");
        form.reset();
      } catch (error) {
        setMessage(message, error.message, "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  return {
    render(root) {
      root.innerHTML = createAuthView();
      bindTabs(root);
      bindLogin(root);
      bindRegister(root);
    }
  };
}
