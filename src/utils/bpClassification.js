/**
 * Clasificacion de tension arterial segun las guias ACC/AHA 2017.
 * Todo se deriva en el frontend a partir de `ta_systolic` / `ta_diastolic`;
 * no se guarda ninguna categoria en la base de datos.
 *
 * Los colores se exponen como variables CSS (no como hex fijos) para que la
 * misma categoria se adapte al tema claro y al oscuro. Por eso deben pintarse
 * siempre via `style="fill: ..."` y no como atributo de presentacion de SVG,
 * donde `var()` no es valido.
 */

export const BP_CATEGORIES = [
  {
    key: "normal",
    label: "Normal",
    level: 0,
    range: "Menos de 120 y menos de 80",
    color: "var(--bp-normal)",
    tint: "var(--bp-normal-tint)",
    advice: "Tu presión está en un rango saludable. Mantén tus hábitos."
  },
  {
    key: "elevated",
    label: "Elevada",
    level: 1,
    range: "120 – 129 y menos de 80",
    color: "var(--bp-elevated)",
    tint: "var(--bp-elevated-tint)",
    advice: "Ligeramente alta. Cuida la sal, el descanso y la actividad física."
  },
  {
    key: "stage1",
    label: "Hipertensión 1",
    level: 2,
    range: "130 – 139 o 80 – 89",
    color: "var(--bp-stage1)",
    tint: "var(--bp-stage1-tint)",
    advice: "Hipertensión etapa 1. Conviene comentarlo con tu médico."
  },
  {
    key: "stage2",
    label: "Hipertensión 2",
    level: 3,
    range: "140 o más, u 90 o más",
    color: "var(--bp-stage2)",
    tint: "var(--bp-stage2-tint)",
    advice: "Hipertensión etapa 2. Se recomienda valoración médica."
  },
  {
    key: "crisis",
    label: "Crisis",
    level: 4,
    range: "Más de 180 o más de 120",
    color: "var(--bp-crisis)",
    tint: "var(--bp-crisis-tint)",
    advice: "Crisis hipertensiva. Busca atención médica de inmediato."
  }
];

const BY_KEY = Object.fromEntries(BP_CATEGORIES.map((category) => [category.key, category]));

/**
 * Categoria de una lectura. Cuando la sistolica y la diastolica caen en
 * categorias distintas se toma siempre la mas alta.
 */
export function classifyBP(systolic, diastolic) {
  const sys = Number(systolic);
  const dia = Number(diastolic);

  if (!Number.isFinite(sys) || !Number.isFinite(dia)) {
    return BY_KEY.normal;
  }

  if (sys > 180 || dia > 120) return BY_KEY.crisis;
  if (sys >= 140 || dia >= 90) return BY_KEY.stage2;
  if (sys >= 130 || dia >= 80) return BY_KEY.stage1;
  if (sys >= 120) return BY_KEY.elevated;
  return BY_KEY.normal;
}

/** Categoria a partir de un registro completo. */
export function classifyRecord(record) {
  return classifyBP(record.ta_systolic, record.ta_diastolic);
}

export function getCategory(key) {
  return BY_KEY[key] ?? BY_KEY.normal;
}
