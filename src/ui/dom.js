export function createField({ id, label, type = "text", value = "", placeholder = "", min = "", rows = 4 }) {
  if (type === "textarea") {
    return `
      <div class="field">
        <label for="${id}">${label}</label>
        <textarea id="${id}" placeholder="${placeholder}" rows="${rows}">${value}</textarea>
      </div>
    `;
  }

  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <input id="${id}" type="${type}" value="${value}" placeholder="${placeholder}" min="${min}" />
    </div>
  `;
}

export function createSelectField({ id, label, options, value = "" }) {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <select id="${id}">
        ${options
          .map(
            (option) =>
              `<option value="${option.value}" ${option.value === value ? "selected" : ""}>${option.label}</option>`
          )
          .join("")}
      </select>
    </div>
  `;
}
