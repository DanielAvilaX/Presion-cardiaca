export function formatDisplayDate(dateValue) {
  if (!dateValue) return "-";

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function getCurrentTime() {
  const date = new Date();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function createDateFromRecord(record) {
  return new Date(`${record.record_date}T${record.record_time}`);
}

export function getRangeStart(range, customStart) {
  const now = new Date();
  const start = new Date(now);

  if (range === "custom") {
    return customStart ? new Date(`${customStart}T00:00:00`) : new Date(now.setDate(now.getDate() - 6));
  }

  const daysMap = {
    "7": 6,
    "15": 14,
    "30": 29,
    "180": 179
  };

  const offset = daysMap[range] ?? 6;
  start.setDate(start.getDate() - offset);

  return start;
}
