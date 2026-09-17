import { bpBadge, emptyState } from "./components.js";
import { icon } from "./icons.js";
import { formatDisplayDate, formatTime } from "../utils/date.js";
import { escHtml } from "../utils/html.js";
import { classifyRecord, BP_CATEGORIES } from "../utils/bpClassification.js";
import { processRecords } from "../utils/recordsTable.js";
import { POSITIONS } from "./modalView.js";

/**
 * Historial completo: ordenar, filtrar, buscar, paginar y editar.
 *
 * Editar y eliminar viven aquí y no en Configuración: quien quiere corregir
 * una lectura la busca en su historial, no en los ajustes de la cuenta.
 */

function selectOptions(values, selected, allLabel) {
  return [{ value: "all", label: allLabel }, ...values]
    .map(
      (option) =>
        `<option value="${escHtml(option.value)}" ${option.value === selected ? "selected" : ""}>${escHtml(option.label)}</option>`
    )
    .join("");
}

function sortCaret(state, key) {
  if (state.sortKey !== key) return `<span class="sort-caret" aria-hidden="true">↕</span>`;
  return `<span class="sort-caret" aria-hidden="true">${state.sortDir === "asc" ? "↑" : "↓"}</span>`;
}

function sortHeader(state, key, label) {
  const active = state.sortKey === key;
  const ariaSort = active ? (state.sortDir === "asc" ? "ascending" : "descending") : "none";

  return `<th class="sortable ${active ? "sorted" : ""}" data-sort="${key}" aria-sort="${ariaSort}"
    tabindex="0" role="columnheader">${label} ${sortCaret(state, key)}</th>`;
}

function rowsMarkup(rows) {
  if (!rows.length) {
    return `
      <tr>
        <td colspan="7">
          <div class="empty-state" style="padding:26px 12px;">
            <strong>Ningún registro coincide</strong>
            <p class="helper">Prueba a quitar algún filtro o a cambiar la búsqueda.</p>
          </div>
        </td>
      </tr>
    `;
  }

  return rows
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
          <td data-label="Pulso" class="tnum">${record.heart_rate}</td>
          <td data-label="Posición">${escHtml(record.position)}</td>
          <td data-label="Observaciones" class="wrap">${record.observations ? escHtml(record.observations) : "—"}</td>
          <td data-label="Acciones">
            <div class="row-actions">
              <button class="ghost-button ghost-button--sm btn-edit-rec" data-id="${record.id}" type="button"
                aria-label="Editar la medición del ${escHtml(formatDisplayDate(record.record_date))}">
                ${icon("edit", { size: 15 })} Editar
              </button>
              <button class="danger-button danger-button--sm btn-del-rec" data-id="${record.id}" type="button"
                aria-label="Eliminar la medición del ${escHtml(formatDisplayDate(record.record_date))}">
                ${icon("trash", { size: 15 })}
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

/** Solo la parte que cambia al ordenar, filtrar o paginar. */
export function createHistoryTable(records, tableState) {
  const { rows, total, totalPages, page } = processRecords(records, tableState);

  return `
    <div class="table-as-cards">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              ${sortHeader(tableState, "datetime", "Fecha")}
              ${sortHeader(tableState, "systolic", "Tensión")}
              <th>Categoría</th>
              ${sortHeader(tableState, "heartRate", "Pulso")}
              <th>Posición</th>
              <th>Observaciones</th>
              <th><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>${rowsMarkup(rows)}</tbody>
        </table>
      </div>
    </div>

    <div class="pagination">
      <span>${total} registro${total === 1 ? "" : "s"}</span>
      ${
        totalPages > 1
          ? `<span style="display:flex; align-items:center; gap:10px;">
               <button id="page-prev" type="button" ${page <= 1 ? "disabled" : ""}>${icon("chevronLeft", { size: 15 })} Anterior</button>
               <span class="tnum">${page} / ${totalPages}</span>
               <button id="page-next" type="button" ${page >= totalPages ? "disabled" : ""}>Siguiente ${icon("chevronRight", { size: 15 })}</button>
             </span>`
          : ""
      }
    </div>
  `;
}

export function createHistoryView(records, tableState) {
  if (!records.length) {
    return `
      <section class="page-head">
        <div>
          <h1>Historial</h1>
          <p class="helper">Todas tus mediciones.</p>
        </div>
      </section>
      <article class="card">
        ${emptyState({
          iconName: "list",
          title: "Tu historial está vacío",
          description: "Cuando agregues mediciones aparecerán aquí, con opción de editarlas o eliminarlas.",
          action: `<button id="empty-add-record" class="button" type="button">${icon("plus", { size: 17 })} Agregar medición</button>`
        })}
      </article>
      <button id="fab-add" class="fab" type="button" aria-label="Agregar medición">
        ${icon("plus", { size: 21, strokeWidth: 2.4 })} Agregar
      </button>
    `;
  }

  const positionOptions = selectOptions(
    POSITIONS.map((position) => ({ value: position, label: position })),
    tableState.filterPosition,
    "Todas las posiciones"
  );

  const categoryOptions = selectOptions(
    BP_CATEGORIES.map((category) => ({ value: category.key, label: category.label })),
    tableState.filterCategory,
    "Todas las categorías"
  );

  return `
    <section class="page-head">
      <div>
        <h1>Historial</h1>
        <p class="helper">Ordena, filtra y corrige cualquier medición.</p>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button id="export-csv" class="ghost-button" type="button">
          ${icon("download", { size: 17 })} Exportar CSV
        </button>
        <button id="open-record-modal" class="button" type="button">
          ${icon("plus", { size: 17 })} Agregar
        </button>
      </div>
    </section>

    <article class="card">
      <div id="msg-records" class="message-bar" role="status" aria-live="polite"></div>

      <div class="table-toolbar">
        <div class="field" style="flex:1 1 200px;">
          <label class="sr-only" for="search-records">Buscar</label>
          <input id="search-records" type="search" placeholder="Buscar por valor, posición u observación…"
            value="${escHtml(tableState.search ?? "")}" />
        </div>
        <label class="sr-only" for="filter-position">Filtrar por posición</label>
        <select id="filter-position">${positionOptions}</select>
        <label class="sr-only" for="filter-category">Filtrar por categoría</label>
        <select id="filter-category">${categoryOptions}</select>
      </div>

      <div id="history-table">${createHistoryTable(records, tableState)}</div>
    </article>

    <button id="fab-add" class="fab" type="button" aria-label="Agregar medición">
      ${icon("plus", { size: 21, strokeWidth: 2.4 })} Agregar
    </button>
  `;
}
