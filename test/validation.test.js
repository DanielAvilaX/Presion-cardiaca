import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateRegistration,
  validateRecordPayload,
  validateMeasurement,
  getMeasurementWarning,
  MEASUREMENT_LIMITS
} from "../src/utils/validation.js";

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

function validRecord(overrides = {}) {
  return {
    recordDate: "2026-06-15",
    recordTime: "08:00",
    position: "Sentado",
    taSystolic: "120",
    taDiastolic: "80",
    heartRate: "70",
    ...overrides
  };
}

test("validateRegistration acepta datos validos", () => {
  assert.doesNotThrow(() => validateRegistration(validRegistration()));
});

test("validateRegistration exige todos los campos", () => {
  assert.throws(() => validateRegistration(validRegistration({ firstName: "" })), /obligatorios/);
});

test("validateRegistration rechaza un correo con formato invalido", () => {
  assert.throws(
    () => validateRegistration(validRegistration({ email: "ana-arroba-ejemplo", confirmEmail: "ana-arroba-ejemplo" })),
    /correo electrónico válido/
  );
});

test("validateRegistration verifica que los correos coincidan", () => {
  assert.throws(() => validateRegistration(validRegistration({ confirmEmail: "otro@ejemplo.com" })), /correos no coinciden/);
});

test("validateRegistration verifica que las contrasenas coincidan", () => {
  assert.throws(() => validateRegistration(validRegistration({ confirmPassword: "distinta" })), /contraseñas no coinciden/);
});

test("validateRegistration exige minimo 6 caracteres de contrasena", () => {
  assert.throws(() => validateRegistration(validRegistration({ password: "123", confirmPassword: "123" })), /al menos 6/);
});

test("validateRegistration valida el rango de edad", () => {
  assert.throws(() => validateRegistration(validRegistration({ age: "0" })), /edad debe estar entre/);
  assert.throws(() => validateRegistration(validRegistration({ age: "130" })), /edad debe estar entre/);
});

test("validateRecordPayload devuelve numeros con datos validos", () => {
  assert.deepEqual(validateRecordPayload(validRecord()), { systolic: 120, diastolic: 80, heartRate: 70 });
});

test("validateRecordPayload exige diastolica menor que sistolica", () => {
  assert.throws(() => validateRecordPayload(validRecord({ taDiastolic: "120" })), /mayor que la diastólica/);
});

test("validateRecordPayload exige campos obligatorios", () => {
  assert.throws(() => validateRecordPayload(validRecord({ recordDate: "", recordTime: "", position: "" })), /campos requeridos/);
});

test("validateRecordPayload rechaza valores fuera de los limites duros", () => {
  assert.throws(() => validateRecordPayload(validRecord({ taSystolic: "300" })), /sistólica debe estar entre/);
  assert.throws(() => validateRecordPayload(validRecord({ heartRate: "400" })), /cardíaca debe estar entre/);
});

test("validateRecordPayload rechaza valores no numericos", () => {
  assert.throws(() => validateRecordPayload(validRecord({ taSystolic: "" })), /valor válido/);
  assert.throws(() => validateRecordPayload(validRecord({ heartRate: "abc" })), /valor válido/);
});

// Regresion: la app limitaba diastolica y frecuencia a 120, asi que era
// imposible registrar una crisis hipertensiva o una taquicardia que la base
// de datos si acepta.
test("permite registrar una crisis hipertensiva por diastolica mayor a 120", () => {
  assert.deepEqual(
    validateRecordPayload(validRecord({ taSystolic: "190", taDiastolic: "125", heartRate: "95" })),
    { systolic: 190, diastolic: 125, heartRate: 95 }
  );
});

test("permite registrar una frecuencia cardiaca mayor a 120 lpm", () => {
  assert.equal(validateRecordPayload(validRecord({ heartRate: "150" })).heartRate, 150);
});

test("validateMeasurement acepta los extremos del rango", () => {
  assert.equal(validateMeasurement(MEASUREMENT_LIMITS.systolic, 60), 60);
  assert.equal(validateMeasurement(MEASUREMENT_LIMITS.systolic, 260), 260);
});

test("getMeasurementWarning avisa sin bloquear fuera del rango habitual", () => {
  assert.equal(getMeasurementWarning(MEASUREMENT_LIMITS.heartRate, 70), null);
  assert.match(getMeasurementWarning(MEASUREMENT_LIMITS.heartRate, 150), /inusualmente alto/);
  assert.match(getMeasurementWarning(MEASUREMENT_LIMITS.systolic, 70), /inusualmente bajo/);
});
