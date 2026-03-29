import { formatDisplayDate } from "../utils/date.js";

const CHART_WIDTH = 800;
const CHART_HEIGHT = 300;
const PADDING = 48;

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

function buildPath(ordered, accessor, scaleY) {
  return ordered
    .map((rec, i) => {
      const x = getPointX(i, ordered.length);
      const y = scaleY(accessor(rec));
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export function createChartMarkup(records, visibility = { systolic: true, diastolic: true, heartRate: true }) {
  if (!records.length) {
    return `<div class="empty-state">No hay datos para dibujar la evolucion en el rango seleccionado.</div>`;
  }

  const ordered = [...records].sort(
    (a, b) => new Date(`${a.record_date}T${a.record_time}`) - new Date(`${b.record_date}T${b.record_time}`)
  );

  const { scaleY, yMin, yMax } = buildScaleY(ordered);
  const yStep = (yMax - yMin) <= 100 ? 20 : 40;

  const gridLines = [];
  for (let v = yMin; v <= yMax; v += yStep) {
    const y = scaleY(v);
    gridLines.push(`
      <line x1="${PADDING}" y1="${y}" x2="${CHART_WIDTH - PADDING / 2}" y2="${y}" stroke="rgba(79,59,35,0.1)" stroke-width="1" stroke-dasharray="4 4"/>
      <text x="${PADDING - 6}" y="${y + 4}" text-anchor="end" class="chart-axis-label">${v}</text>
    `);
  }

  const labels = ordered
    .map((rec, i) => {
      const x = getPointX(i, ordered.length);
      return `<text x="${x}" y="${CHART_HEIGHT - 8}" text-anchor="middle" class="chart-label">${formatDisplayDate(rec.record_date)}</text>`;
    })
    .join("");

  // Puntos invisibles para el tooltip (cubren toda la zona de toque)
  const hitCircles = ordered
    .map((rec, i) => {
      const x = getPointX(i, ordered.length);
      return `<circle class="chart-hit" cx="${x}" cy="${CHART_HEIGHT / 2}" r="999"
        data-x="${x}" data-sys="${rec.ta_systolic}" data-dia="${rec.ta_diastolic}"
        data-hr="${rec.heart_rate}" data-date="${formatDisplayDate(rec.record_date)}"
        data-time="${rec.record_time.slice(0, 5)}" fill="transparent" style="cursor:crosshair;"/>`;
    })
    .join("");

  // Puntos visibles en cada serie
  const sysPoints = visibility.systolic
    ? ordered.map((rec, i) => {
        const x = getPointX(i, ordered.length);
        const y = scaleY(rec.ta_systolic);
        return `<circle cx="${x}" cy="${y}" r="4" fill="#ab3b30"/>`;
      }).join("")
    : "";
  const diaPoints = visibility.diastolic
    ? ordered.map((rec, i) => {
        const x = getPointX(i, ordered.length);
        const y = scaleY(rec.ta_diastolic);
        return `<circle cx="${x}" cy="${y}" r="4" fill="#23654f"/>`;
      }).join("")
    : "";
  const hrPoints = visibility.heartRate
    ? ordered.map((rec, i) => {
        const x = getPointX(i, ordered.length);
        const y = scaleY(rec.heart_rate);
        return `<circle cx="${x}" cy="${y}" r="4" fill="#c58b2c"/>`;
      }).join("")
    : "";

  const sysPath = visibility.systolic
    ? `<path d="${buildPath(ordered, (r) => r.ta_systolic, scaleY)}" fill="none" stroke="url(#line-sys)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    : "";
  const diaPath = visibility.diastolic
    ? `<path d="${buildPath(ordered, (r) => r.ta_diastolic, scaleY)}" fill="none" stroke="url(#line-dia)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    : "";
  const hrPath = visibility.heartRate
    ? `<path d="${buildPath(ordered, (r) => r.heart_rate, scaleY)}" fill="none" stroke="url(#line-hr)" stroke-width="3" stroke-dasharray="10 10" stroke-linecap="round" stroke-linejoin="round"/>`
    : "";

  return `
    <div class="chart-container">
      <div class="chart" style="position:relative;">
        <svg viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" role="img" aria-label="Grafica de evolucion">
          <defs>
            <linearGradient id="line-sys" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#ab3b30" /><stop offset="100%" stop-color="#7d261d" />
            </linearGradient>
            <linearGradient id="line-dia" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#23654f" /><stop offset="100%" stop-color="#194a39" />
            </linearGradient>
            <linearGradient id="line-hr" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#c58b2c" /><stop offset="100%" stop-color="#8c6215" />
            </linearGradient>
          </defs>
          ${gridLines.join("")}
          <line x1="${PADDING}" y1="${PADDING}" x2="${PADDING}" y2="${CHART_HEIGHT - PADDING}" stroke="rgba(79,59,35,0.2)" stroke-width="1"/>
          <line x1="${PADDING}" y1="${CHART_HEIGHT - PADDING}" x2="${CHART_WIDTH - PADDING / 2}" y2="${CHART_HEIGHT - PADDING}" stroke="rgba(79,59,35,0.2)" stroke-width="1"/>
          <text x="${PADDING / 2 - 4}" y="${CHART_HEIGHT / 2}" text-anchor="middle" class="chart-axis-label" transform="rotate(-90, ${PADDING / 2 - 4}, ${CHART_HEIGHT / 2})">mmHg / lpm</text>
          ${sysPath}${diaPath}${hrPath}
          ${sysPoints}${diaPoints}${hrPoints}
          ${labels}
          ${hitCircles}
        </svg>
        <div class="chart-tooltip" role="tooltip"></div>
      </div>
      <div class="chart-legend-bar">
        <div class="chart-legend">
          <button class="chart-legend-item${visibility.systolic ? "" : " chart-legend-item--off"}" data-series="systolic" type="button">
            <span class="chart-legend-dot chart-legend-dot--sys"></span>TA Sistolica
          </button>
          <button class="chart-legend-item${visibility.diastolic ? "" : " chart-legend-item--off"}" data-series="diastolic" type="button">
            <span class="chart-legend-dot chart-legend-dot--dia"></span>TA Diastolica
          </button>
          <button class="chart-legend-item${visibility.heartRate ? "" : " chart-legend-item--off"}" data-series="heartRate" type="button">
            <span class="chart-legend-dot chart-legend-dot--hr"></span>Frecuencia Cardiaca
          </button>
        </div>
        <a href="chart.html" target="_blank" class="chart-expand-btn ghost-button" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
            <polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
          Expandir grafica
        </a>
      </div>
    </div>
  `;
}

export function bindChartTooltip(container) {
  const svg = container.querySelector("svg");
  const tooltip = container.querySelector(".chart-tooltip");
  const circles = Array.from(container.querySelectorAll(".chart-hit"));

  if (!svg || !tooltip || !circles.length) return;

  svg.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * CHART_WIDTH;

    let closest = null;
    let minDist = Infinity;
    circles.forEach((c) => {
      const dist = Math.abs(Number(c.dataset.x) - svgX);
      if (dist < minDist) { minDist = dist; closest = c; }
    });

    if (!closest || minDist > 80) { tooltip.style.display = "none"; return; }

    tooltip.innerHTML = `
      <strong>${closest.dataset.date}</strong> · ${closest.dataset.time}<br/>
      TA: <strong>${closest.dataset.sys}/${closest.dataset.dia}</strong> mmHg &nbsp;·&nbsp; FC: <strong>${closest.dataset.hr}</strong> lpm
    `;
    tooltip.style.display = "block";

    const tipX = e.clientX - rect.left;
    const tipY = e.clientY - rect.top;
    const toRight = tipX < rect.width * 0.6;
    tooltip.style.left  = toRight ? (tipX + 14) + "px" : "auto";
    tooltip.style.right = toRight ? "auto" : (rect.width - tipX + 14) + "px";
    tooltip.style.top   = Math.max(4, tipY - 56) + "px";
  });

  svg.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
}
