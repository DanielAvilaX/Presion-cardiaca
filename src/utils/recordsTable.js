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
  filterCategory: "all"
};

/**
 * Filtra, ordena y pagina los registros segun el estado de la tabla.
 * Funcion pura para poder probarla con unit tests.
 */
export function processRecords(records, state = {}) {
  const {
    sortKey = "datetime",
    sortDir = "desc",
    page = 1,
    pageSize = 10,
    filterPosition = "all",
    filterCategory = "all"
  } = state;

  let rows = records.slice();

  if (filterPosition !== "all") {
    rows = rows.filter((record) => record.position === filterPosition);
  }

  if (filterCategory !== "all") {
    rows = rows.filter((record) => classifyRecord(record).key === filterCategory);
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
