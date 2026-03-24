import { createField, createSelectField } from "./dom.js";
import { getCurrentTime, getTodayDate } from "../utils/date.js";

const steps = [
  { key: "recordDate", title: "Fecha", description: "Confirma la fecha del registro.", type: "date" },
  { key: "recordTime", title: "Hora", description: "Ajusta la hora de la medicion.", type: "time" },
  { key: "ta", title: "TA", description: "Ingresa la tension arterial en formato 120/80.", type: "text" },
  { key: "heartRate", title: "FC", description: "Ingresa la frecuencia cardiaca.", type: "number" },
  { key: "position", title: "Posicion", description: "Selecciona la posicion del paciente.", type: "select" },
  { key: "observations", title: "Observaciones", description: "Agrega comentarios relevantes.", type: "textarea" }
];

export function getInitialWizardData() {
  return {
    recordDate: getTodayDate(),
    recordTime: getCurrentTime(),
    ta: "",
    heartRate: "",
    position: "Sentado",
    observations: ""
  };
}

function createStepField(step, wizardData) {
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

  if (step.type === "textarea") {
    return createField({
      id: step.key,
      label: step.title,
      type: "textarea",
      value: wizardData.observations,
      placeholder: "Ej. Me encontraba en reposo."
    });
  }

  return createField({
    id: step.key,
    label: step.title,
    type: step.type,
    value: wizardData[step.key],
    placeholder: step.key === "ta" ? "120/80" : step.key === "heartRate" ? "75" : ""
  });
}

export function createWizardModal({ currentStep, wizardData, loading = false, errorMessage = "" }) {
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return `
    <div class="modal" id="record-modal">
      <article class="modal-card">
        <span class="step-pill">Paso ${currentStep + 1} de ${steps.length}</span>
        <h3>${step.title}</h3>
        <p class="helper">${step.description}</p>
        <div class="form-grid">
          ${createStepField(step, wizardData)}
          <p class="message error">${errorMessage}</p>
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
      <article class="modal-card">
        <span class="step-pill">Confirmacion final</span>
        <h3>Verifica que los datos sean correctos</h3>
        <p class="helper">Si todo esta bien, presiona subir datos para guardarlos en Supabase.</p>
        <div class="confirm-list">
          <div><strong>Fecha</strong><span>${wizardData.recordDate}</span></div>
          <div><strong>Hora</strong><span>${wizardData.recordTime}</span></div>
          <div><strong>TA</strong><span>${wizardData.ta}</span></div>
          <div><strong>FC</strong><span>${wizardData.heartRate}</span></div>
          <div><strong>Posicion</strong><span>${wizardData.position}</span></div>
          <div><strong>Observaciones</strong><span>${wizardData.observations || "-"}</span></div>
        </div>
        <p class="message error">${errorMessage}</p>
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
