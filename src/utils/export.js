import { classifyRecord } from "./bpClassification.js";
import { formatTime } from "./date.js";

const HEADERS = [
  "Fecha",
  "Hora",
  "TA sistólica (mmHg)",
  "TA diastólica (mmHg)",
  "Categoría",
  "FC (lpm)",
  "Posición",
  "Observaciones"
];

/**
 * Neutraliza la inyeccion de formulas: una celda que empieza por = + - @ se
 * interpreta como formula al abrir el CSV en Excel o Sheets.
 */
function sanitizeCell(value) {
  const text = String(value ?? "");
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function toCsvCell(value) {
  return `"${sanitizeCell(value).replace(/"/g, '""')}"`;
}

/**
 * Construye el CSV de un conjunto de registros. Funcion pura: recibe los
 * registros ya filtrados y devuelve el texto, para poder probarla sin DOM.
 */
export function buildRecordsCsv(records) {
  const rows = records.map((record) => [
    record.record_date,
    formatTime(record.record_time),
    record.ta_systolic,
    record.ta_diastolic,
    classifyRecord(record).label,
    record.heart_rate,
    record.position,
    record.observations ?? ""
  ]);

  // CRLF: es lo que espera Excel como separador de linea.
  return [HEADERS, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\r\n");
}

/** Nombre de archivo con la fecha del dia: registros-tension-2026-09-17.csv */
export function buildExportFilename(prefix = "registros-tension") {
  const today = new Date();
  const stamp = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  return `${prefix}-${stamp}.csv`;
}

/**
 * Dispara la descarga de un CSV.
 *
 * El enlace se agrega al documento antes de pulsarlo y la URL se libera en el
 * siguiente turno: Firefox y Safari cancelan la descarga si el nodo no esta en
 * el DOM o si se revoca la URL en el mismo tick.
 */
export function downloadCsv(filename, csv) {
  // BOM UTF-8 para que Excel respete los acentos.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 0);
}

export function exportRecords(records, prefix) {
  downloadCsv(buildExportFilename(prefix), buildRecordsCsv(records));
}
