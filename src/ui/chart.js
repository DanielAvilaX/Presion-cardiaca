import { formatShortDate, formatDisplayDate, formatTime } from "../utils/date.js";
import { escHtml } from "../utils/html.js";
import { BP_CATEGORIES, getCategory } from "../utils/bpClassification.js";
import { seriesKey } from "./components.js";
import { icon } from "./icons.js";

/**
 * Gráfica de evolución.
 *
 * Decisiones de lectura:
 *  · Un solo eje. Sistólica, diastólica y pulso comparten unidad de escala;
 *    nunca se añade un segundo eje (inventaría correlaciones que no existen).
 *  · Dos identidades de color: la tensión es azul en dos pasos del mismo tono
 *    (es una sola magnitud con techo y piso) y la frecuencia es magenta.
 *  · El área entre sistólica y diastólica es el "rango de presión": es la forma
 *    en que lo muestran las apps clínicas y se lee mejor que dos líneas sueltas.
 *  · Rejilla en línea fina continua, etiquetas selectivas y valor al final de
 *    cada serie, de modo que ningún dato dependa solo del tooltip.
 */

const W = 840;
const H = 300;
const PAD = { top: 20, right: 64, bottom: 46, left: 44 };

const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

// Umbrales clínicos por sistólica, para las bandas de referencia.
const REFERENCE_BANDS = [
  { from: -Infinity, to: 120, key: "normal" },
  { from: 120, to: 130, key: "elevated" },
  { from: 130, to: 140, key: "stage1" },
  { from: 140, to: 180, key: "stage2" },
  { from: 180, to: Infinity, key: "crisis" }
];

export const SERIES = [
  { key: "systolic", label: "Sistólica", short: "SIS", accessor: (r) => r.ta_systolic, color: "var(--series-sys)", unit: "mmHg", dashed: false },
  { key: "diastolic", label: "Diastólica", short: "DIA", accessor: (r) => r.ta_diastolic, color: "var(--series-dia)", unit: "mmHg", dashed: false },
  { key: "heartRate", label: "Frecuencia", short: "FC", accessor: (r) => r.heart_rate, color: "var(--series-hr)", unit: "lpm", dashed: true }
];

function buildScale(ordered, visibility) {
  const values = [];
  SERIES.forEach((serie) => {
    if (visibility[serie.key]) ordered.forEach((record) => values.push(serie.accessor(record)));
  });

  if (!values.length) values.push(60, 160);

  const yMin = Math.max(0, Math.floor((Math.min(...values) - 10) / 20) * 20);
  const yMax = Math.ceil((Math.max(...values) + 10) / 20) * 20;
  const span = yMax - yMin || 1;

  return {
    yMin,
    yMax,
    scaleY: (value) => PAD.top + ((yMax - value) / span) * PLOT_H
  };
}

function pointX(index, count) {
  if (count === 1) return PAD.left + PLOT_W / 2;
  return PAD.left + (index * PLOT_W) / (count - 1);
}

/** Catmull-Rom convertido a Bézier: curva suave que pasa por todos los puntos. */
function smoothLine(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;

  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

/**
 * `showLabels` va en false en la versión compacta del panel: ahí el margen
 * derecho lo ocupan los valores finales de cada serie y los nombres de las
 * bandas se amontonaban encima hasta volverse ilegibles.
 */
function buildBands(scaleY, yMin, yMax, showLabels = true) {
  return REFERENCE_BANDS.map((band) => {
    const top = Math.min(band.to, yMax);
    const bottom = Math.max(band.from, yMin);
    if (top <= bottom) return "";

    const category = getCategory(band.key);
    const yTop = scaleY(top);
    const height = scaleY(bottom) - yTop;
    const label = showLabels && height > 16
      ? `<text x="${W - PAD.right + 8}" y="${yTop + height / 2 + 3}" class="chart-band-label">${escHtml(category.label)}</text>`
      : "";

    return `<rect x="${PAD.left}" y="${yTop.toFixed(1)}" width="${PLOT_W}" height="${height.toFixed(1)}"
      style="fill:${category.tint};"/>${label}`;
  }).join("");
}

function buildGrid(scaleY, yMin, yMax) {
  const step = yMax - yMin <= 80 ? 20 : yMax - yMin <= 160 ? 40 : 60;
  const lines = [];

  for (let value = yMin; value <= yMax; value += step) {
    const y = scaleY(value).toFixed(1);
    lines.push(`
      <line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" class="chart-grid-line"/>
      <text x="${PAD.left - 8}" y="${Number(y) + 4}" text-anchor="end" class="chart-axis-label tnum">${value}</text>
    `);
  }

  return lines.join("");
}

/** Etiquetas de fecha espaciadas: como mucho 6, para que nunca se solapen. */
function buildXLabels(ordered) {
  const count = ordered.length;
  const maxLabels = 6;
  const step = Math.max(1, Math.ceil(count / maxLabels));
  const y = H - PAD.bottom + 20;

  return ordered
    .map((record, index) => {
      const isLast = index === count - 1;
      if (index % step !== 0 && !isLast) return "";
      // Evita que la penúltima etiqueta choque con la última.
      if (!isLast && count > 1 && (count - 1 - index) < step / 2) return "";

      return `<text x="${pointX(index, count).toFixed(1)}" y="${y}" text-anchor="middle" class="chart-label">${escHtml(
        formatShortDate(record.record_date)
      )}</text>`;
    })
    .join("");
}

export function createChartMarkup(records, visibility = { systolic: true, diastolic: true, heartRate: true }, { compact = false } = {}) {
  if (!records.length) {
    return `
      <div class="chart-container">
        <div class="empty-state">
          <span class="empty-icon">${icon("chart", { size: 24 })}</span>
          <div>
            <strong>Sin datos en este periodo</strong>
            <p class="helper" style="margin-top:4px;">Cambia el rango de fechas o agrega una medición.</p>
          </div>
        </div>
      </div>
    `;
  }

  const ordered = [...records].sort(
    (a, b) => new Date(`${a.record_date}T${a.record_time}`) - new Date(`${b.record_date}T${b.record_time}`)
  );

  const count = ordered.length;
  const { scaleY, yMin, yMax } = buildScale(ordered, visibility);

  const coords = {};
  SERIES.forEach((serie) => {
    coords[serie.key] = ordered.map((record, index) => [pointX(index, count), scaleY(serie.accessor(record))]);
  });

  // Área entre sistólica y diastólica: el "rango" de la tensión.
  let rangeArea = "";
  if (visibility.systolic && visibility.diastolic && count > 1) {
    const top = smoothLine(coords.systolic);
    const bottomPoints = [...coords.diastolic].reverse();
    const bottom = smoothLine(bottomPoints).replace(/^M/, "L");
    rangeArea = `<path d="${top} ${bottom} Z" style="fill:var(--series-dia); fill-opacity:0.1;"/>`;
  }

  const seriesMarkup = SERIES.map((serie) => {
    if (!visibility[serie.key]) return "";

    const points = coords[serie.key];
    const line = smoothLine(points);
    const dash = serie.dashed ? ' stroke-dasharray="7 6"' : "";

    // Puntos solo si caben sin amontonarse.
    const dots = count <= 40
      ? points
          .map(([x, y]) => `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.2" class="chart-dot-ring" style="fill:${serie.color};"/>`)
          .join("")
      : "";

    // Valor al final de la serie: ningún dato depende solo del tooltip.
    const [lastX, lastY] = points[points.length - 1];
    const endLabel = `<text x="${(lastX + 9).toFixed(1)}" y="${(lastY + 4).toFixed(1)}" class="chart-end-label tnum">${serie.accessor(
      ordered[count - 1]
    )}</text>`;

    return `
      <path data-animate-line d="${line}" fill="none" style="stroke:${serie.color};" stroke-width="2"${dash}
        stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}${endLabel}
    `;
  }).join("");

  // Capa de interacción: una banda por lectura, ancha y fácil de acertar.
  const hitWidth = count > 1 ? PLOT_W / (count - 1) : PLOT_W;
  const hits = ordered
    .map((record, index) => {
      const x = pointX(index, count);
      return `<rect class="chart-hit" x="${(x - hitWidth / 2).toFixed(1)}" y="${PAD.top}"
        width="${hitWidth.toFixed(1)}" height="${PLOT_H}" fill="transparent"
        data-index="${index}" data-x="${x.toFixed(1)}"
        data-sys="${record.ta_systolic}" data-dia="${record.ta_diastolic}" data-hr="${record.heart_rate}"
        data-date="${escHtml(formatDisplayDate(record.record_date))}" data-time="${escHtml(formatTime(record.record_time))}"/>`;
    })
    .join("");

  const legend = SERIES.map(
    (serie) => `
      <button class="chart-legend-item${visibility[serie.key] ? "" : " chart-legend-item--off"}"
        data-series="${serie.key}" type="button" aria-pressed="${visibility[serie.key]}">
        ${seriesKey(serie.color, { dashed: serie.dashed })}${serie.label}
      </button>
    `
  ).join("");

  const expand = compact
    ? `<a href="chart.html" class="ghost-button ghost-button--sm chart-expand-btn">${icon("expand", { size: 15 })} Ver ampliada</a>`
    : "";

  return `
    <div class="chart-container">
      <div class="chart">
        <svg viewBox="0 0 ${W} ${H}" role="img" tabindex="0"
             aria-label="Evolución de la tensión arterial y la frecuencia cardíaca. ${count} lecturas.">
          ${buildBands(scaleY, yMin, yMax, !compact)}
          ${buildGrid(scaleY, yMin, yMax)}
          <line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${H - PAD.bottom}" class="chart-axis-line"/>
          <line x1="${PAD.left}" y1="${H - PAD.bottom}" x2="${W - PAD.right}" y2="${H - PAD.bottom}" class="chart-axis-line"/>
          <line class="chart-crosshair" x1="0" y1="${PAD.top}" x2="0" y2="${H - PAD.bottom}" style="display:none;"/>
          ${rangeArea}
          ${seriesMarkup}
          ${buildXLabels(ordered)}
          ${hits}
        </svg>
        <div class="chart-tooltip" role="tooltip"></div>
      </div>
      <div class="chart-legend-bar">
        <div class="chart-legend">${legend}</div>
        ${expand}
      </div>
    </div>
  `;
}

/**
 * Cruceta + tooltip único con todas las series.
 * El puntero solo tiene que estar cerca en el eje X, nunca sobre la línea.
 */
export function bindChartTooltip(container) {
  const svg = container.querySelector("svg");
  const tooltip = container.querySelector(".chart-tooltip");
  const crosshair = container.querySelector(".chart-crosshair");
  const hits = Array.from(container.querySelectorAll(".chart-hit"));

  if (!svg || !tooltip || !hits.length) return;

  let activeIndex = -1;

  function show(index) {
    const hit = hits[index];
    if (!hit) return;
    activeIndex = index;

    const { date, time, sys, dia, hr } = hit.dataset;

    tooltip.innerHTML = `
      <div class="tip-date">${escHtml(date)} · ${escHtml(time)}</div>
      <div class="tip-row">${seriesKey("var(--series-sys)")}<span class="tip-name">Sistólica</span><span class="tip-value">${escHtml(sys)} <span class="tip-name">mmHg</span></span></div>
      <div class="tip-row">${seriesKey("var(--series-dia)")}<span class="tip-name">Diastólica</span><span class="tip-value">${escHtml(dia)} <span class="tip-name">mmHg</span></span></div>
      <div class="tip-row">${seriesKey("var(--series-hr)", { dashed: true })}<span class="tip-name">Frecuencia</span><span class="tip-value">${escHtml(hr)} <span class="tip-name">lpm</span></span></div>
    `;
    tooltip.style.display = "block";

    if (crosshair) {
      const x = hit.dataset.x;
      crosshair.setAttribute("x1", x);
      crosshair.setAttribute("x2", x);
      crosshair.style.display = "";
    }

    // Posición en píxeles de pantalla a partir de la coordenada del viewBox.
    const rect = svg.getBoundingClientRect();
    const ratio = rect.width / W;
    const pointerX = Number(hit.dataset.x) * ratio;
    const tipWidth = tooltip.offsetWidth;
    const flip = pointerX + tipWidth + 18 > rect.width;

    tooltip.style.left = `${Math.max(4, flip ? pointerX - tipWidth - 12 : pointerX + 12)}px`;
    tooltip.style.top = `${Math.max(4, rect.height * 0.08)}px`;
  }

  function hide() {
    activeIndex = -1;
    tooltip.style.display = "none";
    if (crosshair) crosshair.style.display = "none";
  }

  function nearestIndex(clientX) {
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * W;

    let best = 0;
    let bestDist = Infinity;
    hits.forEach((hit, index) => {
      const dist = Math.abs(Number(hit.dataset.x) - svgX);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    return best;
  }

  svg.addEventListener("pointermove", (event) => show(nearestIndex(event.clientX)));
  svg.addEventListener("pointerleave", hide);
  svg.addEventListener("pointerdown", (event) => show(nearestIndex(event.clientX)));

  // Teclado: mismas lecturas que con el puntero.
  svg.addEventListener("focus", () => show(activeIndex === -1 ? hits.length - 1 : activeIndex));
  svg.addEventListener("blur", hide);
  svg.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = event.key === "ArrowLeft" ? activeIndex - 1 : activeIndex + 1;
    show(Math.min(Math.max(next, 0), hits.length - 1));
  });
}

/** Lista de categorías con su rango, para la leyenda clínica. */
export function categoryScaleMarkup() {
  return `
    <div class="dist-legend" style="gap:6px 14px;">
      ${BP_CATEGORIES.map(
        (category) => `<span class="dist-legend-item">
          <span class="dist-legend-dot" style="background:${category.color};"></span>
          ${escHtml(category.label)} <span class="helper">${escHtml(category.range)}</span>
        </span>`
      ).join("")}
    </div>
  `;
}
