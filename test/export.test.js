import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRecordsCsv, buildExportFilename } from "../src/utils/export.js";

function rec(overrides = {}) {
  return {
    record_date: "2026-01-10",
    record_time: "08:30:00",
    ta_systolic: 145,
    ta_diastolic: 92,
    heart_rate: 78,
    position: "Sentado",
    observations: "Brazo izquierdo",
    ...overrides
  };
}

test("incluye encabezados y una fila por registro", () => {
  const lines = buildRecordsCsv([rec(), rec({ record_date: "2026-01-11" })]).split("\r\n");
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^"Fecha","Hora"/);
});

test("recorta los segundos de la hora y agrega la categoria clinica", () => {
  const [, row] = buildRecordsCsv([rec()]).split("\r\n");
  assert.match(row, /"08:30"/);
  assert.match(row, /"Hipertensión 2"/);
});

test("escapa las comillas dobles duplicandolas", () => {
  const [, row] = buildRecordsCsv([rec({ observations: 'Dijo "me mareo"' })]).split("\r\n");
  assert.match(row, /"Dijo ""me mareo"""/);
});

test("neutraliza celdas que Excel interpretaria como formula", () => {
  const [, row] = buildRecordsCsv([rec({ observations: "=1+1" })]).split("\r\n");
  assert.match(row, /"'=1\+1"/);
});

test("convierte observaciones nulas en celda vacia", () => {
  const [, row] = buildRecordsCsv([rec({ observations: null })]).split("\r\n");
  assert.ok(row.endsWith(',""'));
});

test("sin registros deja solo la fila de encabezados", () => {
  assert.equal(buildRecordsCsv([]).split("\r\n").length, 1);
});

test("el nombre de archivo lleva la fecha y termina en .csv", () => {
  assert.match(buildExportFilename(), /^registros-tension-\d{4}-\d{2}-\d{2}\.csv$/);
  assert.match(buildExportFilename("historial"), /^historial-\d{4}-\d{2}-\d{2}\.csv$/);
});
