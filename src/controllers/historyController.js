import { recordService } from "../services/recordService.js";
import { createHistoryView, createHistoryTable } from "../ui/historyView.js";
import { createRecordFormController } from "./recordFormController.js";
import { DEFAULT_TABLE_STATE, processRecords } from "../utils/recordsTable.js";
import { exportRecords } from "../utils/export.js";

export function createHistoryController() {
  const state = {
    user: null,
    records: [],
    table: { ...DEFAULT_TABLE_STATE }
  };

  let root = null;
  let recordForm = null;
  let searchTimer = null;

  function showMessage(type, text) {
    const bar = root.querySelector("#msg-records");
    if (!bar) return;

    bar.className = `message-bar ${type}`;
    bar.textContent = text;
    setTimeout(() => {
      bar.className = "message-bar";
      bar.textContent = "";
    }, 4000);
  }

  async function refreshRecords() {
    state.records = await recordService.getUserRecords(state.user.id);
  }

  function findRecord(id) {
    return state.records.find((record) => record.id === Number(id));
  }

  /** Solo la tabla: conserva el foco del buscador mientras se escribe. */
  function renderTable() {
    const container = root.querySelector("#history-table");
    if (!container) return;

    container.innerHTML = createHistoryTable(state.records, state.table);
    bindTableEvents();
  }

  function render() {
    root.innerHTML = createHistoryView(state.records, state.table);
    bindStaticEvents();
    bindTableEvents();
  }

  function bindStaticEvents() {
    root.querySelector("#open-record-modal")?.addEventListener("click", () => recordForm.openCreate());
    root.querySelector("#fab-add")?.addEventListener("click", () => recordForm.openCreate());
    root.querySelector("#empty-add-record")?.addEventListener("click", () => recordForm.openCreate());

    root.querySelector("#export-csv")?.addEventListener("click", () => {
      // Se exporta lo que el usuario está viendo, no siempre el historial completo.
      const { rows } = processRecords(state.records, { ...state.table, page: 1, pageSize: Number.MAX_SAFE_INTEGER });
      exportRecords(rows);
      showMessage("success", `Se descargaron ${rows.length} mediciones.`);
    });

    root.querySelector("#filter-position")?.addEventListener("change", (event) => {
      state.table.filterPosition = event.target.value;
      state.table.page = 1;
      renderTable();
    });

    root.querySelector("#filter-category")?.addEventListener("change", (event) => {
      state.table.filterCategory = event.target.value;
      state.table.page = 1;
      renderTable();
    });

    root.querySelector("#search-records")?.addEventListener("input", (event) => {
      clearTimeout(searchTimer);
      const value = event.target.value;
      searchTimer = setTimeout(() => {
        state.table.search = value;
        state.table.page = 1;
        renderTable();
      }, 180);
    });
  }

  function sortBy(key) {
    if (state.table.sortKey === key) {
      state.table.sortDir = state.table.sortDir === "asc" ? "desc" : "asc";
    } else {
      state.table.sortKey = key;
      state.table.sortDir = "desc";
    }
    state.table.page = 1;
    renderTable();
  }

  function bindTableEvents() {
    root.querySelectorAll("th.sortable").forEach((th) => {
      th.addEventListener("click", () => sortBy(th.dataset.sort));
      th.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          sortBy(th.dataset.sort);
        }
      });
    });

    root.querySelector("#page-prev")?.addEventListener("click", () => {
      state.table.page = Math.max(1, state.table.page - 1);
      renderTable();
    });

    root.querySelector("#page-next")?.addEventListener("click", () => {
      state.table.page += 1;
      renderTable();
    });

    root.querySelectorAll(".btn-edit-rec").forEach((button) => {
      button.addEventListener("click", () => {
        const record = findRecord(button.dataset.id);
        if (record) recordForm.openEdit(record, { onError: (error) => showMessage("error", error.message) });
      });
    });

    root.querySelectorAll(".btn-del-rec").forEach((button) => {
      button.addEventListener("click", () => {
        const record = findRecord(button.dataset.id);
        if (record) recordForm.openDelete(record, { onError: (error) => showMessage("error", error.message) });
      });
    });
  }

  return {
    async bootstrap({ root: contentRoot, modalRoot, userData }) {
      root = contentRoot;
      state.user = userData.user;

      recordForm = createRecordFormController({
        modalRoot,
        getUserId: () => state.user.id,
        onSaved: async (message) => {
          await refreshRecords();
          render();
          if (message) showMessage("success", message);
        }
      });

      await refreshRecords();
      render();
    }
  };
}
