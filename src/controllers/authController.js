import { authService } from "../services/authService.js";
import { createAuthView } from "../ui/authView.js";
import { bindPasswordToggles } from "../ui/dom.js";

export function createAuthController({ onLoggedIn }) {
  function setMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
  }

  function setHint(root, id, message, status) {
    const hint = root.querySelector(`#${id}-hint`);
    const field = root.querySelector(`#${id}`)?.closest(".field");
    if (!hint) return;
    hint.textContent = message;
    hint.className = `field-hint ${status}`;
    if (field) field.classList.toggle("has-error", status === "error");
  }

  function bindLiveValidation(root) {
    const email = root.querySelector("#register-email");
    const confirmEmail = root.querySelector("#register-confirm-email");
    const password = root.querySelector("#register-password");
    const confirmPassword = root.querySelector("#register-confirm-password");

    const checkEmails = () => {
      if (!confirmEmail.value) return setHint(root, "register-confirm-email", "", "");
      if (email.value === confirmEmail.value) setHint(root, "register-confirm-email", "Los correos coinciden.", "ok");
      else setHint(root, "register-confirm-email", "Los correos no coinciden.", "error");
    };

    const checkPassword = () => {
      if (!password.value) return setHint(root, "register-password", "", "");
      if (password.value.length < 6) setHint(root, "register-password", "Minimo 6 caracteres.", "error");
      else setHint(root, "register-password", "Longitud valida.", "ok");
    };

    const checkConfirmPassword = () => {
      if (!confirmPassword.value) return setHint(root, "register-confirm-password", "", "");
      if (password.value === confirmPassword.value) setHint(root, "register-confirm-password", "Las contrasenas coinciden.", "ok");
      else setHint(root, "register-confirm-password", "Las contrasenas no coinciden.", "error");
    };

    email?.addEventListener("input", checkEmails);
    confirmEmail?.addEventListener("input", checkEmails);
    password?.addEventListener("input", () => { checkPassword(); checkConfirmPassword(); });
    confirmPassword?.addEventListener("input", checkConfirmPassword);
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
      bindPasswordToggles(root);
      bindLiveValidation(root);
    }
  };
}
