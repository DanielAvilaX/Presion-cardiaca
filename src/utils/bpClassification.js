/**
 * Clasificacion de tension arterial segun las guias ACC/AHA 2017.
 * Todo se deriva en el frontend a partir de los datos existentes
 * (ta_systolic / ta_diastolic); no se modifica la base de datos.
 *
 * Categorias y colores (escala "rainbow" de la American Heart Association):
 *  - Normal              < 120 y < 80          verde
 *  - Elevada             120-129 y < 80        ambar
 *  - Hipertension 1      130-139 o 80-89       naranja
 *  - Hipertension 2      >= 140 o >= 90        naranja oscuro
 *  - Crisis hipertensiva > 180 o > 120         rojo
 */

export const BP_CATEGORIES = [
  {
    key: "normal",
    label: "Normal",
    level: 0,
    color: "#1f8a5b",
    tint: "rgba(31, 138, 91, 0.12)",
    advice: "Tu presion esta en un rango saludable."
  },
  {
    key: "elevated",
    label: "Elevada",
    level: 1,
    color: "#d39a23",
    tint: "rgba(211, 154, 35, 0.14)",
    advice: "Ligeramente alta. Vigila tu estilo de vida."
  },
  {
    key: "stage1",
    label: "Hipertension 1",
    level: 2,
    color: "#e07b1a",
    tint: "rgba(224, 123, 26, 0.14)",
    advice: "Hipertension etapa 1. Considera consultar a tu medico."
  },
  {
    key: "stage2",
    label: "Hipertension 2",
    level: 3,
    color: "#d2451f",
    tint: "rgba(210, 69, 31, 0.15)",
    advice: "Hipertension etapa 2. Se recomienda valoracion medica."
  },
  {
    key: "crisis",
    label: "Crisis",
    level: 4,
    color: "#c01b1b",
    tint: "rgba(192, 27, 27, 0.18)",
    advice: "Crisis hipertensiva. Busca atencion medica de inmediato."
  }
];

const BY_KEY = Object.fromEntries(BP_CATEGORIES.map((category) => [category.key, category]));

/**
 * Devuelve la categoria de tension arterial para una lectura.
 * Cuando sistolica y diastolica caen en categorias distintas, se toma la mas alta.
 * @param {number} systolic
 * @param {number} diastolic
 * @returns {{key:string,label:string,level:number,color:string,tint:string,advice:string}}
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
