import { createChartMarkup, SERIES } from "./chart.js";
import { bpBadge, statTile, distributionBar, categoryGauge, emptyState } from "./components.js";
import { icon } from "./icons.js";
import { formatDisplayDate, formatTime, describeRange } from "../utils/date.js";
import { escHtml } from "../utils/html.js";
import { classifyRecord, BP_CATEGORIES } from "../utils/bpClassification.js";

const RANGES = [
  { value: "7", label: "7 días" },
  { value: "15", label: "15 días" },
  { value: "30", label: "1 mes" },
  { value: "180", label: "6 meses" },
  { value: "custom", label: "Personalizado" }
];

const RECENT_COUNT = 5;

/** Saludo según la hora: pequeño detalle que hace la app menos impersonal. */
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Tarjeta de la última medición: la cifra principal de la pantalla. */
function latestCard(records) {
  if (!records.length) return "";

  const latest = records[0];
  const category = classifyRecord(latest);

  return `
    <article class="card latest-card" style="--cat-color:${category.color};">
      <div class="latest-main">
        <span class="stat-label">Última medición</span>
        <span class="latest-value">
          ${latest.ta_systolic}<span style="color:var(--muted); font-weight:400;">/</span>${latest.ta_diastolic}
          <span class="unit">mmHg</span>
        </span>
        <div class="latest-meta">
          <span>${escHtml(formatDisplayDate(latest.record_date))}</span>
          <span class="dot-sep"></span>
          <span>${escHtml(formatTime(latest.record_time))}</span>
          <span class="dot-sep"></span>
          <span>${latest.heart_rate} lpm</span>
          <span class="dot-sep"></span>
          <span>${escHtml(latest.position)}</span>
        </div>
      </div>
      <div class="latest-side">
        ${categoryGauge(category)}
        ${bpBadge(category)}
        <p class="latest-advice">${escHtml(category.advice)}</p>
      </div>
    </article>
  `;
}

/** Frase que interpreta el periodo, para no dejar los números solos. */
function insight(stats, filters) {
  if (!stats.count) {
    return `
      <div class="insight">
        ${icon("info", { size: 17 })}
        <span>No hay lecturas en ${escHtml(describeRange(filters.range))}. Prueba con un periodo más amplio.</span>
      </div>
    `;
  }

  const crisis = stats.distribution.crisis || 0;
  if (crisis > 0) {
    return `
      <div class="insight insight--alert">
        ${icon("alert", { size: 17 })}
        <span>
          <strong>${crisis} lectura${crisis > 1 ? "s" : ""} en rango de crisis hipertensiva.</strong>
          Si se repite, consulta con tu médico.
        </span>
      </div>
    `;
  }

  const dominant = BP_CATEGORIES.reduce((best, category) =>
    stats.distribution[category.key] > stats.distribution[best.key] ? category : best
  );
  const pct = Math.round((stats.distribution[dominant.key] / stats.count) * 100);

  return `
    <div class="insight">
      ${icon("info", { size: 17 })}
      <span>
        De tus <strong>${stats.count}</strong> lecturas en ${escHtml(describeRange(filters.range))},
        el <strong>${pct}%</strong> fueron <strong>${escHtml(dominant.label)}</strong>.
      </span>
    </div>
  `;
}

/** Lista compacta de las últimas lecturas. La tabla completa vive en Historial. */
function recentList(records) {
  if (!records.length) {
    return emptyState({
      iconName: "pulse",
      title: "Aún no tienes mediciones",
      description: "Agrega la primera y empezarás a ver tus promedios y tendencias.",
      action: `<button id="empty-add-record" class="button" type="button">${icon("plus", { size: 17 })} Agregar medición</button>`
    });
  }

  const rows = records
    .slice(0, RECENT_COUNT)
    .map((record) => {
      const category = classifyRecord(record);
      return `
        <tr>
          <td data-label="Fecha">
            ${escHtml(formatDisplayDate(record.record_date))}
            <span class="helper"> · ${escHtml(formatTime(record.record_time))}</span>
          </td>
          <td data-label="Tensión" class="tnum"><strong>${record.ta_systolic}/${record.ta_diastolic}</strong></td>
          <td data-label="Categoría">${bpBadge(category, { compact: true })}</td>
          <td data-label="Pulso" class="tnum">${record.heart_rate} lpm</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="table-as-cards">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Tensión</th><th>Categoría</th><th>Pulso</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function createDashboardView({ profile, records, stats, filters, chartVisibility }) {
  const firstName = (profile?.first_name ?? "").trim();

  // Series cronológicas para las miniaturas.
  const chrono = [...stats.filtered].sort(
    (a, b) => new Date(`${a.record_date}T${a.record_time}`) - new Date(`${b.record_date}T${b.record_time}`)
  );

  const rangeChips = RANGES.map(
    (range) =>
      `<button class="range-chip ${filters.range === range.value ? "active" : ""}" data-range="${range.value}" type="button"
        aria-pressed="${filters.range === range.value}">${range.label}</button>`
  ).join("");

  const [sys, dia, hr] = SERIES;

  return `
    <section class="page-head">
      <div class="greeting">
        <h1>${greeting()}${firstName ? `, ${escHtml(firstName)}` : ""}</h1>
        <p class="helper">Este es el resumen de tu tensión arterial.</p>
      </div>
      <button id="open-record-modal" class="button" type="button">
        ${icon("plus", { size: 17 })} Agregar medición
      </button>
    </section>

    ${latestCard(records)}

    <article class="card">
      <div class="card-head">
        <div>
          <h3>Resumen del periodo</h3>
          <p class="helper">Promedios y evolución del rango que elijas.</p>
        </div>
      </div>

      <div class="range-chips" role="group" aria-label="Rango de tiempo">${rangeChips}</div>

      <div id="custom-range-fields" class="range-controls ${filters.range === "custom" ? "" : "hidden"}">
        <div class="field">
          <label for="custom-start">Desde</label>
          <input id="custom-start" type="date" value="${escHtml(filters.customStart)}" />
        </div>
        <div class="field">
          <label for="custom-end">Hasta</label>
          <input id="custom-end" type="date" value="${escHtml(filters.customEnd)}" />
        </div>
        <button id="apply-custom-range" class="ghost-button" type="button">Aplicar</button>
      </div>

      <div style="margin-top:14px;">${insight(stats, filters)}</div>

      <div class="stat-grid stagger" style="margin-top:14px;">
        ${statTile({
          label: "Sistólica",
          value: stats.averageSystolic,
          unit: "mmHg",
          trend: stats.trend?.systolic,
          series: chrono.map((record) => record.ta_systolic),
          color: sys.color
        })}
        ${statTile({
          label: "Diastólica",
          value: stats.averageDiastolic,
          unit: "mmHg",
          trend: stats.trend?.diastolic,
          series: chrono.map((record) => record.ta_diastolic),
          color: dia.color
        })}
        ${statTile({
          label: "Frecuencia",
          value: stats.averageHeartRate,
          unit: "lpm",
          trend: stats.trend?.heartRate,
          series: chrono.map((record) => record.heart_rate),
          color: hr.color,
          dashed: true
        })}
      </div>

      <div style="margin-top:20px;">
        ${createChartMarkup(stats.filtered, chartVisibility, { compact: true })}
      </div>

      <div style="margin-top:20px;">
        <h4 style="margin-bottom:10px;">Distribución por categoría</h4>
        ${distributionBar(stats.distribution, stats.count)}
      </div>
    </article>

    <article class="card">
      <div class="card-head">
        <div>
          <h3>Últimas mediciones</h3>
          <p class="helper">Las ${RECENT_COUNT} más recientes de tu historial.</p>
        </div>
        ${
          records.length
            ? `<a href="history.html" class="ghost-button ghost-button--sm">Ver todo el historial ${icon("chevronRight", { size: 15 })}</a>`
            : ""
        }
      </div>
      ${recentList(records)}
    </article>

    <button id="fab-add" class="fab" type="button" aria-label="Agregar medición">
      ${icon("plus", { size: 21, strokeWidth: 2.4 })} Agregar
    </button>
  `;
}

/** Esqueleto de carga: mantiene el marco mientras llegan los datos. */
export function createDashboardSkeleton() {
  return `
    <div class="skeleton" style="height:34px; width:220px;"></div>
    <article class="card"><div class="skeleton" style="height:96px;"></div></article>
    <article class="card">
      <div class="skeleton" style="height:42px; margin-bottom:14px;"></div>
      <div class="stat-grid">
        <div class="skeleton" style="height:96px;"></div>
        <div class="skeleton" style="height:96px;"></div>
        <div class="skeleton" style="height:96px;"></div>
      </div>
      <div class="skeleton" style="height:260px; margin-top:18px;"></div>
    </article>
  `;
}
