import { test } from "node:test";
import assert from "node:assert/strict";
import { processRecords, DEFAULT_TABLE_STATE } from "../src/utils/recordsTable.js";

const records = [
  { id: 1, record_date: "2026-01-01", record_time: "08:00:00", ta_systolic: 110, ta_diastolic: 70, heart_rate: 60, position: "Sentado", observations: "Brazo izquierdo" },
  { id: 2, record_date: "2026-01-03", record_time: "09:00:00", ta_systolic: 145, ta_diastolic: 92, heart_rate: 80, position: "Acostado", observations: null },
  { id: 3, record_date: "2026-01-02", record_time: "07:00:00", ta_systolic: 125, ta_diastolic: 78, heart_rate: 70, position: "Sentado", observations: "Después de caminar" }
];

test("ordena por fecha descendente por defecto", () => {
  const { rows } = processRecords(records, DEFAULT_TABLE_STATE);
  assert.deepEqual(rows.map((r) => r.id), [2, 3, 1]);
});

test("ordena por sistolica ascendente", () => {
  const { rows } = processRecords(records, { ...DEFAULT_TABLE_STATE, sortKey: "systolic", sortDir: "asc" });
  assert.deepEqual(rows.map((r) => r.ta_systolic), [110, 125, 145]);
});

test("filtra por posicion", () => {
  const { rows, total } = processRecords(records, { ...DEFAULT_TABLE_STATE, filterPosition: "Sentado" });
  assert.equal(total, 2);
  assert.ok(rows.every((r) => r.position === "Sentado"));
});

test("filtra por categoria clinica", () => {
  const { rows, total } = processRecords(records, { ...DEFAULT_TABLE_STATE, filterCategory: "stage2" });
  assert.equal(total, 1);
  assert.equal(rows[0].id, 2);
});

test("busca por observacion ignorando acentos y mayusculas", () => {
  const { rows, total } = processRecords(records, { ...DEFAULT_TABLE_STATE, search: "DESPUES" });
  assert.equal(total, 1);
  assert.equal(rows[0].id, 3);
});

test("busca por valor de tension", () => {
  const { rows } = processRecords(records, { ...DEFAULT_TABLE_STATE, search: "145/92" });
  assert.deepEqual(rows.map((r) => r.id), [2]);
});

test("busca por nombre de categoria", () => {
  const { rows } = processRecords(records, { ...DEFAULT_TABLE_STATE, search: "hipertension 2" });
  assert.deepEqual(rows.map((r) => r.id), [2]);
});

test("una busqueda sin coincidencias devuelve cero filas", () => {
  const { rows, total } = processRecords(records, { ...DEFAULT_TABLE_STATE, search: "zzzz" });
  assert.equal(total, 0);
  assert.equal(rows.length, 0);
});

test("una busqueda vacia no filtra nada", () => {
  const { total } = processRecords(records, { ...DEFAULT_TABLE_STATE, search: "   " });
  assert.equal(total, 3);
});

test("la busqueda se combina con los filtros", () => {
  const { total } = processRecords(records, { ...DEFAULT_TABLE_STATE, filterPosition: "Sentado", search: "brazo" });
  assert.equal(total, 1);
});

test("tolera observaciones nulas al buscar", () => {
  assert.doesNotThrow(() => processRecords(records, { ...DEFAULT_TABLE_STATE, search: "acostado" }));
});

test("pagina y limita la cantidad de filas", () => {
  const { rows, totalPages, page } = processRecords(records, { ...DEFAULT_TABLE_STATE, pageSize: 2, page: 1 });
  assert.equal(rows.length, 2);
  assert.equal(totalPages, 2);
  assert.equal(page, 1);
});

test("ajusta la pagina fuera de rango al maximo disponible", () => {
  const { rows, page } = processRecords(records, { ...DEFAULT_TABLE_STATE, pageSize: 2, page: 99 });
  assert.equal(page, 2);
  assert.equal(rows.length, 1);
});

test("no muta el arreglo original", () => {
  const original = records.map((r) => r.id);
  processRecords(records, { ...DEFAULT_TABLE_STATE, sortKey: "systolic", sortDir: "asc" });
  assert.deepEqual(records.map((r) => r.id), original);
});
