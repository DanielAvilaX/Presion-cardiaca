import { classifyRecord } from "./bpClassification.js";
import { createDateFromRecord } from "./date.js";

const COMPARATORS = {
  datetime: (a, b) => createDateFromRecord(a) - createDateFromRecord(b),
  systolic: (a, b) => a.ta_systolic - b.ta_systolic,
  diastolic: (a, b) => a.ta_diastolic - b.ta_diastolic,
  heartRate: (a, b) => a.heart_rate - b.heart_rate
};

export const DEFAULT_TABLE_STATE = {
  sortKey: "datetime",
  sortDir: "desc",
  page: 1,
  pageSize: 10,
  filterPosition: "all",
  filterCategory: "all",
  search: ""
};

/** Texto sobre el que busca el campo de búsqueda, sin acentos ni mayúsculas. */
function searchableText(record) {
  return [
    record.record_date,
    record.record_time,
    `${record.ta_systolic}/${record.ta_diastolic}`,
    record.ta_systolic,
    record.ta_diastolic,
    record.heart_rate,
    record.position,
    record.observations ?? "",
    classifyRecord(record).label
  ]
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function normalizeQuery(query) {
  return String(query ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Filtra, busca, ordena y pagina los registros según el estado de la tabla.
 * Función pura, para poder probarla con unit tests.
 */
export function processRecords(records, state = {}) {
  const {
    sortKey = "datetime",
    sortDir = "desc",
    page = 1,
    pageSize = 10,
    filterPosition = "all",
    filterCategory = "all",
    search = ""
  } = state;

  let rows = records.slice();

  if (filterPosition !== "all") {
    rows = rows.filter((record) => record.position === filterPosition);
  }

  if (filterCategory !== "all") {
    rows = rows.filter((record) => classifyRecord(record).key === filterCategory);
  }

  const query = normalizeQuery(search);
  if (query) {
    rows = rows.filter((record) => searchableText(record).includes(query));
  }

  const comparator = COMPARATORS[sortKey] ?? COMPARATORS.datetime;
  rows.sort((a, b) => (sortDir === "asc" ? comparator(a, b) : -comparator(a, b)));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage
  };
}
