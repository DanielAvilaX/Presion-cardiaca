/** Utilidades de fecha. Funciones puras, sin dependencias de DOM ni de red. */

const DAYS_BY_RANGE = {
  "7": 6,
  "15": 14,
  "30": 29,
  "180": 179
};

/** Copia de la fecha situada a las 00:00:00.000 de ese mismo dia. */
export function startOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Copia de la fecha situada a las 23:59:59.999 de ese mismo dia. */
export function endOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function formatDisplayDate(dateValue) {
  if (!dateValue) return "-";

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/** Fecha corta para ejes y etiquetas apretadas: "15 jun". */
export function formatShortDate(dateValue) {
  if (!dateValue) return "-";

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
    month: "short",
    day: "numeric"
  });
}

/** Hora "08:30" a partir de un campo `time` de Postgres ("08:30:00"). */
export function formatTime(timeValue) {
  return String(timeValue ?? "").slice(0, 5);
}

export function formatDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDate() {
  return formatDateInputValue();
}

export function getCurrentTime() {
  const date = new Date();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function createDateFromRecord(record) {
  return new Date(`${record.record_date}T${record.record_time}`);
}

/**
 * Inicio de la ventana de tiempo de un rango.
 *
 * Se ancla a las 00:00 del primer dia del rango. Antes se restaban los dias
 * conservando la hora actual, asi que "ultimos 7 dias" consultado a las 20:00
 * dejaba fuera todo lo registrado antes de las 20:00 del septimo dia.
 */
export function getRangeStart(range, customStart) {
  if (range === "custom") {
    return customStart
      ? startOfDay(new Date(`${customStart}T00:00:00`))
      : startOfDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  }

  const offset = DAYS_BY_RANGE[range] ?? 6;
  const start = startOfDay();
  start.setDate(start.getDate() - offset);

  return start;
}

/**
 * Fin de la ventana de tiempo de un rango: el final del dia, para que un
 * registro de hoy mas tarde que "ahora" siga entrando en el periodo.
 */
export function getRangeEnd(range, customEnd) {
  if (range === "custom" && customEnd) {
    return endOfDay(new Date(`${customEnd}T00:00:00`));
  }

  return endOfDay();
}

/** Etiqueta humana del rango, para titulos y textos de resumen. */
export function describeRange(range) {
  const labels = {
    "7": "los ultimos 7 dias",
    "15": "los ultimos 15 dias",
    "30": "el ultimo mes",
    "180": "los ultimos 6 meses",
    all: "todo el historial",
    custom: "el periodo elegido"
  };

  return labels[range] ?? "el periodo elegido";
}
