/** Animaciones que respetan `prefers-reduced-motion`. */

export function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Anima un contador numérico hasta `to`.
 *
 * Escribe sobre el primer nodo de texto del elemento en lugar de reemplazar su
 * contenido, para no borrar los hijos (por ejemplo el `<span class="unit">`
 * con «mmHg» que acompaña a la cifra).
 */
export function animateCount(element, to, { duration = 700, from = 0 } = {}) {
  const target = Number(to);
  if (!element || !Number.isFinite(target)) return;

  let textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
  if (!textNode) {
    textNode = document.createTextNode("");
    element.insertBefore(textNode, element.firstChild);
  }

  if (prefersReducedMotion()) {
    textNode.nodeValue = String(target);
    return;
  }

  const startTime = performance.now();
  const delta = target - from;

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    textNode.nodeValue = String(Math.round(from + delta * easeOutCubic(progress)));
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

/** Dibuja las líneas de la gráfica con `stroke-dasharray`. */
export function animateChartPaths(container) {
  if (!container || prefersReducedMotion()) return;

  container.querySelectorAll("path[data-animate-line]").forEach((path, index) => {
    const length = path.getTotalLength?.();
    if (!length) return;

    path.style.transition = "none";
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    // Fuerza un reflow para que la transición arranque desde el offset completo.
    void path.getBoundingClientRect();
    path.style.transition = `stroke-dashoffset 0.8s ease ${index * 0.1}s`;
    path.style.strokeDashoffset = "0";
  });
}
