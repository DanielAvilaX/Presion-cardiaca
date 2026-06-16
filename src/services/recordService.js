import { recordRepository } from "../repositories/recordRepository.js";
import { getRangeStart } from "../utils/date.js";
import { computeStats } from "../utils/stats.js";
import { validateRecordPayload } from "../utils/validation.js";

function mapRecordForView(record) {
  return {
    ...record,
    taLabel: `${record.ta_systolic}/${record.ta_diastolic}`
  };
}

export const recordService = {
  async getUserRecords(userId) {
    const records = await recordRepository.getRecordsByUserId(userId);
    return records.map(mapRecordForView);
  },

  async createRecord(userId, payload) {
    const validated = validateRecordPayload(payload);

    await recordRepository.createRecord({
      user_id: userId,
      record_date: payload.recordDate,
      record_time: payload.recordTime,
      ta_systolic: validated.systolic,
      ta_diastolic: validated.diastolic,
      heart_rate: validated.heartRate,
      position: payload.position,
      observations: payload.observations?.trim() || null
    });
  },

  async updateRecord(recordId, userId, payload) {
    const validated = validateRecordPayload(payload);

    await recordRepository.updateRecord(recordId, userId, {
      record_date: payload.recordDate,
      record_time: payload.recordTime,
      ta_systolic: validated.systolic,
      ta_diastolic: validated.diastolic,
      heart_rate: validated.heartRate,
      position: payload.position,
      observations: payload.observations?.trim() || null
    });
  },

  async deleteRecord(recordId, userId) {
    await recordRepository.deleteRecord(recordId, userId);
  },

  getStats(records, filters) {
    const start = getRangeStart(filters.range, filters.customStart);
    const end =
      filters.range === "custom" && filters.customEnd
        ? new Date(`${filters.customEnd}T23:59:59`)
        : new Date();

    // Ventana anterior de igual longitud para calcular la tendencia.
    const windowMs = Math.max(end - start, 0);
    const prevStart = new Date(start.getTime() - windowMs);

    // Las estadisticas se recalculan en memoria para evitar una consulta nueva por cada filtro.
    return computeStats(records, { start, end, prevStart });
  }
};
