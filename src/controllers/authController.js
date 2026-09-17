import { authService } from "../services/authService.js";
import { createAuthView, createPasswordRecoveryView } from "../ui/authView.js";
import { bindPasswordToggles } from "../ui/dom.js";
import { initStandaloneTheme } from "../ui/appShell.js";

export function createAuthController({ onLoggedIn } = {}) {
  function setMessage(element, message, type = "") {
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

  function showPanel(root, name) {
    root.querySelectorAll("[data-auth-panel]").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.authPanel !== name);
    });
    root.querySelectorAll("[data-auth-tab]").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.authTab === name);
    });
  }

  function bindTabs(root) {
    root.querySelectorAll("[data-auth-tab]").forEach((button) => {
      button.addEventListener("click", () => showPanel(root, button.dataset.authTab));
    });

    root.querySelector("#forgot-password")?.addEventListener("click", () => showPanel(root, "reset"));
    root.querySelector("#back-to-login")?.addEventListener("click", () => showPanel(root, "login"));
  }

  function bindLiveValidation(root) {
    const email = root.querySelector("#register-email");
    const confirmEmail = root.querySelector("#register-confirm-email");
    const password = root.querySelector("#register-password");
    const confirmPassword = root.querySelector("#register-confirm-password");

    const checkEmails = () => {
      if (!confirmEmail.value) return setHint(root, "register-confirm-email", "", "");
      const match = email.value === confirmEmail.value;
      setHint(root, "register-confirm-email", match ? "Los correos coinciden." : "Los correos no coinciden.", match ? "ok" : "error");
    };

    const checkEmailFormat = () => {
      if (!email.value) return setHint(root, "register-email", "", "");
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      setHint(root, "register-email", valid ? "" : "Revisa el formato del correo.", valid ? "" : "error");
    };

    const checkPassword = () => {
      if (!password.value) return setHint(root, "register-password", "", "");
      const valid = password.value.length >= 6;
      setHint(root, "register-password", valid ? "Longitud correcta." : "Mínimo 6 caracteres.", valid ? "ok" : "error");
    };

    const checkConfirmPassword = () => {
      if (!confirmPassword.value) return setHint(root, "register-confirm-password", "", "");
      const match = password.value === confirmPassword.value;
      setHint(
        root,
        "register-confirm-password",
        match ? "Las contraseñas coinciden." : "Las contraseñas no coinciden.",
        match ? "ok" : "error"
      );
    };

    email?.addEventListener("input", () => { checkEmailFormat(); checkEmails(); });
    confirmEmail?.addEventListener("input", checkEmails);
    password?.addEventListener("input", () => { checkPassword(); checkConfirmPassword(); });
    confirmPassword?.addEventListener("input", checkConfirmPassword);
  }

  /** Envuelve un submit: bloquea el botón y canaliza los errores al mensaje. */
  function bindForm(form, message, { pending, handler }) {
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      setMessage(message, pending);

      try {
        await handler();
      } catch (error) {
        setMessage(message, error.message, "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  function bindLogin(root) {
    const form = root.querySelector("#login-form");
    const message = root.querySelector("#login-message");

    bindForm(form, message, {
      pending: "Validando credenciales…",
      handler: async () => {
        const userData = await authService.login(
          root.querySelector("#login-email").value,
          root.querySelector("#login-password").value
        );

        setMessage(message, "Acceso concedido.", "success");
        // El listener de sesión monta el panel; aquí no se renderiza nada más
        // para no cargar los datos dos veces.
        await onLoggedIn?.(userData);
      }
    });
  }

  function bindRegister(root) {
    const form = root.querySelector("#register-form");
    const message = root.querySelector("#register-message");

    bindForm(form, message, {
      pending: "Creando tu cuenta…",
      handler: async () => {
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

        setMessage(message, "Cuenta creada. Si Supabase pide confirmación, revisa tu correo.", "success");
        form.reset();
      }
    });
  }

  function bindReset(root) {
    const form = root.querySelector("#reset-form");
    const message = root.querySelector("#reset-message");

    bindForm(form, message, {
      pending: "Enviando el enlace…",
      handler: async () => {
        await authService.requestPasswordReset(root.querySelector("#reset-email").value);
        setMessage(message, "Listo. Si el correo existe, recibirás un enlace en unos minutos.", "success");
        form.reset();
      }
    });
  }

  return {
    render(root) {
      root.innerHTML = createAuthView();
      bindTabs(root);
      bindLogin(root);
      bindRegister(root);
      bindReset(root);
      bindPasswordToggles(root);
      bindLiveValidation(root);
      initStandaloneTheme();
    },

    /** Pantalla que se muestra al abrir el enlace de recuperación. */
    renderRecovery(root, { onDone } = {}) {
      root.innerHTML = createPasswordRecoveryView();
      bindPasswordToggles(root);
      initStandaloneTheme();

      const form = root.querySelector("#recovery-form");
      const message = root.querySelector("#recovery-message");

      bindForm(form, message, {
        pending: "Guardando…",
        handler: async () => {
          await authService.updatePassword(
            root.querySelector("#recovery-password").value,
            root.querySelector("#recovery-confirm").value
          );
          setMessage(message, "Contraseña actualizada. Entrando…", "success");
          setTimeout(() => onDone?.(), 900);
        }
      });
    }
  };
}
