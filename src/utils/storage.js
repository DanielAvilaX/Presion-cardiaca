/** Acceso seguro a localStorage (no falla si esta deshabilitado). */

export function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}
