import { authService } from "../services/authService.js";
import { recordService } from "../services/recordService.js";
import { createDashboardView } from "../ui/dashboardView.js";
import { createConfirmModal, createWizardModal, getInitialWizardData } from "../ui/modalView.js";

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
      filters: state.filters
    });

    bindDashboardEvents();
    renderModal();
  }

  function renderModal() {
    if (!state.modal.open) {
      modalRoot.innerHTML = "";
      return;
    }

    // El wizard y la confirmacion comparten un unico contenedor modal.
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
    const requiredByStep = ["recordDate", "recordTime", "ta", "heartRate", "position"];
    const currentField = requiredByStep[state.modal.step];

    if (currentField && !String(state.modal.data[currentField] ?? "").trim()) {
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
      // Al guardar, la tabla y las estadisticas se recalculan de inmediato.
      closeModal();
      render();
    } catch (error) {
      state.modal.loading = false;
      state.modal.errorMessage = error.message;
      renderModal();
    }
  }

  function bindModalEvents() {
    const input = modalRoot.querySelector("input, textarea, select");
    // Cada paso solo tiene un control principal, por eso se puede sincronizar de forma directa.
    input?.addEventListener("input", (event) => updateWizardField(event.target.id, event.target.value));
    input?.addEventListener("change", (event) => updateWizardField(event.target.id, event.target.value));

    modalRoot.querySelector("#close-wizard")?.addEventListener("click", closeModal);

    modalRoot.querySelector("#wizard-back")?.addEventListener("click", () => {
      state.modal.errorMessage = "";
      if (state.modal.step > 0) {
        state.modal.step -= 1;
      }
      renderModal();
    });

    modalRoot.querySelector("#wizard-next")?.addEventListener("click", () => {
      try {
        validateCurrentStep();
        state.modal.errorMessage = "";

        if (state.modal.step === 5) {
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

  function bindDashboardEvents() {
    appRoot.querySelector("#logout-button").addEventListener("click", async () => {
      await authService.logout();
      await onLoggedOut();
    });

    appRoot.querySelector("#open-record-modal").addEventListener("click", openModal);

    appRoot.querySelector("#range-select").addEventListener("change", (event) => {
      state.filters.range = event.target.value;

      if (state.filters.range === "custom") {
        const today = new Date().toISOString().slice(0, 10);
        state.filters.customEnd = today;
        state.filters.customStart = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      }

      render();
    });

    appRoot.querySelector("#apply-custom-range")?.addEventListener("click", () => {
      state.filters.customStart = appRoot.querySelector("#custom-start").value;
      state.filters.customEnd = appRoot.querySelector("#custom-end").value;
      render();
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
