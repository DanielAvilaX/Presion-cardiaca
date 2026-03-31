import { createChartMarkup } from "./chart.js";
import { formatDisplayDate } from "../utils/date.js";
import { escHtml } from "../utils/html.js";

function createRows(records) {
  if (!records.length) {
    return `
      <tr>
        <td colspan="7">
          <div class="empty-state">Todavia no tienes registros. Usa el boton de agregar para crear el primero.</div>
        </td>
      </tr>
    `;
  }

  return records
    .map(
      (record) => `
        <tr>
          <td>${formatDisplayDate(record.record_date)}</td>
          <td>${record.record_time.slice(0, 5)}</td>
          <td>${escHtml(record.taLabel)}</td>
          <td>${record.heart_rate}</td>
          <td>${escHtml(record.position)}</td>
          <td>${record.observations ? escHtml(record.observations) : "-"}</td>
          <td>
            <a href="settings.html?tab=records" class="table-link">Editar / Eliminar</a>
          </td>
        </tr>
      `
    )
    .join("");
}

export function createDashboardView({ profile, records, stats, filters, chartVisibility }) {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const customRangeVisible = filters.range === "custom" ? "" : "hidden";

  return `
    <section class="dashboard-layout">
      <article class="panel dashboard-header">
        <div>
          <p class="eyebrow">Panel principal</p>
          <h2>Hola, ${escHtml(fullName || "usuario")}.</h2>
          <p class="helper">Consulta tus registros, agrega nuevas mediciones y sigue la evolucion de tus datos.</p>
        </div>
        <div class="range-controls">
          <button id="open-record-modal" class="button" type="button">Agregar registro</button>
          <a href="settings.html" class="ghost-button" style="text-decoration:none; text-align:center;">Configuracion</a>
          <button id="logout-button" class="ghost-button" type="button">Cerrar sesion</button>
        </div>
      </article>

      <section class="grid">
        <article class="card">
          <div class="card-head">
            <div>
              <h3>Estadisticas</h3>
              <p class="helper">Rango por defecto: ultimos 7 dias.</p>
            </div>
            <select id="range-select">
              <option value="7" ${filters.range === "7" ? "selected" : ""}>7 dias</option>
              <option value="15" ${filters.range === "15" ? "selected" : ""}>15 dias</option>
              <option value="30" ${filters.range === "30" ? "selected" : ""}>1 mes</option>
              <option value="180" ${filters.range === "180" ? "selected" : ""}>6 meses</option>
              <option value="custom" ${filters.range === "custom" ? "selected" : ""}>Personalizado</option>
            </select>
          </div>

          <div id="custom-range-fields" class="range-controls ${customRangeVisible}">
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

          <div class="stat-grid">
            <article class="stat-box">
              <span>Promedio sistolica</span>
              <strong>${stats.averageSystolic || "--"}</strong>
            </article>
            <article class="stat-box">
              <span>Promedio diastolica</span>
              <strong>${stats.averageDiastolic || "--"}</strong>
            </article>
            <article class="stat-box">
              <span>Promedio FC</span>
              <strong>${stats.averageHeartRate || "--"}</strong>
            </article>
          </div>

          ${createChartMarkup(stats.filtered, chartVisibility)}
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
            <p class="helper">Se muestran todos tus registros, del mas reciente al mas antiguo.</p>
          </div>
          <button id="download-excel" class="ghost-button" type="button" style="white-space:nowrap; flex-shrink:0;">
            Descargar Excel
          </button>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>TA</th>
                <th>FC</th>
                <th>Posicion</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>${createRows(records)}</tbody>
          </table>
        </div>
      </article>
    </section>
  `;
}
