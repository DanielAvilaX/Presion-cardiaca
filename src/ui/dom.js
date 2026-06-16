import { icon } from "./icons.js";

export function createField({ id, label, type = "text", value = "", placeholder = "", min = "", rows = 4, hint = false, autocomplete = "" }) {
  const hintEl = hint ? `<p class="field-hint" id="${id}-hint" role="status" aria-live="polite"></p>` : "";

  if (type === "textarea") {
    return `
      <div class="field">
        <label for="${id}">${label}</label>
        <textarea id="${id}" placeholder="${placeholder}" rows="${rows}">${value}</textarea>
        ${hintEl}
      </div>
    `;
  }

  if (type === "password") {
    return `
      <div class="field field-password">
        <label for="${id}">${label}</label>
        <input id="${id}" type="password" value="${value}" placeholder="${placeholder}" autocomplete="${autocomplete || "current-password"}" />
        <button type="button" class="password-toggle" data-toggle-password="${id}" aria-label="Mostrar contrasena">
          ${icon("eye", { size: 18 })}
        </button>
        ${hintEl}
      </div>
    `;
  }

  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <input id="${id}" type="${type}" value="${value}" placeholder="${placeholder}" min="${min}" />
      ${hintEl}
    </div>
  `;
}

export function createSelectField({ id, label, options, value = "" }) {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <select id="${id}">
        ${options
          .map(
            (option) =>
              `<option value="${option.value}" ${option.value === value ? "selected" : ""}>${option.label}</option>`
          )
          .join("")}
      </select>
    </div>
  `;
}

/**
 * Vincula los botones de mostrar/ocultar contrasena dentro de un contenedor.
 */
export function bindPasswordToggles(root) {
  root.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = root.querySelector(`#${button.dataset.togglePassword}`);
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.innerHTML = icon(show ? "eyeOff" : "eye", { size: 18 });
      button.setAttribute("aria-label", show ? "Ocultar contrasena" : "Mostrar contrasena");
    });
  });
}
