import { BP_CATEGORIES, getCategory } from "../utils/bpClassification.js";
import { icon } from "./icons.js";

/** Pastilla de color con la categoria clinica de una lectura. */
export function bpBadge(category, { compact = false } = {}) {
  const cat = typeof category === "string" ? getCategory(category) : category;
  return `<span class="bp-badge bp-badge--${cat.key}${compact ? " bp-badge--compact" : ""}" title="${cat.advice}">
    <span class="bp-badge-dot"></span>${cat.label}
  </span>`;
}

/** Indicador de tendencia (flecha + porcentaje) frente al periodo anterior. */
export function trendIndicator(trend) {
  if (!trend || trend.deltaPct === null || trend.direction === "flat") {
    return `<span class="trend trend--flat">Sin cambio</span>`;
  }

  const isUp = trend.direction === "up";
  const iconName = isUp ? "trendUp" : "trendDown";
  const sign = isUp ? "+" : "";
  return `<span class="trend trend--${trend.direction}">
    ${icon(iconName, { size: 14 })}${sign}${trend.deltaPct}%
  </span>`;
}

/** Mini grafico de linea (sparkline) a partir de una serie de numeros. */
export function sparkline(values, { color = "var(--primary)", width = 120, height = 34 } = {}) {
  const points = values.filter((value) => Number.isFinite(value));
  if (points.length < 2) {
    return `<svg class="sparkline" width="${width}" height="${height}" aria-hidden="true"></svg>`;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((value, i) => {
    const x = i * stepX;
    const y = height - 3 - ((value - min) / span) * (height - 6);
    return [x, y];
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const last = coords[coords.length - 1];

  return `<svg class="sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${area}" fill="${color}" fill-opacity="0.12" stroke="none"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.6" fill="${color}"/>
  </svg>`;
}

/** Barra apilada con la distribucion de lecturas por categoria. */
export function distributionBar(distribution, total) {
  if (!total) {
    return `<div class="empty-state">Sin lecturas en el rango seleccionado.</div>`;
  }

  const segments = BP_CATEGORIES.filter((category) => distribution[category.key] > 0)
    .map((category) => {
      const count = distribution[category.key];
      const pct = (count / total) * 100;
      return `<span class="dist-seg" style="width:${pct}%; background:${category.color};"
        title="${category.label}: ${count} (${Math.round(pct)}%)"></span>`;
    })
    .join("");

  const legend = BP_CATEGORIES.filter((category) => distribution[category.key] > 0)
    .map((category) => {
      const count = distribution[category.key];
      return `<span class="dist-legend-item">
        <span class="dist-legend-dot" style="background:${category.color};"></span>
        ${category.label} <strong>${count}</strong>
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
