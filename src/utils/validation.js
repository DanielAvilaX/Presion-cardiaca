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
    if (!formData[field]?.trim()) {
      throw new Error("Todos los campos del registro son obligatorios.");
    }
  }

  if (formData.email !== formData.confirmEmail) {
    throw new Error("Los correos no coinciden.");
  }

  if (formData.password !== formData.confirmPassword) {
    throw new Error("Las contrasenas no coinciden.");
  }

  if (formData.password.length < 6) {
    throw new Error("La contrasena debe tener al menos 6 caracteres.");
  }

  if (Number(formData.age) < 1) {
    throw new Error("La edad debe ser mayor que cero.");
  }
}

export function validateRecordPayload(payload) {
  const systolic = Number(payload.taSystolic);
  const diastolic = Number(payload.taDiastolic);
  const heartRate = Number(payload.heartRate);

  if (!payload.recordDate || !payload.recordTime || !payload.position) {
    throw new Error("Completa todos los campos requeridos del registro.");
  }

  if (systolic <= 0 || systolic > 200) {
    throw new Error("La TA sistolica debe estar entre 1 y 200 mmHg.");
  }

  if (diastolic <= 0 || diastolic > 120) {
    throw new Error("La TA diastolica debe estar entre 1 y 120 mmHg.");
  }

  if (diastolic >= systolic) {
    throw new Error("La TA sistolica debe ser mayor que la diastolica.");
  }

  if (heartRate <= 0 || heartRate > 120) {
    throw new Error("La frecuencia cardiaca debe estar entre 1 y 120 lpm.");
  }

  return { systolic, diastolic, heartRate };
}
