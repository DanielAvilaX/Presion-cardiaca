import { createChartMarkup, bindChartTooltip, categoryScaleMarkup, SERIES } from "../ui/chart.js";
import { statTile, distributionBar } from "../ui/components.js";
import { getRangeStart, getRangeEnd, describeRange } from "../utils/date.js";
import { averageOf, distribution } from "../utils/stats.js";
import { createDateFromRecord } from "../utils/date.js";
import { animateChartPaths, animateCount } from "../utils/animations.js";
import { escHtml } from "../utils/html.js";

export function createChartController({ root, rangeSelect }) {
  const visibility = { systolic: true, diastolic: true, heartRate: true };
  let allRecords = [];
  let currentRange = "all";

  function filterRecords(range) {
    if (range === "all") return allRecords;

    const start = getRangeStart(range, "");
    const end = getRangeEnd(range, "");

    return allRecords.filter((record) => {
      const date = createDateFromRecord(record);
      return date >= start && date <= end;
    });
  }

  function render() {
    const filtered = filterRecords(currentRange);
    const chrono = [...filtered].sort((a, b) => createDateFromRecord(a) - createDateFromRecord(b));
    const average = averageOf(filtered);
    const [sys, dia, hr] = SERIES;

    root.innerHTML = `
      <div class="stat-grid">
        ${statTile({
          label: "Sistólica promedio",
          value: average.systolic,
          unit: "mmHg",
          series: chrono.map((record) => record.ta_systolic),
          color: sys.color
        })}
        ${statTile({
          label: "Diastólica promedio",
          value: average.diastolic,
          unit: "mmHg",
          series: chrono.map((record) => record.ta_diastolic),
          color: dia.color
        })}
        ${statTile({
          label: "Frecuencia promedio",
          value: average.heartRate,
          unit: "lpm",
          series: chrono.map((record) => record.heart_rate),
          color: hr.color,
          dashed: true
        })}
      </div>

      <article class="card">
        <div class="card-head">
          <div>
            <h3>Evolución</h3>
            <p class="helper">
              ${filtered.length} lectura${filtered.length === 1 ? "" : "s"} en ${escHtml(describeRange(currentRange))}.
            </p>
          </div>
        </div>
        ${createChartMarkup(filtered, visibility)}
      </article>

      <article class="card">
        <div class="card-head">
          <div>
            <h3>Distribución por categoría</h3>
            <p class="helper">Cuántas lecturas cayeron en cada rango clínico.</p>
          </div>
        </div>
        ${distributionBar(distribution(filtered), filtered.length)}
        <div style="margin-top:18px; padding-top:16px; border-top:1px solid var(--line);">
          <h4 style="margin-bottom:10px;">Referencia clínica</h4>
          ${categoryScaleMarkup()}
        </div>
      </article>
    `;

    const container = root.querySelector(".chart-container");
    if (container) {
      bindChartTooltip(container);
      animateChartPaths(container);
    }

    root.querySelectorAll(".stat-value[data-count]").forEach((element) => {
      const value = Number(element.dataset.count);
      if (value > 0) animateCount(element, value);
    });

    root.querySelectorAll(".chart-legend-item").forEach((item) => {
      item.addEventListener("click", () => {
        const series = item.dataset.series;
        const visible = Object.values(visibility).filter(Boolean).length;
        if (visibility[series] && visible === 1) return;

        visibility[series] = !visibility[series];
        render();
      });
    });
  }

  return {
    init(records) {
      allRecords = records;
      currentRange = rangeSelect?.value ?? "all";
      render();

      rangeSelect?.addEventListener("change", () => {
        currentRange = rangeSelect.value;
        render();
      });
    }
  };
}
