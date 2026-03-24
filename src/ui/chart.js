import { formatDisplayDate } from "../utils/date.js";

function getScaler(records, height, padding) {
  const values = records.flatMap((record) => [record.ta_systolic, record.ta_diastolic, record.heart_rate]);
  const min = Math.min(...values, 40);
  const max = Math.max(...values, 160);
  const span = max - min || 1;

  return (value) => padding + ((max - value) / span) * (height - padding * 2);
}

function buildPath(records, accessor, width, height, padding) {
  if (!records.length) return "";

  const stepX = records.length === 1 ? width / 2 : (width - padding * 2) / (records.length - 1);
  const scale = getScaler(records, height, padding);

  return records
    .map((record, index) => {
      const x = padding + index * stepX;
      const y = scale(accessor(record));
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export function createChartMarkup(records) {
  if (!records.length) {
    return `<div class="empty-state">No hay datos para dibujar la evolucion en el rango seleccionado.</div>`;
  }

  const width = 800;
  const height = 280;
  const padding = 34;
  const ordered = [...records].sort(
    (left, right) => new Date(`${left.record_date}T${left.record_time}`) - new Date(`${right.record_date}T${right.record_time}`)
  );
  const labels = ordered
    .map((record, index) => {
      const x = padding + (ordered.length === 1 ? width / 2 : (index * (width - padding * 2)) / (ordered.length - 1));
      return `<text x="${x}" y="${height - 12}" text-anchor="middle" class="chart-label">${formatDisplayDate(record.record_date)}</text>`;
    })
    .join("");

  return `
    <div class="chart">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafica de evolucion de tension arterial y frecuencia cardiaca">
        <defs>
          <linearGradient id="line-sys" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ab3b30" />
            <stop offset="100%" stop-color="#7d261d" />
          </linearGradient>
          <linearGradient id="line-dia" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#23654f" />
            <stop offset="100%" stop-color="#194a39" />
          </linearGradient>
          <linearGradient id="line-hr" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#c58b2c" />
            <stop offset="100%" stop-color="#8c6215" />
          </linearGradient>
        </defs>
        <path d="${buildPath(ordered, (record) => record.ta_systolic, width, height, padding)}" fill="none" stroke="url(#line-sys)" stroke-width="4" stroke-linecap="round" />
        <path d="${buildPath(ordered, (record) => record.ta_diastolic, width, height, padding)}" fill="none" stroke="url(#line-dia)" stroke-width="4" stroke-linecap="round" />
        <path d="${buildPath(ordered, (record) => record.heart_rate, width, height, padding)}" fill="none" stroke="url(#line-hr)" stroke-width="4" stroke-dasharray="10 10" stroke-linecap="round" />
        ${labels}
      </svg>
    </div>
    <div class="range-controls" style="margin-top: 14px; justify-content: flex-start;">
      <span class="chip">TA sistolica</span>
      <span class="chip" style="background: rgba(35, 101, 79, 0.12); color: #23654f;">TA diastolica</span>
      <span class="chip" style="background: rgba(197, 139, 44, 0.16); color: #8c6215;">Frecuencia cardiaca</span>
    </div>
  `;
}
