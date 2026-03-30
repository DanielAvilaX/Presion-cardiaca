/**
 * Escapa caracteres especiales HTML para prevenir XSS.
 * @param {*} str
 * @returns {string}
 */
export function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
