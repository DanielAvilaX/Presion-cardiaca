import { recordService } from "../services/recordService.js";
import { createDashboardView, createDashboardSkeleton } from "../ui/dashboardView.js";
import { createRecordFormController } from "./recordFormController.js";
import { bindChartTooltip } from "../ui/chart.js";
import { formatDateInputValue } from "../utils/date.js";
import { animateCount, animateChartPaths } from "../utils/animations.js";
import { readStorage, writeStorage } from "../utils/storage.js";

const RANGE_STORAGE_KEY = "tension-range";

export function createDashboardController() {
  const state = {
    profile: null,
    user: null,
    records: [],
    filters: {
      range: readStorage(RANGE_STORAGE_KEY) || "7",
      customStart: "",
      customEnd: ""
    },
    chartVisibility: { systolic: true, diastolic: true, heartRate: true }
  };

  let root = null;
  let recordForm = null;

  function getStats() {
    return recordService.getStats(state.records, state.filters);
  }

  async function refreshRecords() {
    state.records = await recordService.getUserRecords(state.user.id);
  }

  function render() {
    root.innerHTML = createDashboardView({
      profile: state.profile,
      records: state.records,
      stats: getStats(),
      filters: state.filters,
      chartVisibility: state.chartVisibility
    });

    bindEvents();

    const chart = root.querySelector(".chart-container");
    if (chart) {
      bindChartTooltip(chart);
      animateChartPaths(chart);
    }

    root.querySelectorAll(".stat-value[data-count]").forEach((element) => {
      const value = Number(element.dataset.count);
      if (value > 0) animateCount(element, value);
    });
  }

  function applyRange(range) {
    state.filters.range = range;
    writeStorage(RANGE_STORAGE_KEY, range);

    // Solo se propone una semana la primera vez: si el usuario ya eligió unas
    // fechas, volver a pulsar "Personalizado" no debe borrárselas.
    if (range === "custom" && !state.filters.customStart) {
      state.filters.customEnd = formatDateInputValue();
      state.filters.customStart = formatDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
    }

    render();
  }

  function bindEvents() {
    root.querySelector("#open-record-modal")?.addEventListener("click", () => recordForm.openCreate());
    root.querySelector("#fab-add")?.addEventListener("click", () => recordForm.openCreate());
    root.querySelector("#empty-add-record")?.addEventListener("click", () => recordForm.openCreate());

    root.querySelectorAll(".range-chip").forEach((chip) => {
      chip.addEventListener("click", () => applyRange(chip.dataset.range));
    });

    root.querySelector("#apply-custom-range")?.addEventListener("click", () => {
      const start = root.querySelector("#custom-start").value;
      const end = root.querySelector("#custom-end").value;

      if (start && end && start > end) {
        state.filters.customStart = end;
        state.filters.customEnd = start;
      } else {
        state.filters.customStart = start;
        state.filters.customEnd = end;
      }

      render();
    });

    root.querySelectorAll(".chart-legend-item").forEach((item) => {
      item.addEventListener("click", () => {
        const series = item.dataset.series;
        const visible = Object.values(state.chartVisibility).filter(Boolean).length;

        // No dejar la gráfica sin ninguna serie visible.
        if (state.chartVisibility[series] && visible === 1) return;

        state.chartVisibility[series] = !state.chartVisibility[series];
        render();
      });
    });
  }

  return {
    async bootstrap({ root: contentRoot, modalRoot, userData }) {
      root = contentRoot;
      state.user = userData.user;
      state.profile = userData.profile;

      recordForm = createRecordFormController({
        modalRoot,
        getUserId: () => state.user.id,
        onSaved: async () => {
          await refreshRecords();
          render();
        }
      });

      root.innerHTML = createDashboardSkeleton();
      await refreshRecords();
      render();
    }
  };
}
