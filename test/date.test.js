import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatDateInputValue,
  createDateFromRecord,
  getRangeStart,
  getRangeEnd,
  getCurrentTime,
  getTodayDate,
  startOfDay,
  endOfDay,
  formatTime
} from "../src/utils/date.js";

const DAY_MS = 24 * 60 * 60 * 1000;

test("formatDateInputValue formatea como YYYY-MM-DD con ceros a la izquierda", () => {
  assert.equal(formatDateInputValue(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(formatDateInputValue(new Date(2026, 11, 31)), "2026-12-31");
});

test("createDateFromRecord combina fecha y hora", () => {
  const date = createDateFromRecord({ record_date: "2026-06-15", record_time: "14:30:00" });
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getHours(), 14);
  assert.equal(date.getMinutes(), 30);
});

test("startOfDay y endOfDay fijan los limites del dia", () => {
  const base = new Date(2026, 5, 15, 17, 42, 13, 500);
  const start = startOfDay(base);
  const end = endOfDay(base);

  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(start.getSeconds(), 0);
  assert.equal(start.getMilliseconds(), 0);
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.getSeconds(), 59);
  // No muta la fecha original.
  assert.equal(base.getHours(), 17);
});

// Regresion: antes se restaban los dias conservando la hora actual, asi que
// "ultimos 7 dias" consultado a las 20:00 dejaba fuera lo registrado antes de
// las 20:00 del septimo dia.
test("getRangeStart arranca a las 00:00 del primer dia del rango", () => {
  const start = getRangeStart("7", "");
  const expected = startOfDay(new Date(Date.now() - 6 * DAY_MS));

  assert.equal(start.getTime(), expected.getTime());
  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
});

test("getRangeStart resta los dias correctos para cada rango", () => {
  const today = startOfDay();
  const cases = { "7": 6, "15": 14, "30": 29, "180": 179 };

  for (const [range, offset] of Object.entries(cases)) {
    const diffDays = Math.round((today - getRangeStart(range, "")) / DAY_MS);
    assert.equal(diffDays, offset, `rango ${range}`);
  }
});

test("getRangeStart usa la fecha personalizada cuando el rango es custom", () => {
  const start = getRangeStart("custom", "2026-01-01");
  assert.equal(formatDateInputValue(start), "2026-01-01");
  assert.equal(start.getHours(), 0);
});

test("getRangeEnd cierra el dia para que entren los registros de hoy", () => {
  const end = getRangeEnd("7", "");
  assert.equal(formatDateInputValue(end), formatDateInputValue(new Date()));
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
});

test("getRangeEnd usa la fecha final personalizada completa", () => {
  const end = getRangeEnd("custom", "2026-03-10");
  assert.equal(formatDateInputValue(end), "2026-03-10");
  assert.equal(end.getHours(), 23);
});

test("formatTime recorta los segundos del campo time", () => {
  assert.equal(formatTime("08:30:00"), "08:30");
  assert.equal(formatTime(null), "");
});

test("getTodayDate y getCurrentTime devuelven formatos validos", () => {
  assert.match(getTodayDate(), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(getCurrentTime(), /^\d{2}:\d{2}$/);
});
