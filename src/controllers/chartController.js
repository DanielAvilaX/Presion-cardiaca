import { createChartMarkup, bindChartTooltip } from "../ui/chart.js";
import { distributionBar, sparkline } from "../ui/components.js";
import { getRangeStart } from "../utils/date.js";
import { averageOf, distribution } from "../utils/stats.js";
import { animateChartPaths, animateCount } from "../utils/animations.js";

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

  function summaryMarkup(filtered) {
    const avg = averageOf(filtered);
    const chrono = [...filtered].sort(
      (a, b) => new Date(`${a.record_date}T${a.record_time}`) - new Date(`${b.record_date}T${b.record_time}`)
    );

    return `
      <div class="stat-grid">
        <article class="stat-box">
          <span class="stat-label">Promedio sistolica</span>
          <strong data-count="${avg.systolic}">${avg.systolic || "--"}</strong>
          ${sparkline(chrono.map((r) => r.ta_systolic), { color: "var(--series-sys)", width: 160 })}
        </article>
        <article class="stat-box">
          <span class="stat-label">Promedio diastolica</span>
          <strong data-count="${avg.diastolic}">${avg.diastolic || "--"}</strong>
          ${sparkline(chrono.map((r) => r.ta_diastolic), { color: "var(--series-dia)", width: 160 })}
        </article>
        <article class="stat-box">
          <span class="stat-label">Promedio FC</span>
          <strong data-count="${avg.heartRate}">${avg.heartRate || "--"}</strong>
          ${sparkline(chrono.map((r) => r.heart_rate), { color: "var(--series-hr)", width: 160 })}
        </article>
      </div>
    `;
  }

  function render(range) {
    const filtered = filterRecords(range);

    root.innerHTML = `
      ${summaryMarkup(filtered)}
      <article class="card">
        ${createChartMarkup(filtered, visibility)}
        <div>
          <h4 style="margin:14px 0 0;">Distribucion por categoria</h4>
          ${distributionBar(distribution(filtered), filtered.length)}
        </div>
      </article>
    `;

    const container = root.querySelector(".chart-container");
    if (container) {
      bindChartTooltip(container);
      animateChartPaths(container);
    }

    root.querySelectorAll(".stat-box strong[data-count]").forEach((el) => {
      const value = Number(el.dataset.count);
      if (value > 0) animateCount(el, value);
    });

    root.querySelectorAll(".chart-legend-item").forEach((item) => {
      item.addEventListener("click", () => {
        visibility[item.dataset.series] = !visibility[item.dataset.series];
        render(range);
      });
    });

    // Ocultar boton expandir (ya estamos en la pagina expandida).
    root.querySelector(".chart-expand-btn")?.remove();
  }

  return {
    init(records) {
      allRecords = records;
      render(rangeSelect.value);
      rangeSelect.addEventListener("change", () => render(rangeSelect.value));
    }
  };
}
