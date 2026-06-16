import { formatDisplayDate } from "../utils/date.js";
import { getCategory } from "../utils/bpClassification.js";

const CHART_WIDTH = 800;
const CHART_HEIGHT = 300;
const PADDING = 48;
const LABEL_AREA = 72; // espacio extra debajo del eje X para etiquetas rotadas

// Bandas de referencia clinicas (por valor sistolico) para dar contexto visual.
const REFERENCE_BANDS = [
  { from: -Infinity, to: 120, key: "normal" },
  { from: 120, to: 130, key: "elevated" },
  { from: 130, to: 140, key: "stage1" },
  { from: 140, to: 180, key: "stage2" },
  { from: 180, to: Infinity, key: "crisis" }
];

const SERIES = [
  { key: "systolic", accessor: (r) => r.ta_systolic, color: "var(--series-sys)", dashed: false },
  { key: "diastolic", accessor: (r) => r.ta_diastolic, color: "var(--series-dia)", dashed: false },
  { key: "heartRate", accessor: (r) => r.heart_rate, color: "var(--series-hr)", dashed: true }
];

function buildScaleY(ordered) {
  const allValues = ordered.flatMap((r) => [r.ta_systolic, r.ta_diastolic, r.heart_rate]);
  const rawMin = Math.min(...allValues, 40);
  const rawMax = Math.max(...allValues, 160);
  const yMin = Math.floor(rawMin / 10) * 10;
  const yMax = Math.ceil(rawMax / 10) * 10;
  const span = yMax - yMin || 1;
  return { scaleY: (v) => PADDING + ((yMax - v) / span) * (CHART_HEIGHT - PADDING * 2), yMin, yMax };
}

function getStepX(count) {
  return count === 1 ? CHART_WIDTH / 2 - PADDING : (CHART_WIDTH - PADDING * 2) / (count - 1);
}

function getPointX(index, count) {
  return PADDING + index * getStepX(count);
}

/** Convierte una lista de puntos en una curva suave (Catmull-Rom -> Bezier). */
function smoothLine(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
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

function seriesPoints(ordered, accessor, scaleY) {
  return ordered.map((rec, i) => [getPointX(i, ordered.length), scaleY(accessor(rec))]);
}

function buildBands(scaleY, yMin, yMax) {
  const plotRight = CHART_WIDTH - PADDING / 2;
  return REFERENCE_BANDS.map((band) => {
    const top = Math.min(band.to, yMax);
    const bottom = Math.max(band.from, yMin);
    if (top <= bottom) return "";
    const yTop = scaleY(top);
    const height = scaleY(bottom) - yTop;
    const category = getCategory(band.key);
    return `<rect x="${PADDING}" y="${yTop.toFixed(1)}" width="${plotRight - PADDING}" height="${height.toFixed(1)}" fill="${category.tint}"/>`;
  }).join("");
}

export function createChartMarkup(records, visibility = { systolic: true, diastolic: true, heartRate: true }) {
  if (!records.length) {
    return `<div class="empty-state">${heartIcon()}<span>No hay datos para dibujar la evolucion en el rango seleccionado.</span></div>`;
  }

  const ordered = [...records].sort(
    (a, b) => new Date(`${a.record_date}T${a.record_time}`) - new Date(`${b.record_date}T${b.record_time}`)
  );

  const { scaleY, yMin, yMax } = buildScaleY(ordered);
  const yStep = yMax - yMin <= 100 ? 20 : 40;
  const baseline = CHART_HEIGHT - PADDING;

  const gridLines = [];
  for (let v = yMin; v <= yMax; v += yStep) {
    const y = scaleY(v);
    gridLines.push(`
      <line x1="${PADDING}" y1="${y}" x2="${CHART_WIDTH - PADDING / 2}" y2="${y}" stroke="rgba(120,120,120,0.18)" stroke-width="1" stroke-dasharray="4 4"/>
      <text x="${PADDING - 6}" y="${y + 4}" text-anchor="end" class="chart-axis-label">${v}</text>
    `);
  }

  const labelY = CHART_HEIGHT - PADDING + 14;
  const labels = ordered
    .map((rec, i) => {
      const x = getPointX(i, ordered.length);
      return `<text x="${x}" y="${labelY}" text-anchor="end" class="chart-label" transform="rotate(-45, ${x}, ${labelY})">${formatDisplayDate(rec.record_date)}</text>`;
    })
    .join("");

  // Puntos invisibles para el tooltip (cubren toda la columna).
  const hitCircles = ordered
    .map((rec, i) => {
      const x = getPointX(i, ordered.length);
      return `<rect class="chart-hit" x="${x - getStepX(ordered.length) / 2}" y="${PADDING}" width="${getStepX(ordered.length) || CHART_WIDTH}" height="${CHART_HEIGHT - PADDING * 2}"
        data-x="${x}" data-sys="${rec.ta_systolic}" data-dia="${rec.ta_diastolic}"
        data-hr="${rec.heart_rate}" data-date="${formatDisplayDate(rec.record_date)}"
        data-time="${rec.record_time.slice(0, 5)}" fill="transparent"/>`;
    })
    .join("");

  const seriesMarkup = SERIES.map((serie) => {
    if (!visibility[serie.key]) return "";
    const points = seriesPoints(ordered, serie.accessor, scaleY);
    const line = smoothLine(points);
    const area = points.length > 1 ? `${line} L ${points[points.length - 1][0].toFixed(2)} ${baseline} L ${points[0][0].toFixed(2)} ${baseline} Z` : "";
    const dash = serie.dashed ? ` stroke-dasharray="10 10"` : "";

    const areaPath = area
      ? `<path d="${area}" fill="${serie.color}" fill-opacity="0.08" stroke="none"/>`
      : "";
    const linePath = `<path data-animate-line d="${line}" fill="none" style="stroke:${serie.color};" stroke-width="3"${dash} stroke-linecap="round" stroke-linejoin="round"/>`;
    const dots = points
      .map(([x, y]) => `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4" style="fill:${serie.color};"/>`)
      .join("");

    return `${areaPath}${linePath}${dots}`;
  }).join("");

  return `
    <div class="chart-container">
      <div class="chart" style="position:relative;">
        <svg viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT + LABEL_AREA}" role="img" aria-label="Grafica de evolucion de tension arterial y frecuencia cardiaca">
          ${buildBands(scaleY, yMin, yMax)}
          ${gridLines.join("")}
          <line x1="${PADDING}" y1="${PADDING}" x2="${PADDING}" y2="${baseline}" stroke="rgba(120,120,120,0.3)" stroke-width="1"/>
          <line x1="${PADDING}" y1="${baseline}" x2="${CHART_WIDTH - PADDING / 2}" y2="${baseline}" stroke="rgba(120,120,120,0.3)" stroke-width="1"/>
          <text x="${PADDING / 2 - 4}" y="${CHART_HEIGHT / 2}" text-anchor="middle" class="chart-axis-label" transform="rotate(-90, ${PADDING / 2 - 4}, ${CHART_HEIGHT / 2})">mmHg / lpm</text>
          ${seriesMarkup}
          ${labels}
          ${hitCircles}
        </svg>
        <div class="chart-tooltip" role="tooltip"></div>
      </div>
      <div class="chart-legend-bar">
        <div class="chart-legend">
          <button class="chart-legend-item${visibility.systolic ? "" : " chart-legend-item--off"}" data-series="systolic" type="button" aria-pressed="${visibility.systolic}">
            <span class="chart-legend-dot chart-legend-dot--sys"></span>TA Sistolica
          </button>
          <button class="chart-legend-item${visibility.diastolic ? "" : " chart-legend-item--off"}" data-series="diastolic" type="button" aria-pressed="${visibility.diastolic}">
            <span class="chart-legend-dot chart-legend-dot--dia"></span>TA Diastolica
          </button>
          <button class="chart-legend-item${visibility.heartRate ? "" : " chart-legend-item--off"}" data-series="heartRate" type="button" aria-pressed="${visibility.heartRate}">
            <span class="chart-legend-dot chart-legend-dot--hr"></span>Frecuencia Cardiaca
          </button>
        </div>
        <a href="chart.html" target="_blank" class="chart-expand-btn ghost-button" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;" aria-hidden="true">
            <polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
          Expandir grafica
        </a>
      </div>
    </div>
  `;
}

function heartIcon() {
  return `<svg class="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

export function bindChartTooltip(container) {
  const svg = container.querySelector("svg");
  const tooltip = container.querySelector(".chart-tooltip");
  const hits = Array.from(container.querySelectorAll(".chart-hit"));

  if (!svg || !tooltip || !hits.length) return;

  function showAt(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * CHART_WIDTH;

    let closest = null;
    let minDist = Infinity;
    hits.forEach((hit) => {
      const dist = Math.abs(Number(hit.dataset.x) - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = hit;
      }
    });

    if (!closest) {
      tooltip.style.display = "none";
      return;
    }

    tooltip.innerHTML = `
      <strong>${closest.dataset.date}</strong> · ${closest.dataset.time}<br/>
      TA: <strong>${closest.dataset.sys}/${closest.dataset.dia}</strong> mmHg<br/>
      FC: <strong>${closest.dataset.hr}</strong> lpm
    `;
    tooltip.style.display = "block";

    const tipX = clientX - rect.left;
    const tipY = clientY - rect.top;
    const toRight = tipX < rect.width * 0.6;
    tooltip.style.left = toRight ? tipX + 14 + "px" : "auto";
    tooltip.style.right = toRight ? "auto" : rect.width - tipX + 14 + "px";
    tooltip.style.top = Math.max(4, tipY - 60) + "px";
  }

  const hide = () => {
    tooltip.style.display = "none";
  };

  svg.addEventListener("mousemove", (e) => showAt(e.clientX, e.clientY));
  svg.addEventListener("mouseleave", hide);

  // Soporte tactil
  svg.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    if (touch) showAt(touch.clientX, touch.clientY);
  }, { passive: true });
  svg.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    if (touch) showAt(touch.clientX, touch.clientY);
  }, { passive: true });
  svg.addEventListener("touchend", hide);
}
