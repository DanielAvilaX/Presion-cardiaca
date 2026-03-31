import { recordRepository } from "../repositories/recordRepository.js";
import { createDateFromRecord, getRangeStart } from "../utils/date.js";
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
    const startDate = getRangeStart(filters.range, filters.customStart);
    const endDate =
      filters.range === "custom" && filters.customEnd
        ? new Date(`${filters.customEnd}T23:59:59`)
        : new Date();

    // Las estadisticas se recalculan en memoria para evitar una consulta nueva por cada filtro.
    const filtered = records.filter((record) => {
      const recordDate = createDateFromRecord(record);
      return recordDate >= startDate && recordDate <= endDate;
    });

    const totals = filtered.reduce(
      (accumulator, record) => {
        accumulator.systolic += record.ta_systolic;
        accumulator.diastolic += record.ta_diastolic;
        accumulator.heartRate += record.heart_rate;
        return accumulator;
      },
      { systolic: 0, diastolic: 0, heartRate: 0 }
    );

    return {
      filtered,
      averageSystolic: filtered.length ? Math.round(totals.systolic / filtered.length) : 0,
      averageDiastolic: filtered.length ? Math.round(totals.diastolic / filtered.length) : 0,
      averageHeartRate: filtered.length ? Math.round(totals.heartRate / filtered.length) : 0
    };
  }
};
