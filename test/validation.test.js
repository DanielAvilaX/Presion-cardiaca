import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRegistration, validateRecordPayload } from "../src/utils/validation.js";

function validRegistration(overrides = {}) {
  return {
    firstName: "Ana",
    lastName: "Perez",
    age: "30",
    document: "123456789",
    email: "ana@ejemplo.com",
    confirmEmail: "ana@ejemplo.com",
    password: "secreto123",
    confirmPassword: "secreto123",
    ...overrides
  };
}

test("validateRegistration acepta datos validos", () => {
  assert.doesNotThrow(() => validateRegistration(validRegistration()));
});

test("validateRegistration exige todos los campos", () => {
  assert.throws(() => validateRegistration(validRegistration({ firstName: "" })), /obligatorios/);
});

test("validateRegistration verifica que los correos coincidan", () => {
  assert.throws(() => validateRegistration(validRegistration({ confirmEmail: "otro@ejemplo.com" })), /correos no coinciden/);
});

test("validateRegistration verifica que las contrasenas coincidan", () => {
  assert.throws(() => validateRegistration(validRegistration({ confirmPassword: "distinta" })), /contrasenas no coinciden/);
});

test("validateRegistration exige minimo 6 caracteres de contrasena", () => {
  assert.throws(() => validateRegistration(validRegistration({ password: "123", confirmPassword: "123" })), /al menos 6/);
});

test("validateRecordPayload devuelve numeros con datos validos", () => {
  const result = validateRecordPayload({
    recordDate: "2026-06-15",
    recordTime: "08:00",
    position: "Sentado",
    taSystolic: "120",
    taDiastolic: "80",
    heartRate: "70"
  });
  assert.deepEqual(result, { systolic: 120, diastolic: 80, heartRate: 70 });
});

test("validateRecordPayload exige diastolica menor que sistolica", () => {
  assert.throws(
    () =>
      validateRecordPayload({
        recordDate: "2026-06-15",
        recordTime: "08:00",
        position: "Sentado",
        taSystolic: "120",
        taDiastolic: "120",
        heartRate: "70"
      }),
    /mayor que la diastolica/
  );
});

test("validateRecordPayload valida los rangos de sistolica", () => {
  assert.throws(
    () =>
      validateRecordPayload({
        recordDate: "2026-06-15",
        recordTime: "08:00",
        position: "Sentado",
        taSystolic: "250",
        taDiastolic: "80",
        heartRate: "70"
      }),
    /sistolica debe estar entre/
  );
});

test("validateRecordPayload exige campos obligatorios", () => {
  assert.throws(
    () => validateRecordPayload({ recordDate: "", recordTime: "", position: "", taSystolic: "120", taDiastolic: "80", heartRate: "70" }),
    /campos requeridos/
  );
});
