/** Utilidades de animacion que respetan prefers-reduced-motion. */

export function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Anima un contador numerico de 0 (o un valor inicial) hasta `to`.
 * Si el usuario prefiere menos movimiento, asigna el valor final de inmediato.
 */
export function animateCount(element, to, { duration = 750, from = 0 } = {}) {
  const target = Number(to);
  if (!element || !Number.isFinite(target)) return;

  if (prefersReducedMotion()) {
    element.textContent = String(target);
    return;
  }

  const startTime = performance.now();
  const delta = target - from;

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.round(from + delta * easeOutCubic(progress));
    element.textContent = String(value);
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

/**
 * Anima el trazado de los paths de una grafica SVG usando stroke-dasharray.
 */
export function animateChartPaths(container) {
  if (!container || prefersReducedMotion()) return;

  const paths = container.querySelectorAll("path[data-animate-line]");
  paths.forEach((path, index) => {
    const length = path.getTotalLength?.();
    if (!length) return;

    path.style.transition = "none";
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    // Forzar reflow para que la transicion arranque desde el offset completo.
    void path.getBoundingClientRect();
    path.style.transition = `stroke-dashoffset 0.9s ease ${index * 0.12}s`;
    path.style.strokeDashoffset = "0";
  });
}
