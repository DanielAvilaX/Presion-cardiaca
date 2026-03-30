import { createChartMarkup, bindChartTooltip } from "../ui/chart.js";
import { getRangeStart } from "../utils/date.js";

export function createChartController({ root, rangeSelect }) {
  const visibility = { systolic: true, diastolic: true, heartRate: true };
  let allRecords = [];

  function filterRecords(range) {
    if (range === "all") return allRecords;
    const start = getRangeStart(range, "");
    const end = new Date();
    return allRecords.filter((rec) => {
      const d = new Date(`${rec.record_date}T${rec.record_time}`);
      return d >= start && d <= end;
    });
  }

  function render(range) {
    const filtered = filterRecords(range);

    root.innerHTML = createChartMarkup(filtered, visibility);

    const container = root.querySelector(".chart-container");
    if (container) bindChartTooltip(container);

    root.querySelectorAll(".chart-legend-item").forEach((item) => {
      item.addEventListener("click", () => {
        visibility[item.dataset.series] = !visibility[item.dataset.series];
        render(range);
      });
    });

    // Ocultar boton expandir (ya estamos en la pagina expandida)
    root.querySelector(".chart-expand-btn")?.remove();
  }

  return {
    init(records) {
      allRecords = records;
      render(rangeSelect.value);
      rangeSelect.addEventListener("change", () => render(rangeSelect.value));
    },
  };
}
