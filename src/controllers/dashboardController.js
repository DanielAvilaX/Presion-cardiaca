import { authService } from "../services/authService.js";
import { recordService } from "../services/recordService.js";
import { createDashboardView, createRecordsTableSection } from "../ui/dashboardView.js";
import {
  createConfirmModal,
  createWizardModal,
  createSuccessModal,
  getInitialWizardData,
  clinicalHintMarkup,
  WIZARD_STEPS
} from "../ui/modalView.js";
import { bindChartTooltip } from "../ui/chart.js";
import { formatDateInputValue } from "../utils/date.js";
import { DEFAULT_TABLE_STATE } from "../utils/recordsTable.js";
import { animateCount, animateChartPaths } from "../utils/animations.js";
import { readStorage, writeStorage } from "../utils/storage.js";

const RANGE_STORAGE_KEY = "tension-range";

export function createDashboardController({ onLoggedOut }) {
  const storedRange = readStorage(RANGE_STORAGE_KEY);

  const state = {
    profile: null,
    user: null,
    records: [],
    filters: {
      range: storedRange || "7",
      customStart: "",
      customEnd: ""
    },
    chartVisibility: {
      systolic: true,
      diastolic: true,
      heartRate: true
    },
    table: { ...DEFAULT_TABLE_STATE },
    modal: {
      open: false,
      confirm: false,
      success: false,
      step: 0,
      loading: false,
      errorMessage: "",
      data: getInitialWizardData()
    }
  };

  let appRoot = null;
  let modalRoot = null;
  let keysBound = false;

  function getStats() {
    return recordService.getStats(state.records, state.filters);
  }

  async function refreshRecords() {
    state.records = await recordService.getUserRecords(state.user.id);
  }

  function renderSkeleton() {
    appRoot.innerHTML = `
      <section class="dashboard-layout">
        <article class="panel"><div class="skeleton skeleton-block" style="width:40%; height:28px;"></div><div class="skeleton skeleton-block" style="width:70%;"></div></article>
        <article class="card skeleton skeleton-card"></article>
        <section class="grid">
          <article class="card skeleton" style="height:380px;"></article>
          <article class="card skeleton" style="height:380px;"></article>
        </section>
        <article class="card skeleton" style="height:240px;"></article>
      </section>
    `;
  }

  function render() {
    appRoot.innerHTML = createDashboardView({
      profile: state.profile,
      records: state.records,
      stats: getStats(),
      filters: state.filters,
      chartVisibility: state.chartVisibility,
      tableState: state.table
    });

    bindDashboardEvents();
    bindTableEvents();
    renderModal();

    const chartContainer = appRoot.querySelector(".chart-container");
    if (chartContainer) {
      bindChartTooltip(chartContainer);
      animateChartPaths(chartContainer);
    }

    // Contadores animados.
    appRoot.querySelectorAll(".stat-box strong[data-count]").forEach((el) => {
      const value = Number(el.dataset.count);
      if (value > 0) animateCount(el, value);
    });
  }

  function renderTableSection() {
    const section = appRoot.querySelector("#records-table-section");
    if (!section) return;
    section.innerHTML = createRecordsTableSection(state.records, state.table);
    bindTableEvents();
  }

  // ── Modales ────────────────────────────────────────────────────────────────

  function renderModal() {
    if (!state.modal.open) {
      modalRoot.innerHTML = "";
      return;
    }

    if (state.modal.success) {
      modalRoot.innerHTML = createSuccessModal();
      return;
    }

    modalRoot.innerHTML = state.modal.confirm
      ? createConfirmModal({
          wizardData: state.modal.data,
          loading: state.modal.loading,
          errorMessage: state.modal.errorMessage
        })
      : createWizardModal({
          currentStep: state.modal.step,
          wizardData: state.modal.data,
          loading: state.modal.loading,
          errorMessage: state.modal.errorMessage
        });

    bindModalEvents();
    bindModalDismiss();
  }

  function bindModalDismiss() {
    const modal = modalRoot.querySelector(".modal");
    if (!modal) return;
    modal.addEventListener("mousedown", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  function openModal() {
    state.modal = {
      open: true,
      confirm: false,
      success: false,
      step: 0,
      loading: false,
      errorMessage: "",
      data: getInitialWizardData()
    };
    renderModal();
  }

  function closeModal() {
    state.modal.open = false;
    state.modal.confirm = false;
    state.modal.success = false;
    state.modal.errorMessage = "";
    renderModal();
  }

  function updateWizardField(fieldId, value) {
    state.modal.data[fieldId] = value;
  }

  function validateCurrentStep() {
    const step = WIZARD_STEPS[state.modal.step];
    if (!step) return;

    if (step.type === "number") {
      const raw = state.modal.data[step.key];
      if (raw === "" || raw === null || raw === undefined) {
        throw new Error(`Ingresa el valor de ${step.title}.`);
      }
      const num = Number(raw);
      if (isNaN(num) || !Number.isFinite(num)) {
        throw new Error(`${step.title} debe ser un numero valido.`);
      }
      if (num < step.min || num > step.max) {
        throw new Error(`${step.title} debe estar entre ${step.min} y ${step.max}.`);
      }
      if (step.key === "taDiastolic") {
        const sys = Number(state.modal.data.taSystolic);
        if (num >= sys) {
          throw new Error("La TA diastolica debe ser menor que la sistolica.");
        }
      }
      return;
    }

    const requiredKeys = ["recordDate", "recordTime"];
    if (requiredKeys.includes(step.key) && !String(state.modal.data[step.key] ?? "").trim()) {
      throw new Error("Completa el dato actual antes de continuar.");
    }
  }

  async function saveRecord() {
    state.modal.loading = true;
    state.modal.errorMessage = "";
    renderModal();

    try {
      await recordService.createRecord(state.user.id, state.modal.data);
      await refreshRecords();

      // Pantalla de exito breve antes de cerrar.
      state.modal.loading = false;
      state.modal.success = true;
      renderModal();

      setTimeout(() => {
        closeModal();
        render();
      }, 1100);
    } catch (error) {
      state.modal.loading = false;
      state.modal.errorMessage = error.message;
      renderModal();
    }
  }

  function bindModalEvents() {
    const input = modalRoot.querySelector("input[type='date'], input[type='time'], select");
    input?.addEventListener("input", (e) => updateWizardField(e.target.id, e.target.value));
    input?.addEventListener("change", (e) => updateWizardField(e.target.id, e.target.value));

    const numInput = modalRoot.querySelector(".number-input-large");
    if (numInput) {
      numInput.addEventListener("keydown", (e) => {
        if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
      });
      numInput.addEventListener("input", (e) => {
        const clean = e.target.value.replace(/[^0-9]/g, "");
        e.target.value = clean;
        updateWizardField(e.target.id, clean === "" ? "" : Number(clean));

        // Aviso clinico en vivo en el paso de diastolica.
        const hint = modalRoot.querySelector("#clinical-hint");
        if (hint && e.target.id === "taDiastolic") {
          hint.innerHTML = clinicalHintMarkup(state.modal.data.taSystolic, state.modal.data.taDiastolic);
        }
      });
    }

    modalRoot.querySelectorAll('input[name="obsPreset"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        state.modal.data.obsPreset = e.target.value;
        state.modal.data.observations = e.target.value === "Otro" ? "" : e.target.value;
        renderModal();
      });
    });

    modalRoot.querySelector("#obsCustom")?.addEventListener("input", (e) => {
      state.modal.data.observations = e.target.value;
    });

    modalRoot.querySelector("#close-wizard")?.addEventListener("click", closeModal);

    modalRoot.querySelector("#wizard-back")?.addEventListener("click", () => {
      state.modal.errorMessage = "";
      if (state.modal.step > 0) state.modal.step -= 1;
      renderModal();
    });

    modalRoot.querySelector("#wizard-next")?.addEventListener("click", () => {
      try {
        validateCurrentStep();
        state.modal.errorMessage = "";

        if (state.modal.step === WIZARD_STEPS.length - 1) {
          state.modal.confirm = true;
        } else {
          state.modal.step += 1;
        }
        renderModal();
      } catch (error) {
        state.modal.errorMessage = error.message;
        renderModal();
      }
    });

    modalRoot.querySelector("#confirm-back")?.addEventListener("click", () => {
      state.modal.confirm = false;
      renderModal();
    });

    modalRoot.querySelector("#confirm-submit")?.addEventListener("click", saveRecord);
  }

  // ── Confirmacion de cierre de sesion ─────────────────────────────────────────

  function confirmLogout() {
    modalRoot.innerHTML = `
      <div class="modal" id="logout-modal">
        <article class="modal-card modal-card--wizard" style="width:min(420px,100%);">
          <h2 class="wizard-title" style="font-size:1.6rem;">Cerrar sesion</h2>
          <p class="helper">Estas seguro de que deseas salir de tu cuenta?</p>
          <div class="confirm-actions" style="margin-top:20px;">
            <button id="logout-cancel" class="ghost-button" type="button">Cancelar</button>
            <button id="logout-confirm" class="button" type="button">Cerrar sesion</button>
          </div>
        </article>
      </div>
    `;

    const modal = modalRoot.querySelector("#logout-modal");
    modal.addEventListener("mousedown", (e) => {
      if (e.target === modal) modalRoot.innerHTML = "";
    });
    modalRoot.querySelector("#logout-cancel").addEventListener("click", () => {
      modalRoot.innerHTML = "";
    });
    modalRoot.querySelector("#logout-confirm").addEventListener("click", async () => {
      modalRoot.innerHTML = "";
      await authService.logout();
      await onLoggedOut();
    });
  }

  // ── Exportar a CSV/Excel ─────────────────────────────────────────────────────

  function downloadExcel() {
    const headers = ["Fecha", "Hora", "TA Sistolica (mmHg)", "TA Diastolica (mmHg)", "FC (lpm)", "Posicion", "Observaciones"];
    const rows = state.records.map((r) => [
      r.record_date,
      r.record_time.slice(0, 5),
      r.ta_systolic,
      r.ta_diastolic,
      r.heart_rate,
      r.position,
      r.observations ?? ""
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registros-tension.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Eventos ───────────────────────────────────────────────────────────────--

  function applyRange(range) {
    state.filters.range = range;
    writeStorage(RANGE_STORAGE_KEY, range);

    if (range === "custom") {
      const today = formatDateInputValue();
      state.filters.customEnd = today;
      state.filters.customStart = formatDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
    }

    render();
  }

  function bindDashboardEvents() {
    appRoot.querySelector("#logout-button").addEventListener("click", confirmLogout);
    appRoot.querySelector("#open-record-modal").addEventListener("click", openModal);
    appRoot.querySelector("#fab-add")?.addEventListener("click", openModal);
    appRoot.querySelector("#download-excel").addEventListener("click", downloadExcel);

    appRoot.querySelectorAll(".range-chip").forEach((chip) => {
      chip.addEventListener("click", () => applyRange(chip.dataset.range));
    });

    appRoot.querySelector("#apply-custom-range")?.addEventListener("click", () => {
      state.filters.customStart = appRoot.querySelector("#custom-start").value;
      state.filters.customEnd = appRoot.querySelector("#custom-end").value;
      render();
    });

    appRoot.querySelectorAll(".chart-legend-item").forEach((item) => {
      item.addEventListener("click", () => {
        state.chartVisibility[item.dataset.series] = !state.chartVisibility[item.dataset.series];
        render();
      });
    });
  }

  function bindTableEvents() {
    appRoot.querySelector("#empty-add-record")?.addEventListener("click", openModal);

    appRoot.querySelectorAll("th.sortable").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        if (state.table.sortKey === key) {
          state.table.sortDir = state.table.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.table.sortKey = key;
          state.table.sortDir = "desc";
        }
        state.table.page = 1;
        renderTableSection();
      });
    });

    appRoot.querySelector("#filter-position")?.addEventListener("change", (e) => {
      state.table.filterPosition = e.target.value;
      state.table.page = 1;
      renderTableSection();
    });

    appRoot.querySelector("#filter-category")?.addEventListener("change", (e) => {
      state.table.filterCategory = e.target.value;
      state.table.page = 1;
      renderTableSection();
    });

    appRoot.querySelector("#page-prev")?.addEventListener("click", () => {
      state.table.page = Math.max(1, state.table.page - 1);
      renderTableSection();
    });

    appRoot.querySelector("#page-next")?.addEventListener("click", () => {
      state.table.page += 1;
      renderTableSection();
    });
  }

  function bindGlobalKeys() {
    if (keysBound) return;
    keysBound = true;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalRoot.querySelector(".modal") && !state.modal.success) {
        if (state.modal.open) closeModal();
        else modalRoot.innerHTML = "";
      }
    });
  }

  return {
    async bootstrap({ root, modalContainer, userData }) {
      appRoot = root;
      modalRoot = modalContainer;
      state.user = userData.user;
      state.profile = userData.profile;
      renderSkeleton();
      await refreshRecords();
      render();
      bindGlobalKeys();
    }
  };
}
