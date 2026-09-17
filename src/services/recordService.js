import { recordRepository } from "../repositories/recordRepository.js";
import { getRangeStart, getRangeEnd } from "../utils/date.js";
import { computeStats } from "../utils/stats.js";
import { validateRecordPayload } from "../utils/validation.js";

function mapRecordForView(record) {
  return {
    ...record,
    taLabel: `${record.ta_systolic}/${record.ta_diastolic}`
  };
}

function toRow(payload, validated) {
  return {
    record_date: payload.recordDate,
    record_time: payload.recordTime,
    ta_systolic: validated.systolic,
    ta_diastolic: validated.diastolic,
    heart_rate: validated.heartRate,
    position: payload.position,
    observations: payload.observations?.trim() || null
  };
}

export const recordService = {
  async getUserRecords(userId) {
    const records = await recordRepository.getRecordsByUserId(userId);
    return records.map(mapRecordForView);
  },

  async createRecord(userId, payload) {
    const validated = validateRecordPayload(payload);
    await recordRepository.createRecord({ user_id: userId, ...toRow(payload, validated) });
  },

  async updateRecord(recordId, userId, payload) {
    const validated = validateRecordPayload(payload);
    await recordRepository.updateRecord(recordId, userId, toRow(payload, validated));
  },

  async deleteRecord(recordId, userId) {
    await recordRepository.deleteRecord(recordId, userId);
  },

  /**
   * Estadísticas del periodo elegido.
   *
   * La ventana va de las 00:00 del primer día a las 23:59 del último, y se
   * compara contra la ventana inmediatamente anterior de la misma duración
   * para calcular la tendencia. Todo se recalcula en memoria: los registros ya
   * están cargados, así que cambiar de rango no cuesta una consulta nueva.
   */
  getStats(records, filters) {
    const start = getRangeStart(filters.range, filters.customStart);
    const end = getRangeEnd(filters.range, filters.customEnd);

    const windowMs = Math.max(end - start, 0);
    const prevStart = new Date(start.getTime() - windowMs);

    return computeStats(records, { start, end, prevStart });
  }
};
