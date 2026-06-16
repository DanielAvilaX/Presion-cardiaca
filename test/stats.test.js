import { test } from "node:test";
import assert from "node:assert/strict";
import { averageOf, distribution, trendDelta, computeStats } from "../src/utils/stats.js";

function rec(date, sys, dia, hr) {
  return { record_date: date, record_time: "08:00:00", ta_systolic: sys, ta_diastolic: dia, heart_rate: hr };
}

test("averageOf devuelve ceros sin registros", () => {
  assert.deepEqual(averageOf([]), { systolic: 0, diastolic: 0, heartRate: 0 });
});

test("averageOf redondea los promedios", () => {
  const result = averageOf([rec("2026-01-01", 120, 80, 70), rec("2026-01-02", 131, 85, 75)]);
  assert.deepEqual(result, { systolic: 126, diastolic: 83, heartRate: 73 });
});

test("distribution cuenta por categoria", () => {
  const dist = distribution([
    rec("2026-01-01", 110, 70, 60), // normal
    rec("2026-01-02", 125, 78, 60), // elevated
    rec("2026-01-03", 145, 92, 60) // stage2
  ]);
  assert.equal(dist.normal, 1);
  assert.equal(dist.elevated, 1);
  assert.equal(dist.stage2, 1);
  assert.equal(dist.crisis, 0);
});

test("trendDelta sin periodo previo devuelve null/flat", () => {
  assert.deepEqual(trendDelta(120, 0), { deltaPct: null, direction: "flat" });
});

test("trendDelta calcula direccion y porcentaje", () => {
  assert.deepEqual(trendDelta(110, 100), { deltaPct: 10, direction: "up" });
  assert.deepEqual(trendDelta(90, 100), { deltaPct: -10, direction: "down" });
  assert.deepEqual(trendDelta(100, 100), { deltaPct: 0, direction: "flat" });
});

test("computeStats filtra ventana actual y previa y calcula tendencia", () => {
  const records = [
    rec("2026-01-10", 120, 80, 70), // ventana actual
    rec("2026-01-09", 122, 82, 72), // ventana actual
    rec("2026-01-04", 130, 88, 80), // ventana previa
    rec("2026-01-01", 100, 60, 50) // fuera de ambas
  ];

  const stats = computeStats(records, {
    start: new Date("2026-01-08T00:00:00"),
    end: new Date("2026-01-11T23:59:59"),
    prevStart: new Date("2026-01-04T00:00:00")
  });

  assert.equal(stats.count, 2);
  assert.equal(stats.previousCount, 1);
  assert.equal(stats.averageSystolic, 121);
  // actual (121) frente a previa (130) => baja
  assert.equal(stats.trend.systolic.direction, "down");
});

test("computeStats marca tendencia flat sin ventana previa", () => {
  const records = [rec("2026-01-10", 120, 80, 70)];
  const stats = computeStats(records, {
    start: new Date("2026-01-08T00:00:00"),
    end: new Date("2026-01-11T23:59:59"),
    prevStart: new Date("2026-01-04T00:00:00")
  });
  assert.equal(stats.trend.systolic.direction, "flat");
  assert.equal(stats.trend.systolic.deltaPct, null);
});
