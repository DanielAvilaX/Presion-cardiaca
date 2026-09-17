/**
 * Escapa caracteres especiales de HTML para prevenir XSS.
 *
 * Se escapan tambien la comilla simple y el backtick porque parte del markup
 * de la app se construye con plantillas literales, donde un atributo puede
 * quedar delimitado por comillas simples.
 *
 * @param {*} value
 * @returns {string}
 */
export function escHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;");
}

/**
 * Escapa un valor para usarlo como texto dentro de un atributo.
 * Alias semantico de escHtml: deja claro en el sitio de uso que el valor
 * termina dentro de comillas.
 */
export const escAttr = escHtml;
