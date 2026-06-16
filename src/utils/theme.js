import { readStorage, writeStorage } from "./storage.js";

const STORAGE_KEY = "tension-theme";

export function resolveTheme() {
  const stored = readStorage(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function getActiveTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/** Aplica el tema guardado o el del sistema. Llamar lo antes posible. */
export function initTheme() {
  applyTheme(resolveTheme());
}

/** Alterna el tema, lo persiste y devuelve el nuevo valor. */
export function toggleTheme() {
  const next = getActiveTheme() === "dark" ? "light" : "dark";
  writeStorage(STORAGE_KEY, next);
  applyTheme(next);
  return next;
}
