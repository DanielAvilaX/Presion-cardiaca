import { createField, createSelectField } from "./dom.js";
import { getCurrentTime, getTodayDate } from "../utils/date.js";
import { classifyBP } from "../utils/bpClassification.js";
import { MEASUREMENT_LIMITS, getMeasurementWarning } from "../utils/validation.js";
import { escHtml } from "../utils/html.js";
import { bpBadge } from "./components.js";
import { icon } from "./icons.js";

export const POSITIONS = ["Sentado", "Acostado", "De pie"];

/**
 * El asistente pregunta un dato por pantalla. Es deliberadamente lento de
 * recorrer: registrar la tensión es una tarea corta pero propensa a errores
 * de digitación, y un valor mal escrito contamina la clasificación clínica.
 */
const steps = [
  { key: "recordDate", title: "¿Qué día fue?", description: "Confirma la fecha de la medición.", type: "date" },
  { key: "recordTime", title: "¿A qué hora?", description: "Ajusta la hora en que tomaste la lectura.", type: "time" },
  {
    key: "taSystolic",
    title: "Tensión sistólica",
    description: "El número más alto de tu tensiómetro.",
    type: "number",
    limits: MEASUREMENT_LIMITS.systolic,
    suggestions: [110, 120, 130, 140]
  },
  {
    key: "taDiastolic",
    title: "Tensión diastólica",
    description: "El número más bajo de tu tensiómetro.",
    type: "number",
    limits: MEASUREMENT_LIMITS.diastolic,
    suggestions: [70, 80, 85, 90]
  },
  {
    key: "heartRate",
    title: "Frecuencia cardíaca",
    description: "El pulso, en latidos por minuto.",
    type: "number",
    limits: MEASUREMENT_LIMITS.heartRate,
    suggestions: [60, 70, 80, 90]
  },
  { key: "position", title: "¿En qué posición?", description: "La postura cambia la lectura, por eso se guarda.", type: "position" },
  { key: "observations", title: "Observaciones", description: "Elige el brazo o añade una nota. Es opcional.", type: "observations" }
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

/** Categoría en vivo mientras se escribe la diastólica. */
export function clinicalHintMarkup(systolic, diastolic) {
  const sys = Number(systolic);
  const dia = Number(diastolic);
  if (!Number.isFinite(sys) || !sys || !Number.isFinite(dia) || !dia) return "";

  const category = classifyBP(sys, dia);
  return `${bpBadge(category)}<span class="helper" style="font-size:0.82rem;">${escHtml(category.advice)}</span>`;
}

/** Aviso suave: el valor es registrable pero poco habitual. */
export function softWarningMarkup(limits, value) {
  const warning = getMeasurementWarning(limits, value);
  if (!warning) return "";

  return `<div class="soft-warning">${icon("alert", { size: 16 })}<span>${escHtml(warning)}</span></div>`;
}

function createNumberStep(step, wizardData) {
  const value = wizardData[step.key];
  const showClinicalHint = step.key === "taDiastolic";

  const suggestions = step.suggestions
    .map((suggestion) => `<button class="quick-value" type="button" data-quick="${suggestion}">${suggestion}</button>`)
    .join("");

  return `
    <div class="number-pad">
      <input
        type="number"
        id="${step.key}"
        class="number-input-large tnum"
        min="${step.limits.min}"
        max="${step.limits.max}"
        value="${escHtml(value)}"
        inputmode="numeric"
        placeholder="0"
        autocomplete="off"
        aria-describedby="${step.key}-unit"
      />
      <span class="number-unit" id="${step.key}-unit">${step.limits.unit} · entre ${step.limits.min} y ${step.limits.max}</span>
      <div class="quick-values">${suggestions}</div>
      <div id="soft-warning">${softWarningMarkup(step.limits, value)}</div>
      ${showClinicalHint ? `<div class="clinical-hint" id="clinical-hint">${clinicalHintMarkup(wizardData.taSystolic, value)}</div>` : ""}
    </div>
  `;
}

function createPositionStep(wizardData) {
  return `
    <div class="option-list">
      ${POSITIONS.map(
        (position) => `
          <label class="option-card ${wizardData.position === position ? "option-card--active" : ""}">
            <input type="radio" name="position" value="${position}" ${wizardData.position === position ? "checked" : ""} />
            <span>${position}</span>
          </label>
        `
      ).join("")}
    </div>
  `;
}

function createObservationsStep(wizardData) {
  const { obsPreset, observations } = wizardData;
  const isOther = obsPreset === "Otro";
  const presets = ["Brazo izquierdo", "Brazo derecho", "Otro"];

  return `
    <div class="obs-options">
      ${presets
        .map(
          (preset) => `
            <label class="obs-option ${obsPreset === preset ? "obs-option--active" : ""}">
              <input type="radio" name="obsPreset" value="${preset}" ${obsPreset === preset ? "checked" : ""} />
              <span>${preset}</span>
            </label>
          `
        )
        .join("")}
    </div>
    ${
      isOther
        ? `<div class="field" style="margin-top:14px;">
             <label for="obsCustom">Describe el detalle</label>
             <textarea id="obsCustom" rows="3" placeholder="Ej. Estaba en reposo desde hace 10 minutos.">${escHtml(observations)}</textarea>
           </div>`
        : ""
    }
  `;
}

function createStepContent(step, wizardData) {
  if (step.type === "number") return createNumberStep(step, wizardData);
  if (step.type === "position") return createPositionStep(wizardData);
  if (step.type === "observations") return createObservationsStep(wizardData);

  if (step.type === "select") {
    return createSelectField({
      id: step.key,
      label: step.title,
      value: wizardData.position,
      options: POSITIONS.map((position) => ({ value: position, label: position }))
    });
  }

  return createField({
    id: step.key,
    label: step.title,
    type: step.type,
    value: wizardData[step.key]
  });
}

export function createWizardModal({ currentStep, wizardData, loading = false, errorMessage = "" }) {
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const ticks = steps
    .map((_, index) => `<span class="wizard-tick ${index <= currentStep ? "done" : ""}"></span>`)
    .join("");

  return `
    <div class="modal" id="record-modal" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <article class="modal-card">
        <div class="modal-head">
          <div style="flex:1;">
            <div class="wizard-progress" role="progressbar" aria-valuenow="${currentStep + 1}" aria-valuemin="1" aria-valuemax="${steps.length}">${ticks}</div>
            <span class="step-pill">Paso ${currentStep + 1} de ${steps.length}</span>
          </div>
          <button id="close-wizard" class="modal-close" type="button" aria-label="Cerrar">${icon("close", { size: 18 })}</button>
        </div>

        <div class="wizard-step" data-step="${currentStep}">
          <h2 class="wizard-title" id="wizard-title">${step.title}</h2>
          <p class="helper wizard-description">${step.description}</p>
          ${createStepContent(step, wizardData)}
          ${errorMessage ? `<p class="message error" style="margin-top:12px;">${escHtml(errorMessage)}</p>` : ""}
        </div>

        <div class="wizard-actions">
          ${isFirstStep ? "" : `<button id="wizard-back" class="ghost-button" type="button">Atrás</button>`}
          <button id="wizard-next" class="button" type="button" ${loading ? "disabled" : ""}>
            ${isLastStep ? "Revisar" : "Continuar"}
          </button>
        </div>
      </article>
    </div>
  `;
}

export function createConfirmModal({ wizardData, loading = false, errorMessage = "" }) {
  const category = classifyBP(wizardData.taSystolic, wizardData.taDiastolic);

  const rows = [
    ["Fecha", wizardData.recordDate],
    ["Hora", wizardData.recordTime],
    ["TA sistólica", `${wizardData.taSystolic} mmHg`],
    ["TA diastólica", `${wizardData.taDiastolic} mmHg`],
    ["Frecuencia", `${wizardData.heartRate} lpm`],
    ["Posición", wizardData.position],
    ["Observaciones", wizardData.observations || "—"]
  ]
    .map(([label, value]) => `<div><strong>${escHtml(label)}</strong><span>${escHtml(value)}</span></div>`)
    .join("");

  return `
    <div class="modal" id="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <article class="modal-card">
        <div class="modal-head">
          <div>
            <span class="step-pill">Último paso</span>
            <h2 class="wizard-title" id="confirm-title">Revisa los datos</h2>
          </div>
          <button id="close-wizard" class="modal-close" type="button" aria-label="Cerrar">${icon("close", { size: 18 })}</button>
        </div>

        <div class="insight" style="margin-bottom:14px;">
          ${bpBadge(category)}
          <span>${escHtml(category.advice)}</span>
        </div>

        <div class="confirm-list">${rows}</div>
        ${errorMessage ? `<p class="message error" style="margin-top:12px;">${escHtml(errorMessage)}</p>` : ""}

        <div class="confirm-actions">
          <button id="confirm-back" class="ghost-button" type="button" ${loading ? "disabled" : ""}>Volver</button>
          <button id="confirm-submit" class="button" type="button" ${loading ? "disabled" : ""}>
            ${loading ? "Guardando…" : "Guardar medición"}
          </button>
        </div>
      </article>
    </div>
  `;
}

export function createSuccessModal() {
  return `
    <div class="modal" id="success-modal" role="dialog" aria-modal="true" aria-live="polite">
      <article class="modal-card" style="width:min(380px,100%);">
        <div class="save-success">
          <span class="success-check">${icon("check", { size: 34, strokeWidth: 3 })}</span>
          <h2 style="font-size:1.2rem;">Medición guardada</h2>
          <p class="helper">Ya aparece en tu historial.</p>
        </div>
      </article>
    </div>
  `;
}

/** Modal de edición de un registro existente. */
export function createEditModal(record, { errorMessage = "", loading = false } = {}) {
  return `
    <div class="modal" id="edit-record-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
      <article class="modal-card">
        <div class="modal-head">
          <div>
            <h2 id="edit-title" style="font-size:1.2rem;">Editar medición</h2>
            <p class="helper">Corrige los datos de esta lectura.</p>
          </div>
          <button id="ef-close" class="modal-close" type="button" aria-label="Cerrar">${icon("close", { size: 18 })}</button>
        </div>

        <div class="form-grid" style="margin-top:14px;">
          <div class="inline-grid-2">
            ${createField({ id: "ef-date", label: "Fecha", type: "date", value: record.record_date })}
            ${createField({ id: "ef-time", label: "Hora", type: "time", value: String(record.record_time).slice(0, 5) })}
          </div>
          <div class="inline-grid-2">
            ${createField({
              id: "ef-sys",
              label: "TA sistólica (mmHg)",
              type: "number",
              value: record.ta_systolic,
              min: MEASUREMENT_LIMITS.systolic.min,
              max: MEASUREMENT_LIMITS.systolic.max,
              inputmode: "numeric"
            })}
            ${createField({
              id: "ef-dia",
              label: "TA diastólica (mmHg)",
              type: "number",
              value: record.ta_diastolic,
              min: MEASUREMENT_LIMITS.diastolic.min,
              max: MEASUREMENT_LIMITS.diastolic.max,
              inputmode: "numeric"
            })}
          </div>
          <div class="inline-grid-2">
            ${createField({
              id: "ef-hr",
              label: "Frecuencia (lpm)",
              type: "number",
              value: record.heart_rate,
              min: MEASUREMENT_LIMITS.heartRate.min,
              max: MEASUREMENT_LIMITS.heartRate.max,
              inputmode: "numeric"
            })}
            ${createSelectField({
              id: "ef-pos",
              label: "Posición",
              value: record.position,
              options: POSITIONS.map((position) => ({ value: position, label: position }))
            })}
          </div>
          ${createField({ id: "ef-obs", label: "Observaciones", type: "textarea", rows: 3, value: record.observations ?? "" })}
        </div>

        ${errorMessage ? `<p class="message error" style="margin-top:10px;">${escHtml(errorMessage)}</p>` : ""}

        <div class="form-actions">
          <button id="ef-cancel" class="ghost-button" type="button">Cancelar</button>
          <button id="ef-save" class="button" type="button" ${loading ? "disabled" : ""}>
            ${loading ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </article>
    </div>
  `;
}

export function createDeleteModal(record) {
  return `
    <div class="modal" id="delete-record-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
      <article class="modal-card" style="width:min(420px,100%);">
        <h2 id="delete-title" style="font-size:1.2rem; margin-bottom:8px;">Eliminar medición</h2>
        <p class="helper">
          Se eliminará la lectura de <strong>${escHtml(record.ta_systolic)}/${escHtml(record.ta_diastolic)} mmHg</strong>
          del ${escHtml(record.record_date)} a las ${escHtml(String(record.record_time).slice(0, 5))}.
          Esta acción no se puede deshacer.
        </p>
        <div class="confirm-actions">
          <button id="del-cancel" class="ghost-button" type="button">Cancelar</button>
          <button id="del-confirm" class="danger-button" type="button">Eliminar</button>
        </div>
      </article>
    </div>
  `;
}
