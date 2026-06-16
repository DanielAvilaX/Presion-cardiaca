import { createDateFromRecord } from "./date.js";
import { classifyRecord, BP_CATEGORIES } from "./bpClassification.js";

/**
 * Funciones de estadistica puras (sin dependencias de red ni DOM) para que
 * puedan probarse con unit tests. La capa de servicio calcula los limites de
 * fecha y delega aqui el calculo.
 */

/** Promedio redondeado de las tres metricas. Devuelve 0 cuando no hay datos. */
export function averageOf(records) {
  if (!records.length) {
    return { systolic: 0, diastolic: 0, heartRate: 0 };
  }

  const totals = records.reduce(
    (acc, record) => {
      acc.systolic += record.ta_systolic;
      acc.diastolic += record.ta_diastolic;
      acc.heartRate += record.heart_rate;
      return acc;
    },
    { systolic: 0, diastolic: 0, heartRate: 0 }
  );

  const count = records.length;
  return {
    systolic: Math.round(totals.systolic / count),
    diastolic: Math.round(totals.diastolic / count),
    heartRate: Math.round(totals.heartRate / count)
  };
}

/** Conteo de registros por categoria clinica. */
export function distribution(records) {
  const counts = Object.fromEntries(BP_CATEGORIES.map((category) => [category.key, 0]));
  records.forEach((record) => {
    counts[classifyRecord(record).key] += 1;
  });
  return counts;
}

/**
 * Variacion de una metrica frente al periodo anterior.
 * @returns {{deltaPct:(number|null),direction:('up'|'down'|'flat')}}
 */
export function trendDelta(current, previous) {
  if (!previous) {
    return { deltaPct: null, direction: "flat" };
  }

  const diff = current - previous;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const deltaPct = previous === 0 ? null : Math.round((diff / previous) * 100);

  return { deltaPct, direction };
}

function withinRange(record, start, end) {
  const date = createDateFromRecord(record);
  return date >= start && date <= end;
}

/**
 * Calcula las estadisticas completas de un conjunto de registros para una
 * ventana de tiempo, incluyendo la comparacion con la ventana anterior.
 * @param {Array} records
 * @param {{start:Date,end:Date,prevStart:Date}} bounds
 */
export function computeStats(records, { start, end, prevStart }) {
  const filtered = records.filter((record) => withinRange(record, start, end));
  const previous = prevStart
    ? records.filter((record) => {
        const date = createDateFromRecord(record);
        return date >= prevStart && date < start;
      })
    : [];

  const currentAvg = averageOf(filtered);
  const previousAvg = averageOf(previous);

  return {
    filtered,
    count: filtered.length,
    previousCount: previous.length,
    averageSystolic: currentAvg.systolic,
    averageDiastolic: currentAvg.diastolic,
    averageHeartRate: currentAvg.heartRate,
    distribution: distribution(filtered),
    trend: {
      systolic: trendDelta(currentAvg.systolic, previous.length ? previousAvg.systolic : 0),
      diastolic: trendDelta(currentAvg.diastolic, previous.length ? previousAvg.diastolic : 0),
      heartRate: trendDelta(currentAvg.heartRate, previous.length ? previousAvg.heartRate : 0)
    }
  };
}
