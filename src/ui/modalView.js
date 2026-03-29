import { createField, createSelectField } from "./dom.js";
import { getCurrentTime, getTodayDate } from "../utils/date.js";

const steps = [
  { key: "recordDate", title: "Fecha", description: "Confirma la fecha del registro.", type: "date" },
  { key: "recordTime", title: "Hora", description: "Ajusta la hora de la medicion.", type: "time" },
  { key: "taSystolic", title: "TA Sistolica", description: "Escribe la presion sistolica (0 – 200 mmHg).", type: "number", min: 0, max: 200, unit: "mmHg" },
  { key: "taDiastolic", title: "TA Diastolica", description: "Escribe la presion diastolica (0 – 120 mmHg).", type: "number", min: 0, max: 120, unit: "mmHg" },
  { key: "heartRate", title: "Frecuencia Cardiaca", description: "Escribe el pulso en latidos por minuto (0 – 120).", type: "number", min: 0, max: 120, unit: "lpm" },
  { key: "position", title: "Posicion", description: "Selecciona la posicion durante la medicion.", type: "select" },
  { key: "observations", title: "Observaciones", description: "Selecciona el brazo o agrega un detalle.", type: "observations" }
];

export const WIZARD_STEPS = steps;

export function getInitialWizardData() {
  return {
    recordDate: getTodayDate(),
    recordTime: getCurrentTime(),
    taSystolic: "",
    taDiastolic: "",
    heartRate: "",
    position: "Sentado",
    observations: "",
    obsPreset: ""
  };
}

function createNumberField(step, value) {
  return `
    <div class="number-input-wrap">
      <input
        type="number"
        id="${step.key}"
        class="number-input-large"
        min="${step.min}"
        max="${step.max}"
        value="${value}"
        inputmode="numeric"
        placeholder="0"
        autocomplete="off"
      />
      <span class="number-unit">${step.unit}</span>
    </div>
  `;
}

function createObservationsField(wizardData) {
  const { obsPreset, observations } = wizardData;
  const isOtro = obsPreset === "Otro";
  const customValue = isOtro ? observations : "";

  return `
    <div class="obs-options">
      <label class="obs-option ${obsPreset === "Brazo izquierdo" ? "obs-option--active" : ""}">
        <input type="radio" name="obsPreset" value="Brazo izquierdo" ${obsPreset === "Brazo izquierdo" ? "checked" : ""} />
        <span>Brazo izquierdo</span>
      </label>
      <label class="obs-option ${obsPreset === "Brazo derecho" ? "obs-option--active" : ""}">
        <input type="radio" name="obsPreset" value="Brazo derecho" ${obsPreset === "Brazo derecho" ? "checked" : ""} />
        <span>Brazo derecho</span>
      </label>
      <label class="obs-option ${isOtro ? "obs-option--active" : ""}">
        <input type="radio" name="obsPreset" value="Otro" ${isOtro ? "checked" : ""} />
        <span>Otro</span>
      </label>
    </div>
    ${isOtro ? `
      <div class="field" style="margin-top:16px;">
        <label for="obsCustom">Describe el detalle</label>
        <textarea id="obsCustom" placeholder="Ej. Me encontraba en reposo.">${customValue}</textarea>
      </div>
    ` : ""}
  `;
}

function createStepContent(step, wizardData) {
  if (step.type === "number") {
    return createNumberField(step, wizardData[step.key]);
  }

  if (step.type === "observations") {
    return createObservationsField(wizardData);
  }

  if (step.type === "select") {
    return createSelectField({
      id: step.key,
      label: step.title,
      value: wizardData.position,
      options: [
        { value: "Sentado", label: "Sentado" },
        { value: "Acostado", label: "Acostado" },
        { value: "De pie", label: "De pie" }
      ]
    });
  }

  return createField({
    id: step.key,
    label: step.title,
    type: step.type,
    value: wizardData[step.key],
    placeholder: ""
  });
}

export function createWizardModal({ currentStep, wizardData, loading = false, errorMessage = "" }) {
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progressWidth = Math.round(((currentStep + 1) / steps.length) * 100);

  return `
    <div class="modal" id="record-modal">
      <article class="modal-card modal-card--wizard">
        <div class="wizard-header">
          <span class="step-pill">Paso ${currentStep + 1} de ${steps.length}</span>
          <div class="wizard-progress">
            <div class="wizard-progress-bar" style="width: ${progressWidth}%"></div>
          </div>
        </div>
        <h2 class="wizard-title">${step.title}</h2>
        <p class="helper wizard-description">${step.description}</p>
        <div class="wizard-field-wrap${step.type === "number" ? " wizard-field-wrap--number" : ""}">
          ${createStepContent(step, wizardData)}
          ${errorMessage ? `<p class="message error" style="margin-top:12px;">${errorMessage}</p>` : ""}
        </div>
        <div class="wizard-actions">
          <button id="close-wizard" class="ghost-button" type="button">Cancelar</button>
          <div class="range-controls">
            <button id="wizard-back" class="ghost-button" type="button" ${isFirstStep ? "disabled" : ""}>Atras</button>
            <button id="wizard-next" class="button" type="button" ${loading ? "disabled" : ""}>
              ${isLastStep ? "Revisar datos" : "Siguiente"}
            </button>
          </div>
        </div>
      </article>
    </div>
  `;
}

export function createConfirmModal({ wizardData, loading = false, errorMessage = "" }) {
  return `
    <div class="modal" id="confirm-modal">
      <article class="modal-card modal-card--wizard">
        <span class="step-pill">Confirmacion final</span>
        <h2 class="wizard-title">Verifica los datos</h2>
        <p class="helper">Si todo esta bien, presiona subir datos para guardarlos.</p>
        <div class="confirm-list">
          <div><strong>Fecha</strong><span>${wizardData.recordDate}</span></div>
          <div><strong>Hora</strong><span>${wizardData.recordTime}</span></div>
          <div><strong>TA Sistolica</strong><span>${wizardData.taSystolic} mmHg</span></div>
          <div><strong>TA Diastolica</strong><span>${wizardData.taDiastolic} mmHg</span></div>
          <div><strong>FC</strong><span>${wizardData.heartRate} lpm</span></div>
          <div><strong>Posicion</strong><span>${wizardData.position}</span></div>
          <div><strong>Observaciones</strong><span>${wizardData.observations || "-"}</span></div>
        </div>
        ${errorMessage ? `<p class="message error">${errorMessage}</p>` : ""}
        <div class="confirm-actions">
          <button id="confirm-back" class="ghost-button" type="button" ${loading ? "disabled" : ""}>Volver</button>
          <button id="confirm-submit" class="button" type="button" ${loading ? "disabled" : ""}>
            ${loading ? "Guardando..." : "Subir datos"}
          </button>
        </div>
      </article>
    </div>
  `;
}
