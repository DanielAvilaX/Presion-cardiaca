import { recordService } from "../services/recordService.js";
import {
  createWizardModal,
  createConfirmModal,
  createSuccessModal,
  createEditModal,
  createDeleteModal,
  getInitialWizardData,
  clinicalHintMarkup,
  softWarningMarkup,
  WIZARD_STEPS
} from "../ui/modalView.js";
import { trapFocus } from "../ui/dom.js";
import { validateMeasurement } from "../utils/validation.js";

/**
 * Dueño de todos los modales de un registro: crear (asistente paso a paso),
 * editar y eliminar.
 *
 * Vive aparte porque tanto el panel como el historial ofrecen las mismas
 * acciones; antes el asistente estaba dentro del panel y la edición dentro de
 * configuración, cada una con sus propias reglas de validación.
 */
export function createRecordFormController({ modalRoot, getUserId, onSaved }) {
  let releaseFocus = null;

  const state = {
    open: false,
    confirm: false,
    success: false,
    step: 0,
    loading: false,
    errorMessage: "",
    data: getInitialWizardData()
  };

  function clearModal() {
    releaseFocus?.();
    releaseFocus = null;
    modalRoot.innerHTML = "";
  }

  /** Cierra al pulsar fuera, atrapa el foco y escucha Escape. */
  function activateModal(onClose) {
    const modal = modalRoot.querySelector(".modal");
    if (!modal) return;

    modal.addEventListener("mousedown", (event) => {
      if (event.target === modal) onClose();
    });

    releaseFocus = trapFocus(modal, { onClose });
  }

  // ── Asistente de creación ──────────────────────────────────────────────────

  function closeWizard() {
    state.open = false;
    state.confirm = false;
    state.success = false;
    state.errorMessage = "";
    clearModal();
  }

  function renderWizard() {
    releaseFocus?.();
    releaseFocus = null;

    if (!state.open) {
      modalRoot.innerHTML = "";
      return;
    }

    if (state.success) {
      modalRoot.innerHTML = createSuccessModal();
      return;
    }

    modalRoot.innerHTML = state.confirm
      ? createConfirmModal({ wizardData: state.data, loading: state.loading, errorMessage: state.errorMessage })
      : createWizardModal({
          currentStep: state.step,
          wizardData: state.data,
          loading: state.loading,
          errorMessage: state.errorMessage
        });

    bindWizardEvents();
    activateModal(closeWizard);
  }

  function validateCurrentStep() {
    const step = WIZARD_STEPS[state.step];
    if (!step) return;

    if (step.type === "number") {
      const value = validateMeasurement(step.limits, state.data[step.key]);

      if (step.key === "taDiastolic" && value >= Number(state.data.taSystolic)) {
        throw new Error("La diastólica debe ser menor que la sistólica.");
      }
      return;
    }

    if ((step.key === "recordDate" || step.key === "recordTime") && !String(state.data[step.key] ?? "").trim()) {
      throw new Error("Completa este dato antes de continuar.");
    }
  }

  async function saveRecord() {
    state.loading = true;
    state.errorMessage = "";
    renderWizard();

    try {
      await recordService.createRecord(getUserId(), state.data);

      state.loading = false;
      state.success = true;
      renderWizard();

      setTimeout(async () => {
        closeWizard();
        await onSaved?.();
      }, 950);
    } catch (error) {
      state.loading = false;
      state.errorMessage = error.message;
      renderWizard();
    }
  }

  function refreshLiveHints(step) {
    const warning = modalRoot.querySelector("#soft-warning");
    if (warning) warning.innerHTML = softWarningMarkup(step.limits, state.data[step.key]);

    const hint = modalRoot.querySelector("#clinical-hint");
    if (hint) hint.innerHTML = clinicalHintMarkup(state.data.taSystolic, state.data.taDiastolic);
  }

  function bindWizardEvents() {
    const step = WIZARD_STEPS[state.step];

    modalRoot.querySelector("#close-wizard")?.addEventListener("click", closeWizard);

    // Fecha y hora
    const dateOrTime = modalRoot.querySelector("input[type='date'], input[type='time']");
    dateOrTime?.addEventListener("change", (event) => {
      state.data[event.target.id] = event.target.value;
    });

    // Valor numérico
    const numberInput = modalRoot.querySelector(".number-input-large");
    if (numberInput) {
      numberInput.addEventListener("keydown", (event) => {
        if (["e", "E", "+", "-", ".", ","].includes(event.key)) event.preventDefault();
      });

      // El teclado numérico tarda un poco en desplegarse: un pequeño margen
      // antes de centrar el campo evita que quede tapado durante la animación.
      numberInput.addEventListener("focus", () => {
        setTimeout(() => numberInput.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
      });

      numberInput.addEventListener("input", (event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
        event.target.value = digits;
        state.data[step.key] = digits === "" ? "" : Number(digits);
        refreshLiveHints(step);
      });

      modalRoot.querySelectorAll("[data-quick]").forEach((button) => {
        button.addEventListener("click", () => {
          const value = Number(button.dataset.quick);
          state.data[step.key] = value;
          numberInput.value = String(value);
          numberInput.focus();
          refreshLiveHints(step);
        });
      });
    }

    // Posición
    modalRoot.querySelectorAll('input[name="position"]').forEach((radio) => {
      radio.addEventListener("change", (event) => {
        state.data.position = event.target.value;
        renderWizard();
      });
    });

    // Observaciones
    modalRoot.querySelectorAll('input[name="obsPreset"]').forEach((radio) => {
      radio.addEventListener("change", (event) => {
        state.data.obsPreset = event.target.value;
        state.data.observations = event.target.value === "Otro" ? "" : event.target.value;
        renderWizard();
      });
    });

    modalRoot.querySelector("#obsCustom")?.addEventListener("input", (event) => {
      state.data.observations = event.target.value;
    });

    // Navegación
    modalRoot.querySelector("#wizard-back")?.addEventListener("click", () => {
      state.errorMessage = "";
      if (state.step > 0) state.step -= 1;
      renderWizard();
    });

    modalRoot.querySelector("#wizard-next")?.addEventListener("click", () => {
      try {
        validateCurrentStep();
        state.errorMessage = "";

        if (state.step === WIZARD_STEPS.length - 1) state.confirm = true;
        else state.step += 1;
      } catch (error) {
        state.errorMessage = error.message;
      }
      renderWizard();
    });

    // Enter avanza al paso siguiente.
    modalRoot.querySelector(".modal-card")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
        event.preventDefault();
        modalRoot.querySelector("#wizard-next")?.click();
      }
    });

    modalRoot.querySelector("#confirm-back")?.addEventListener("click", () => {
      state.confirm = false;
      renderWizard();
    });

    modalRoot.querySelector("#confirm-submit")?.addEventListener("click", saveRecord);
  }

  // ── Editar ─────────────────────────────────────────────────────────────────

  function openEdit(record, { onError } = {}) {
    let loading = false;

    const render = (errorMessage = "") => {
      releaseFocus?.();
      releaseFocus = null;
      modalRoot.innerHTML = createEditModal(record, { errorMessage, loading });

      modalRoot.querySelector("#ef-cancel")?.addEventListener("click", clearModal);
      modalRoot.querySelector("#ef-close")?.addEventListener("click", clearModal);

      modalRoot.querySelector("#ef-save")?.addEventListener("click", async () => {
        const payload = {
          recordDate: modalRoot.querySelector("#ef-date").value,
          recordTime: modalRoot.querySelector("#ef-time").value,
          taSystolic: modalRoot.querySelector("#ef-sys").value,
          taDiastolic: modalRoot.querySelector("#ef-dia").value,
          heartRate: modalRoot.querySelector("#ef-hr").value,
          position: modalRoot.querySelector("#ef-pos").value,
          observations: modalRoot.querySelector("#ef-obs").value
        };

        loading = true;
        render();

        try {
          // Pasa por el servicio: mismas reglas que al crear un registro.
          await recordService.updateRecord(record.id, getUserId(), payload);
          clearModal();
          await onSaved?.("Medición actualizada.");
        } catch (error) {
          loading = false;
          render(error.message);
          onError?.(error);
        }
      });

      activateModal(clearModal);
    };

    render();
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────

  function openDelete(record, { onError } = {}) {
    modalRoot.innerHTML = createDeleteModal(record);

    modalRoot.querySelector("#del-cancel")?.addEventListener("click", clearModal);

    modalRoot.querySelector("#del-confirm")?.addEventListener("click", async () => {
      try {
        await recordService.deleteRecord(record.id, getUserId());
        clearModal();
        await onSaved?.("Medición eliminada.");
      } catch (error) {
        clearModal();
        onError?.(error);
      }
    });

    activateModal(clearModal);
  }

  return {
    openCreate() {
      Object.assign(state, {
        open: true,
        confirm: false,
        success: false,
        step: 0,
        loading: false,
        errorMessage: "",
        data: getInitialWizardData()
      });
      renderWizard();
    },
    openEdit,
    openDelete,
    close: closeWizard
  };
}
