/**
 * Sincroniza `--app-vh` / `--app-vh-offset` con el viewport visual real.
 *
 * En iOS y Android, el teclado en pantalla reduce `window.visualViewport`
 * pero no cambia `100dvh` ni `window.innerHeight`: un modal posicionado con
 * `inset:0` sigue midiendo la pantalla completa y queda parcialmente
 * detrás del teclado. Guardar la altura (y el desplazamiento) visibles en
 * variables CSS deja que la hoja inferior del modal se ajuste en vivo.
 */

let started = false;

export function watchVisualViewport() {
  if (started) return;
  started = true;

  const root = document.documentElement;
  const vv = window.visualViewport;

  function apply() {
    const height = vv?.height ?? window.innerHeight;
    const offsetTop = vv?.offsetTop ?? 0;
    root.style.setProperty("--app-vh", `${height}px`);
    root.style.setProperty("--app-vh-offset", `${offsetTop}px`);
  }

  apply();

  if (vv) {
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
  } else {
    window.addEventListener("resize", apply);
  }
}
