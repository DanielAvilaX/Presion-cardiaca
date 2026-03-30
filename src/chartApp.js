import { authRepository } from "./repositories/authRepository.js";
import { recordRepository } from "./repositories/recordRepository.js";
import { createChartController } from "./controllers/chartController.js";

const root = document.querySelector("#chart-root");
const rangeSelect = document.querySelector("#range-select-full");

(async () => {
  try {
    const session = await authRepository.getSession();
    if (!session?.user) {
      window.location.href = "index.html";
      return;
    }

    const records = await recordRepository.getRecordsByUserId(session.user.id);

    const controller = createChartController({ root, rangeSelect });
    controller.init(records);
  } catch (err) {
    root.innerHTML = `<p class="message error">${err.message}</p>`;
  }
})();
