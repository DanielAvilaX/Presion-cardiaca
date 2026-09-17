import { icon } from "./icons.js";
import { escHtml } from "../utils/html.js";
import { toggleTheme, getActiveTheme, initTheme } from "../utils/theme.js";
import { authService } from "../services/authService.js";

/**
 * Esqueleto compartido por todas las pantallas autenticadas.
 *
 * En escritorio la navegacion es una barra lateral fija; en movil se convierte
 * en una barra inferior de 4 pestanas, que es el patron que espera cualquiera
 * que use una app de salud en el telefono.
 */

export const NAV_ITEMS = [
  { id: "inicio", href: "index.html", label: "Inicio", icon: "home" },
  { id: "historial", href: "history.html", label: "Historial", icon: "list" },
  { id: "grafica", href: "chart.html", label: "Gráfica", icon: "chart" },
  { id: "ajustes", href: "settings.html", label: "Ajustes", icon: "settings" }
];

function initials(profile) {
  const first = profile?.first_name?.trim()?.[0] ?? "";
  const last = profile?.last_name?.trim()?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

function fullName(profile) {
  return `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
}

function brandMark(size = 32) {
  return `<img class="brand-mark" src="./assets/icon-192.png" width="${size}" height="${size}" alt="" />`;
}

function navLinks(active, className) {
  return NAV_ITEMS.map((item) => {
    const current = item.id === active ? ' aria-current="page"' : "";
    return `<a class="${className}" href="${item.href}"${current}>
      ${icon(item.icon, { size: className === "tab-item" ? 21 : 19 })}
      <span>${item.label}</span>
    </a>`;
  }).join("");
}

function sidebarMarkup(active, profile) {
  return `
    <a class="brand" href="index.html">${brandMark()} Tensión</a>
    <nav aria-label="Navegación principal" style="display:grid; gap:4px;">
      ${navLinks(active, "nav-link")}
    </nav>
    <div class="sidebar-foot">
      <div class="nav-user">
        <span class="avatar" aria-hidden="true">${escHtml(initials(profile))}</span>
        <span class="nav-user-name">${escHtml(fullName(profile) || "Mi cuenta")}</span>
      </div>
      <button class="nav-link js-theme-toggle" type="button"></button>
      <button class="nav-link js-logout" type="button">
        ${icon("logout", { size: 19 })}<span>Cerrar sesión</span>
      </button>
    </div>
  `;
}

function topbarMarkup(title) {
  return `
    <a class="brand" href="index.html" style="padding:0; font-size:1rem;">
      ${brandMark(28)} ${escHtml(title || "Tensión")}
    </a>
    <div class="topbar-actions">
      <button class="icon-button js-theme-toggle" type="button"></button>
    </div>
  `;
}

/** Refresca el icono y la etiqueta de todos los botones de tema de la pagina. */
function refreshThemeButtons() {
  const dark = getActiveTheme() === "dark";
  const label = dark ? "Tema claro" : "Tema oscuro";

  document.querySelectorAll(".js-theme-toggle").forEach((button) => {
    const isNavLink = button.classList.contains("nav-link");
    button.innerHTML = icon(dark ? "sun" : "moon", { size: isNavLink ? 19 : 20 }) +
      (isNavLink ? `<span>${label}</span>` : "");
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  });
}

function confirmLogout(modalRoot) {
  const host = modalRoot ?? document.querySelector("#modal-root");
  if (!host) return;

  host.innerHTML = `
    <div class="modal" id="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title">
      <article class="modal-card" style="width:min(400px,100%);">
        <h2 id="logout-title" style="font-size:1.2rem; margin-bottom:6px;">Cerrar sesión</h2>
        <p class="helper">¿Seguro que quieres salir de tu cuenta?</p>
        <div class="confirm-actions">
          <button id="logout-cancel" class="ghost-button" type="button">Cancelar</button>
          <button id="logout-confirm" class="button" type="button">Cerrar sesión</button>
        </div>
      </article>
    </div>
  `;

  const close = () => { host.innerHTML = ""; };
  const modal = host.querySelector("#logout-modal");
  modal.addEventListener("mousedown", (event) => {
    if (event.target === modal) close();
  });
  host.querySelector("#logout-cancel").addEventListener("click", close);
  host.querySelector("#logout-confirm").addEventListener("click", async () => {
    close();
    await authService.logout();
    // Recargar deja la app en un estado limpio y sin sesion.
    window.location.href = "index.html";
  });

  host.querySelector("#logout-confirm").focus();
}

/**
 * Monta el esqueleto dentro de `root` y devuelve el contenedor de contenido.
 * @returns {HTMLElement} el elemento `.content` donde renderiza cada pantalla.
 */
export function mountShell(root, { active, title, profile = null, modalRoot = null } = {}) {
  initTheme();

  root.innerHTML = `
    <div class="app">
      <aside class="sidebar">${sidebarMarkup(active, profile)}</aside>
      <div class="app-body">
        <header class="topbar">${topbarMarkup(title)}</header>
        <main class="app-main">
          <div class="content"></div>
        </main>
      </div>
    </div>
    <nav class="tabbar" aria-label="Navegación principal">
      <div class="tabbar-inner">${navLinks(active, "tab-item")}</div>
    </nav>
  `;

  refreshThemeButtons();

  root.querySelectorAll(".js-theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      toggleTheme();
      refreshThemeButtons();
    });
  });

  root.querySelectorAll(".js-logout").forEach((button) => {
    button.addEventListener("click", () => confirmLogout(modalRoot));
  });

  return root.querySelector(".content");
}

/** Actualiza el nombre del usuario en la barra lateral una vez cargado el perfil. */
export function updateShellProfile(root, profile) {
  const avatar = root.querySelector(".avatar");
  const name = root.querySelector(".nav-user-name");
  if (avatar) avatar.textContent = initials(profile);
  if (name) name.textContent = fullName(profile) || "Mi cuenta";
}

/** Barra de tema para pantallas sin esqueleto (login). */
export function initStandaloneTheme() {
  initTheme();
  refreshThemeButtons();
  document.querySelectorAll(".js-theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      toggleTheme();
      refreshThemeButtons();
    });
  });
}
