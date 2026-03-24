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
  const requiredFields = ["recordDate", "recordTime", "ta", "heartRate", "position"];

  for (const field of requiredFields) {
    if (!String(payload[field] ?? "").trim()) {
      throw new Error("Completa todos los campos requeridos del registro.");
    }
  }

  const taMatch = payload.ta.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);

  if (!taMatch) {
    throw new Error("La tension arterial debe tener el formato 120/80.");
  }

  if (Number(payload.heartRate) <= 0) {
    throw new Error("La frecuencia cardiaca debe ser mayor que cero.");
  }

  return {
    systolic: Number(taMatch[1]),
    diastolic: Number(taMatch[2])
  };
}
