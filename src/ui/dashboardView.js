import { createChartMarkup } from "./chart.js";
import { bpBadge, trendIndicator, sparkline, distributionBar } from "./components.js";
import { icon } from "./icons.js";
import { formatDisplayDate } from "../utils/date.js";
import { escHtml } from "../utils/html.js";
import { classifyRecord, BP_CATEGORIES } from "../utils/bpClassification.js";
import { processRecords, DEFAULT_TABLE_STATE } from "../utils/recordsTable.js";

const POSITIONS = ["Sentado", "Acostado", "De pie"];

/** Tarjeta destacada con la lectura mas reciente. */
function createLatestCard(records) {
  if (!records.length) return "";

  const latest = records[0];
  const category = classifyRecord(latest);

  return `
    <article class="card latest-card" style="--cat-color:${category.color};">
      <div class="latest-reading">
        <span class="stat-label">Ultima medicion</span>
        <span class="latest-value">${latest.ta_systolic}/${latest.ta_diastolic} <small>mmHg</small></span>
        <span class="helper">${formatDisplayDate(latest.record_date)} · ${latest.record_time.slice(0, 5)} · ${latest.heart_rate} lpm</span>
      </div>
      <div class="latest-meta">
        ${bpBadge(category)}
        <p class="latest-advice">${category.advice}</p>
      </div>
    </article>
  `;
}

function createStatBox(label, value, trend, series, color) {
  return `
    <article class="stat-box">
      <div class="stat-top">
        <span class="stat-label">${label}</span>
        ${trendIndicator(trend)}
      </div>
      <strong data-count="${value || 0}">${value || "--"}</strong>
      ${sparkline(series, { color })}
    </article>
  `;
}

function buildInsight(stats) {
  if (!stats.count) {
    return `Aun no hay lecturas en este rango. Agrega una medicion para ver tus tendencias.`;
  }

  const crisis = stats.distribution.crisis || 0;
  if (crisis > 0) {
    return `Atencion: ${crisis} lectura${crisis > 1 ? "s" : ""} en rango de crisis hipertensiva. Considera consultar a tu medico.`;
  }

  const dominant = BP_CATEGORIES.reduce((best, category) =>
    stats.distribution[category.key] > stats.distribution[best.key] ? category : best
  );
  const count = stats.distribution[dominant.key];
  const pct = Math.round((count / stats.count) * 100);
  return `La mayoria de tus ${stats.count} lecturas (${pct}%) fueron <strong>${dominant.label}</strong> en este periodo.`;
}

/** Cuerpo de la tabla de registros: barra de herramientas, tabla y paginacion. */
export function createRecordsTableSection(records, tableState) {
  if (!records.length) {
    return `
      <div class="empty-state">
        ${icon("heart", { size: 32 })}
        <div>
          <strong>Aun no tienes registros.</strong>
          <p class="helper" style="margin:6px 0 0;">Agrega tu primera medicion para empezar a ver tus estadisticas y tendencias.</p>
        </div>
        <button id="empty-add-record" class="button button-icon" type="button">${icon("plus", { size: 18 })} Agregar primera medicion</button>
      </div>
    `;
  }

  const { rows, total, totalPages, page } = processRecords(records, tableState);

  const positionOptions = ["all", ...POSITIONS]
    .map((value) => `<option value="${value}" ${tableState.filterPosition === value ? "selected" : ""}>${value === "all" ? "Todas las posiciones" : value}</option>`)
    .join("");

  const categoryOptions = ["all", ...BP_CATEGORIES.map((c) => c.key)]
    .map((value) => {
      const label = value === "all" ? "Todas las categorias" : BP_CATEGORIES.find((c) => c.key === value).label;
      return `<option value="${value}" ${tableState.filterCategory === value ? "selected" : ""}>${label}</option>`;
    })
    .join("");

  const caret = (key) =>
    tableState.sortKey === key ? `<span class="sort-caret">${tableState.sortDir === "asc" ? "▲" : "▼"}</span>` : `<span class="sort-caret">↕</span>`;

  const sortedClass = (key) => (tableState.sortKey === key ? "sortable sorted" : "sortable");

  return `
    <div class="table-toolbar">
      <select id="filter-position" aria-label="Filtrar por posicion">${positionOptions}</select>
      <select id="filter-category" aria-label="Filtrar por categoria">${categoryOptions}</select>
      <span class="helper" style="margin-left:auto;">${total} registro${total === 1 ? "" : "s"}</span>
    </div>
    <div class="table-wrapper table-as-cards">
      <table>
        <thead>
          <tr>
            <th class="${sortedClass("datetime")}" data-sort="datetime">Fecha / Hora ${caret("datetime")}</th>
            <th class="${sortedClass("systolic")}" data-sort="systolic">TA ${caret("systolic")}</th>
            <th>Categoria</th>
            <th class="${sortedClass("heartRate")}" data-sort="heartRate">FC ${caret("heartRate")}</th>
            <th>Posicion</th>
            <th>Observaciones</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>${createRows(rows)}</tbody>
      </table>
    </div>
    ${totalPages > 1 ? `
      <div class="pagination">
        <button id="page-prev" ${page <= 1 ? "disabled" : ""} type="button">Anterior</button>
        <span>Pagina ${page} de ${totalPages}</span>
        <button id="page-next" ${page >= totalPages ? "disabled" : ""} type="button">Siguiente</button>
      </div>
    ` : ""}
  `;
}

function createRows(records) {
  if (!records.length) {
    return `
      <tr>
        <td colspan="7">
          <div class="empty-state">No hay registros que coincidan con los filtros.</div>
        </td>
      </tr>
    `;
  }

  return records
    .map((record) => {
      const category = classifyRecord(record);
      return `
        <tr>
          <td data-label="Fecha / Hora">${formatDisplayDate(record.record_date)} · ${record.record_time.slice(0, 5)}</td>
          <td data-label="TA">${escHtml(record.taLabel ?? `${record.ta_systolic}/${record.ta_diastolic}`)}</td>
          <td data-label="Categoria">${bpBadge(category, { compact: true })}</td>
          <td data-label="FC">${record.heart_rate}</td>
          <td data-label="Posicion">${escHtml(record.position)}</td>
          <td data-label="Observaciones">${record.observations ? escHtml(record.observations) : "-"}</td>
          <td data-label="Acciones">
            <a href="settings.html?tab=records" class="table-link">Editar / Eliminar</a>
          </td>
        </tr>
      `;
    })
    .join("");
}

export function createDashboardView({ profile, records, stats, filters, chartVisibility, tableState = DEFAULT_TABLE_STATE }) {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const customRangeVisible = filters.range === "custom" ? "" : "hidden";

  // Series cronologicas para los sparklines.
  const chrono = [...stats.filtered].sort(
    (a, b) => new Date(`${a.record_date}T${a.record_time}`) - new Date(`${b.record_date}T${b.record_time}`)
  );
  const sysSeries = chrono.map((r) => r.ta_systolic);
  const diaSeries = chrono.map((r) => r.ta_diastolic);
  const hrSeries = chrono.map((r) => r.heart_rate);

  const RANGES = [
    { value: "7", label: "7 dias" },
    { value: "15", label: "15 dias" },
    { value: "30", label: "1 mes" },
    { value: "180", label: "6 meses" },
    { value: "custom", label: "Personalizado" }
  ];

  const rangeChips = RANGES.map(
    (range) =>
      `<button class="range-chip ${filters.range === range.value ? "active" : ""}" data-range="${range.value}" type="button">${range.label}</button>`
  ).join("");

  return `
    <section class="dashboard-layout">
      <article class="panel dashboard-header">
        <div>
          <p class="eyebrow">Panel principal</p>
          <h2>Hola, ${escHtml(fullName || "usuario")}.</h2>
          <p class="helper">Consulta tus registros, agrega nuevas mediciones y sigue la evolucion de tus datos.</p>
        </div>
        <div class="header-actions">
          <button id="open-record-modal" class="button button-icon" type="button">${icon("plus", { size: 18 })} Agregar registro</button>
          <a href="settings.html" class="ghost-button button-icon" style="text-decoration:none;">${icon("settings", { size: 18 })} Configuracion</a>
          <button id="logout-button" class="ghost-button button-icon" type="button">${icon("logout", { size: 18 })} Salir</button>
        </div>
      </article>

      ${createLatestCard(records)}

      <section class="grid">
        <article class="card">
          <div class="card-head">
            <div>
              <h3>Estadisticas</h3>
              <p class="helper">Resumen del periodo seleccionado.</p>
            </div>
          </div>

          <div class="range-chips" role="group" aria-label="Rango de tiempo">${rangeChips}</div>

          <div id="custom-range-fields" class="range-controls ${customRangeVisible}" style="margin-top:14px;">
            <div class="field">
              <label for="custom-start">Fecha inicio</label>
              <input id="custom-start" type="date" value="${filters.customStart}" />
            </div>
            <div class="field">
              <label for="custom-end">Fecha fin</label>
              <input id="custom-end" type="date" value="${filters.customEnd}" />
            </div>
            <button id="apply-custom-range" class="ghost-button" type="button">Aplicar rango</button>
          </div>

          <div class="insight" style="margin-top:16px;">
            ${icon("heart", { size: 18 })}
            <span>${buildInsight(stats)}</span>
          </div>

          <div class="stat-grid stagger">
            ${createStatBox("Promedio sistolica", stats.averageSystolic, stats.trend?.systolic, sysSeries, "var(--series-sys)")}
            ${createStatBox("Promedio diastolica", stats.averageDiastolic, stats.trend?.diastolic, diaSeries, "var(--series-dia)")}
            ${createStatBox("Promedio FC", stats.averageHeartRate, stats.trend?.heartRate, hrSeries, "var(--series-hr)")}
          </div>

          ${createChartMarkup(stats.filtered, chartVisibility)}

          <div>
            <h4 style="margin:18px 0 0;">Distribucion por categoria</h4>
            ${distributionBar(stats.distribution, stats.count)}
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <div>
              <h3>Perfil</h3>
              <p class="helper">Datos asociados a tu cuenta.</p>
            </div>
            <a href="settings.html" class="ghost-button" style="text-decoration:none; font-size:0.88rem;">Editar perfil</a>
          </div>
          <div class="confirm-list">
            <div><strong>Nombre</strong><span>${escHtml(fullName || "-")}</span></div>
            <div><strong>Documento</strong><span>${escHtml(profile.document_number)}</span></div>
            <div><strong>Edad</strong><span>${profile.age}</span></div>
            <div><strong>Correo</strong><span>${escHtml(profile.email)}</span></div>
          </div>
        </article>
      </section>

      <article class="card">
        <div class="card-head">
          <div>
            <h3>Tabla de registros</h3>
            <p class="helper">Ordena por columna, filtra y navega por paginas.</p>
          </div>
          <button id="download-excel" class="ghost-button button-icon" type="button" style="white-space:nowrap; flex-shrink:0;">
            ${icon("download", { size: 18 })} Descargar Excel
          </button>
        </div>
        <div id="records-table-section">
          ${createRecordsTableSection(records, tableState)}
        </div>
      </article>

      <button id="fab-add" class="fab" type="button" aria-label="Agregar registro">${icon("plus", { size: 26, strokeWidth: 2.5 })}</button>
    </section>
  `;
}
