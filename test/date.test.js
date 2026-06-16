import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDateInputValue, createDateFromRecord, getRangeStart, getCurrentTime, getTodayDate } from "../src/utils/date.js";

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

test("getRangeStart resta los dias correctos para cada rango", () => {
  const now = new Date();
  const start7 = getRangeStart("7", "");
  const diffDays = Math.round((now - start7) / (1000 * 60 * 60 * 24));
  assert.equal(diffDays, 6);
});

test("getRangeStart usa la fecha personalizada cuando el rango es custom", () => {
  const start = getRangeStart("custom", "2026-01-01");
  assert.equal(formatDateInputValue(start), "2026-01-01");
});

test("getTodayDate y getCurrentTime devuelven formatos validos", () => {
  assert.match(getTodayDate(), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(getCurrentTime(), /^\d{2}:\d{2}$/);
});
