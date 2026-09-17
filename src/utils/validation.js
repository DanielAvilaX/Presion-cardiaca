/**
 * Limites de captura de cada medicion.
 *
 * Se alinean con los CHECK de `sql/schema.sql` y con la clasificacion clinica:
 * la app definia un maximo de 120 para diastolica y frecuencia, lo que hacia
 * imposible registrar una crisis hipertensiva (diastolica > 120) o una
 * taquicardia real, valores que la base de datos si acepta.
 *
 * `soft` marca el rango habitual: fuera de el se avisa, pero no se bloquea.
 */
export const MEASUREMENT_LIMITS = {
  systolic: {
    key: "systolic",
    label: "TA sistólica",
    unit: "mmHg",
    min: 60,
    max: 260,
    soft: { min: 90, max: 180 }
  },
  diastolic: {
    key: "diastolic",
    label: "TA diastólica",
    unit: "mmHg",
    min: 30,
    max: 200,
    soft: { min: 50, max: 110 }
  },
  heartRate: {
    key: "heartRate",
    label: "Frecuencia cardíaca",
    unit: "lpm",
    min: 25,
    max: 250,
    soft: { min: 45, max: 130 }
  }
};

export function validateRegistration(formData) {
  const requiredFields = [
    "firstName",
    "lastName",
    "age",
    "document",
    "email",
    "confirmEmail",
    "password",
    "confirmPassword"
  ];

  for (const field of requiredFields) {
    if (!String(formData[field] ?? "").trim()) {
      throw new Error("Todos los campos del registro son obligatorios.");
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    throw new Error("Escribe un correo electrónico válido.");
  }

  if (formData.email !== formData.confirmEmail) {
    throw new Error("Los correos no coinciden.");
  }

  if (formData.password !== formData.confirmPassword) {
    throw new Error("Las contraseñas no coinciden.");
  }

  if (formData.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const age = Number(formData.age);
  if (!Number.isFinite(age) || age < 1 || age > 120) {
    throw new Error("La edad debe estar entre 1 y 120 años.");
  }
}

/** Valida un unico valor numerico contra sus limites duros. */
export function validateMeasurement(limits, rawValue) {
  const value = Number(rawValue);

  if (rawValue === "" || rawValue === null || rawValue === undefined || !Number.isFinite(value)) {
    throw new Error(`Escribe un valor válido de ${limits.label}.`);
  }

  if (value < limits.min || value > limits.max) {
    throw new Error(
      `${limits.label} debe estar entre ${limits.min} y ${limits.max} ${limits.unit}.`
    );
  }

  return value;
}

export function validateRecordPayload(payload) {
  if (!payload.recordDate || !payload.recordTime || !payload.position) {
    throw new Error("Completa todos los campos requeridos del registro.");
  }

  const systolic = validateMeasurement(MEASUREMENT_LIMITS.systolic, payload.taSystolic);
  const diastolic = validateMeasurement(MEASUREMENT_LIMITS.diastolic, payload.taDiastolic);
  const heartRate = validateMeasurement(MEASUREMENT_LIMITS.heartRate, payload.heartRate);

  if (diastolic >= systolic) {
    throw new Error("La TA sistólica debe ser mayor que la diastólica.");
  }

  return { systolic, diastolic, heartRate };
}

/**
 * Aviso no bloqueante cuando un valor sale del rango habitual pero sigue
 * siendo registrable. Devuelve `null` si todo esta dentro de lo esperado.
 */
export function getMeasurementWarning(limits, rawValue) {
  const value = Number(rawValue);
  if (!Number.isFinite(value) || rawValue === "" || rawValue === null) return null;
  if (value < limits.min || value > limits.max) return null;

  if (value < limits.soft.min) {
    return `${value} ${limits.unit} es un valor inusualmente bajo. Verifica la lectura.`;
  }

  if (value > limits.soft.max) {
    return `${value} ${limits.unit} es un valor inusualmente alto. Verifica la lectura.`;
  }

  return null;
}
