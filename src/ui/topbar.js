import { toggleTheme, getActiveTheme, initTheme } from "../utils/theme.js";
import { icon } from "./icons.js";

/**
 * Inicializa la barra superior compartida: aplica el tema y vincula el
 * boton de cambio de tema (claro/oscuro).
 */
export function initTopbar() {
  initTheme();

  const button = document.querySelector("#theme-toggle");
  if (!button) return;

  const refresh = () => {
    const dark = getActiveTheme() === "dark";
    button.innerHTML = icon(dark ? "sun" : "moon", { size: 20 });
    button.setAttribute("aria-label", dark ? "Activar tema claro" : "Activar tema oscuro");
    button.setAttribute("title", dark ? "Tema claro" : "Tema oscuro");
  };

  refresh();
  button.addEventListener("click", () => {
    toggleTheme();
    refresh();
  });
}
