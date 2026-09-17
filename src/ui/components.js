import { BP_CATEGORIES, getCategory } from "../utils/bpClassification.js";
import { escHtml } from "../utils/html.js";
import { icon } from "./icons.js";

/**
 * Los colores de categoria y de serie son variables CSS, asi que siempre se
 * pintan con `style="..."` y nunca como atributo de presentacion de SVG
 * (`fill="var(--x)"` no es valido en todos los navegadores).
 */

/** Pastilla con la categoria clinica de una lectura. */
export function bpBadge(category, { compact = false } = {}) {
  const cat = typeof category === "string" ? getCategory(category) : category;

  return `<span class="bp-badge bp-badge--${cat.key}${compact ? " bp-badge--compact" : ""}">
    <span class="bp-badge-dot"></span>${cat.label}
  </span>`;
}

/** Llave de color de una serie: la identidad va en la marca, no en el texto. */
export function seriesKey(colorVar, { dashed = false } = {}) {
  return `<span class="series-key${dashed ? " series-key--dashed" : ""}" style="--key-color:${colorVar};"></span>`;
}

/** Indicador de tendencia frente al periodo anterior. */
export function trendIndicator(trend) {
  if (!trend || trend.deltaPct === null || trend.direction === "flat") {
    return `<span class="trend trend--flat">Sin cambio</span>`;
  }

  const isUp = trend.direction === "up";
  return `<span class="trend trend--${trend.direction}" title="Frente al periodo anterior">
    ${icon(isUp ? "trendUp" : "trendDown", { size: 13 })}${isUp ? "+" : ""}${trend.deltaPct}%
  </span>`;
}

/** Mini grafico de linea a partir de una serie de numeros. */
export function sparkline(values, { color = "var(--brand)", width = 120, height = 32 } = {}) {
  const points = values.filter((value) => Number.isFinite(value));

  if (points.length < 2) {
    return `<svg class="sparkline" width="${width}" height="${height}" aria-hidden="true"></svg>`;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((value, index) => [
    index * stepX,
    height - 3 - ((value - min) / span) * (height - 6)
  ]);

  const line = coords
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const [lastX, lastY] = coords[coords.length - 1];

  return `<svg class="sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${area}" style="fill:${color}; fill-opacity:0.1;"/>
    <path d="${line}" fill="none" style="stroke:${color};" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="2.4" style="fill:${color};"/>
  </svg>`;
}

/**
 * Tarjeta de estadistica: etiqueta + llave de color, valor grande, tendencia
 * y una miniatura de la evolucion.
 */
export function statTile({ label, value, unit, trend, series, color, dashed = false }) {
  return `
    <article class="stat-box">
      <div class="stat-top">
        <span class="stat-label">${seriesKey(color, { dashed })}${escHtml(label)}</span>
        ${trendIndicator(trend)}
      </div>
      <strong class="stat-value" data-count="${value || 0}">${value || "--"}<span class="unit">${escHtml(unit)}</span></strong>
      ${sparkline(series, { color })}
    </article>
  `;
}

/**
 * Medidor semicircular que situa una lectura dentro de las cinco categorias.
 * Da una lectura "de un vistazo" antes de leer el numero.
 *
 * Es una pista gris de fondo (fija, siempre igual) más un arco de color que
 * crece desde la izquierda a medida que empeora la categoria. Antes cada
 * categoria era un tramo propio con gap, y para "Normal" (la primera) eso
 * dejaba un tramo verde diminuto junto a un arco gris que ocupaba 4/5 del
 * medidor: a simple vista el gris parecia "la barra" y el verde un resto.
 * Con un unico trazo continuo detras y el color siempre encima, el color es
 * inequivocamente lo que "crece" y el gris es solo la pista.
 */
export function categoryGauge(category, { size = 132 } = {}) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  // Deja hueco arriba para que el grosor del trazo no se recorte en el punto
  // más alto del arco (θ = 90°, y = cy - radius).
  const cy = radius + stroke;
  const labelHeight = 30;
  const height = cy + labelHeight;

  const total = BP_CATEGORIES.length;
  const activeIndex = BP_CATEGORIES.findIndex((item) => item.key === category.key);
  const spanDeg = 180 / total;

  // θ = 180° es el extremo izquierdo, 90° el punto más alto, 0° el extremo
  // derecho: recorrer de 180° a 0° traza el semicírculo superior.
  const pointAt = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy - radius * Math.sin(rad)];
  };

  const arcPath = (startDeg, endDeg) => {
    const [x1, y1] = pointAt(startDeg);
    const [x2, y2] = pointAt(endDeg);
    const largeArc = startDeg - endDeg > 180 ? 1 : 0;
    // sweep-flag 1: avanza en sentido horario (izquierda -> arriba -> derecha).
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  // El relleno llega hasta el final del tramo de la categoria actual: crece
  // hacia la derecha cuanto peor es la lectura (Crisis llena el medidor entero).
  const fillEndDeg = 180 - (activeIndex + 1) * spanDeg;

  return `
    <svg class="gauge" width="${size}" height="${height}" viewBox="0 0 ${size} ${height}" role="img"
         aria-label="Categoría clínica: ${escHtml(category.label)}">
      <path d="${arcPath(180, 0)}" fill="none" style="stroke:var(--surface-3);" stroke-width="${stroke}" stroke-linecap="round" />
      <path d="${arcPath(180, fillEndDeg)}" fill="none" style="stroke:${category.color};" stroke-width="${stroke + 3}" stroke-linecap="round" />
      <text x="${cx}" y="${cy - radius * 0.32}" text-anchor="middle" style="fill:${category.color};"
            font-size="13" font-weight="700" font-family="inherit">${escHtml(category.label)}</text>
    </svg>
  `;
}

/** Barra apilada con la distribucion de lecturas por categoria. */
export function distributionBar(distribution, total) {
  if (!total) {
    return `<p class="helper">Sin lecturas en el periodo seleccionado.</p>`;
  }

  const present = BP_CATEGORIES.filter((category) => distribution[category.key] > 0);

  const segments = present
    .map((category) => {
      const count = distribution[category.key];
      const pct = (count / total) * 100;
      return `<span class="dist-seg" style="width:${pct}%; background:${category.color};"
        title="${escHtml(category.label)}: ${count} de ${total}"></span>`;
    })
    .join("");

  const legend = present
    .map((category) => {
      const count = distribution[category.key];
      const pct = Math.round((count / total) * 100);
      return `<span class="dist-legend-item">
        <span class="dist-legend-dot" style="background:${category.color};"></span>
        ${escHtml(category.label)} <strong>${count}</strong> <span class="helper">(${pct}%)</span>
      </span>`;
    })
    .join("");

  return `
    <div class="dist-wrap">
      <div class="dist-bar">${segments}</div>
      <div class="dist-legend">${legend}</div>
    </div>
  `;
}

/** Estado vacio reutilizable. */
export function emptyState({ iconName = "pulse", title, description, action = "" }) {
  return `
    <div class="empty-state">
      <span class="empty-icon">${icon(iconName, { size: 24 })}</span>
      <div>
        <strong>${escHtml(title)}</strong>
        <p class="helper" style="margin-top:4px;">${escHtml(description)}</p>
      </div>
      ${action}
    </div>
  `;
}
