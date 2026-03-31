import { authService } from "../services/authService.js";
import { recordService } from "../services/recordService.js";
import { createDashboardView } from "../ui/dashboardView.js";
import { createConfirmModal, createWizardModal, getInitialWizardData, WIZARD_STEPS } from "../ui/modalView.js";
import { bindChartTooltip } from "../ui/chart.js";
import { formatDateInputValue } from "../utils/date.js";

export function createDashboardController({ onLoggedOut }) {
  const state = {
    profile: null,
    user: null,
    records: [],
    filters: {
      range: "7",
      customStart: "",
      customEnd: ""
    },
    chartVisibility: {
      systolic: true,
      diastolic: true,
      heartRate: true
    },
    modal: {
      open: false,
      confirm: false,
      step: 0,
      loading: false,
      errorMessage: "",
      data: getInitialWizardData()
    }
  };

  let appRoot = null;
  let modalRoot = null;

  function getStats() {
    return recordService.getStats(state.records, state.filters);
  }

  async function refreshRecords() {
    state.records = await recordService.getUserRecords(state.user.id);
  }

  function render() {
    appRoot.innerHTML = createDashboardView({
      profile: state.profile,
      records: state.records,
      stats: getStats(),
      filters: state.filters,
      chartVisibility: state.chartVisibility
    });

    bindDashboardEvents();
    renderModal();

    // Tooltip interactivo de la grafica
    const chartContainer = appRoot.querySelector(".chart-container");
    if (chartContainer) bindChartTooltip(chartContainer);
  }

  function renderModal() {
    if (!state.modal.open) {
      modalRoot.innerHTML = "";
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
  }

  function openModal() {
    state.modal = {
      open: true,
      confirm: false,
      step: 0,
      loading: false,
      errorMessage: "",
      data: getInitialWizardData()
    };
    renderModal();
  }

  function closeModal() {
    state.modal.open = false;
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

    // Campos de fecha y hora son obligatorios
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
      closeModal();
      render();
    } catch (error) {
      state.modal.loading = false;
      state.modal.errorMessage = error.message;
      renderModal();
    }
  }

  function bindModalEvents() {
    // Campos de texto/fecha/hora/select: hay un solo control por paso
    const input = modalRoot.querySelector("input[type='date'], input[type='time'], select");
    input?.addEventListener("input", (e) => updateWizardField(e.target.id, e.target.value));
    input?.addEventListener("change", (e) => updateWizardField(e.target.id, e.target.value));

    // Input numerico grande
    const numInput = modalRoot.querySelector(".number-input-large");
    if (numInput) {
      // Solo permitir digitos (bloquear e, +, -, .)
      numInput.addEventListener("keydown", (e) => {
        if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
      });
      numInput.addEventListener("input", (e) => {
        // Eliminar cualquier caracter no numerico que pudiera pasar
        const clean = e.target.value.replace(/[^0-9]/g, "");
        e.target.value = clean;
        updateWizardField(e.target.id, clean === "" ? "" : Number(clean));
      });
    }

    // Radios de observaciones
    modalRoot.querySelectorAll('input[name="obsPreset"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        state.modal.data.obsPreset = e.target.value;
        if (e.target.value !== "Otro") {
          state.modal.data.observations = e.target.value;
        } else {
          state.modal.data.observations = "";
        }
        renderModal();
      });
    });

    // Textarea "Otro"
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

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registros-tension.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function bindDashboardEvents() {
    appRoot.querySelector("#logout-button").addEventListener("click", async () => {
      await authService.logout();
      await onLoggedOut();
    });

    appRoot.querySelector("#open-record-modal").addEventListener("click", openModal);

    appRoot.querySelector("#download-excel").addEventListener("click", downloadExcel);

    appRoot.querySelector("#range-select").addEventListener("change", (event) => {
      state.filters.range = event.target.value;

      if (state.filters.range === "custom") {
        const today = formatDateInputValue();
        state.filters.customEnd = today;
        state.filters.customStart = formatDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
      }

      render();
    });

    appRoot.querySelector("#apply-custom-range")?.addEventListener("click", () => {
      state.filters.customStart = appRoot.querySelector("#custom-start").value;
      state.filters.customEnd = appRoot.querySelector("#custom-end").value;
      render();
    });

    // Leyendas interactivas de la grafica
    appRoot.querySelectorAll(".chart-legend-item").forEach((item) => {
      item.addEventListener("click", () => {
        state.chartVisibility[item.dataset.series] = !state.chartVisibility[item.dataset.series];
        render();
      });
    });
  }

  return {
    async bootstrap({ root, modalContainer, userData }) {
      appRoot = root;
      modalRoot = modalContainer;
      state.user = userData.user;
      state.profile = userData.profile;
      await refreshRecords();
      render();
    }
  };
}
