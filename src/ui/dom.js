import { icon } from "./icons.js";
import { escHtml } from "../utils/html.js";

export function createField({
  id,
  label,
  type = "text",
  value = "",
  placeholder = "",
  min = "",
  max = "",
  rows = 4,
  hint = false,
  autocomplete = "",
  inputmode = ""
}) {
  const hintEl = hint ? `<p class="field-hint" id="${id}-hint" role="status" aria-live="polite"></p>` : "";
  const attrs = [
    min !== "" ? `min="${escHtml(min)}"` : "",
    max !== "" ? `max="${escHtml(max)}"` : "",
    autocomplete ? `autocomplete="${escHtml(autocomplete)}"` : "",
    inputmode ? `inputmode="${escHtml(inputmode)}"` : ""
  ]
    .filter(Boolean)
    .join(" ");

  if (type === "textarea") {
    return `
      <div class="field">
        <label for="${id}">${escHtml(label)}</label>
        <textarea id="${id}" placeholder="${escHtml(placeholder)}" rows="${rows}">${escHtml(value)}</textarea>
        ${hintEl}
      </div>
    `;
  }

  if (type === "password") {
    return `
      <div class="field field-password">
        <label for="${id}">${escHtml(label)}</label>
        <input id="${id}" type="password" value="${escHtml(value)}" placeholder="${escHtml(placeholder)}"
          autocomplete="${escHtml(autocomplete || "current-password")}" />
        <button type="button" class="password-toggle" data-toggle-password="${id}" aria-label="Mostrar contraseña">
          ${icon("eye", { size: 17 })}
        </button>
        ${hintEl}
      </div>
    `;
  }

  return `
    <div class="field">
      <label for="${id}">${escHtml(label)}</label>
      <input id="${id}" type="${escHtml(type)}" value="${escHtml(value)}" placeholder="${escHtml(placeholder)}" ${attrs} />
      ${hintEl}
    </div>
  `;
}

export function createSelectField({ id, label, options, value = "" }) {
  const choices = options
    .map(
      (option) =>
        `<option value="${escHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escHtml(option.label)}</option>`
    )
    .join("");

  return `
    <div class="field">
      <label for="${id}">${escHtml(label)}</label>
      <select id="${id}">${choices}</select>
    </div>
  `;
}

/** Vincula los botones de mostrar/ocultar contraseña dentro de un contenedor. */
export function bindPasswordToggles(root) {
  root.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = root.querySelector(`#${button.dataset.togglePassword}`);
      if (!input) return;

      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.innerHTML = icon(show ? "eyeOff" : "eye", { size: 17 });
      button.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
    });
  });
}

/**
 * Accesibilidad de un modal: bloquea el scroll de fondo, mueve el foco dentro
 * y lo mantiene atrapado mientras esté abierto. Devuelve la función de limpieza.
 */
export function trapFocus(modal, { onClose } = {}) {
  if (!modal) return () => {};

  const previouslyFocused = document.activeElement;
  document.body.style.overflow = "hidden";

  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const focusables = () => Array.from(modal.querySelectorAll(selector)).filter((el) => el.offsetParent !== null);

  // Prioriza el primer campo editable sobre el botón de cerrar.
  const initial = modal.querySelector("input, select, textarea") ?? focusables()[0];
  initial?.focus({ preventScroll: true });

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose?.();
      return;
    }

    if (event.key !== "Tab") return;

    const items = focusables();
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  modal.addEventListener("keydown", onKeydown);

  return () => {
    modal.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = "";
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
  };
}
