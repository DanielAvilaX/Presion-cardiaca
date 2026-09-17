import { authService } from "./services/authService.js";
import { recordService } from "./services/recordService.js";
import { createChartController } from "./controllers/chartController.js";
import { mountShell } from "./ui/appShell.js";
import { escHtml } from "./utils/html.js";

const root = document.querySelector("#root");
const modalRoot = document.querySelector("#modal-root");

const RANGES = [
  { value: "7", label: "Últimos 7 días" },
  { value: "15", label: "Últimos 15 días" },
  { value: "30", label: "Último mes" },
  { value: "180", label: "Últimos 6 meses" },
  { value: "all", label: "Todo el historial" }
];

(async () => {
  try {
    const userData = await authService.loadCurrentUser();

    if (!userData?.user) {
      window.location.replace("index.html");
      return;
    }

    const content = mountShell(root, {
      active: "grafica",
      title: "Gráfica",
      profile: userData.profile,
      modalRoot
    });

    const options = RANGES.map(
      (range) => `<option value="${range.value}" ${range.value === "all" ? "selected" : ""}>${range.label}</option>`
    ).join("");

    content.innerHTML = `
      <section class="page-head">
        <div>
          <h1>Gráfica</h1>
          <p class="helper">Cómo ha evolucionado tu tensión y tu pulso.</p>
        </div>
        <div class="field" style="min-width:210px;">
          <label class="sr-only" for="range-select-full">Rango de tiempo</label>
          <select id="range-select-full">${options}</select>
        </div>
      </section>
      <div id="chart-root" class="chart-page"></div>
    `;

    const records = await recordService.getUserRecords(userData.user.id);

    const controller = createChartController({
      root: content.querySelector("#chart-root"),
      rangeSelect: content.querySelector("#range-select-full")
    });

    controller.init(records);
  } catch (error) {
    root.innerHTML = `
      <div class="app-main"><div class="content">
        <article class="card">
          <h2 style="margin-bottom:6px;">No se pudo cargar la gráfica</h2>
          <p class="message error">${escHtml(error.message)}</p>
          <p class="helper" style="margin-top:10px;"><a href="index.html">Volver al inicio</a></p>
        </article>
      </div></div>
    `;
  }
})();
