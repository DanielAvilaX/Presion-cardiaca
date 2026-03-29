import { authRepository } from "./repositories/authRepository.js";
import { recordRepository } from "./repositories/recordRepository.js";
import { createChartMarkup, bindChartTooltip } from "./ui/chart.js";
import { getRangeStart } from "./utils/date.js";

const root = document.querySelector("#chart-root");
const rangeSelect = document.querySelector("#range-select-full");

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

(async () => {
  try {
    const session = await authRepository.getSession();
    if (!session?.user) { window.location.href = "index.html"; return; }

    allRecords = await recordRepository.getRecordsByUserId(session.user.id);

    render(rangeSelect.value);

    rangeSelect.addEventListener("change", () => render(rangeSelect.value));
  } catch (err) {
    root.innerHTML = `<p class="message error">${err.message}</p>`;
  }
})();
