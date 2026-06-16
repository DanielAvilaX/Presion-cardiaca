import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyBP, classifyRecord, getCategory, BP_CATEGORIES } from "../src/utils/bpClassification.js";

test("clasifica Normal por debajo de 120/80", () => {
  assert.equal(classifyBP(110, 70).key, "normal");
  assert.equal(classifyBP(119, 79).key, "normal");
});

test("clasifica Elevada entre 120-129 sistolica y diastolica < 80", () => {
  assert.equal(classifyBP(120, 79).key, "elevated");
  assert.equal(classifyBP(129, 70).key, "elevated");
});

test("clasifica Hipertension 1 por sistolica 130-139 o diastolica 80-89", () => {
  assert.equal(classifyBP(135, 75).key, "stage1");
  assert.equal(classifyBP(125, 82).key, "stage1"); // sube por diastolica
  assert.equal(classifyBP(130, 79).key, "stage1");
});

test("clasifica Hipertension 2 por sistolica >= 140 o diastolica >= 90", () => {
  assert.equal(classifyBP(140, 85).key, "stage2");
  assert.equal(classifyBP(125, 95).key, "stage2");
});

test("clasifica Crisis por sistolica > 180 o diastolica > 120", () => {
  assert.equal(classifyBP(185, 100).key, "crisis");
  assert.equal(classifyBP(160, 125).key, "crisis");
});

test("toma la categoria mas alta entre sistolica y diastolica", () => {
  assert.equal(classifyBP(118, 95).key, "stage2");
});

test("valores no numericos devuelven normal sin lanzar error", () => {
  assert.equal(classifyBP(undefined, null).key, "normal");
  assert.equal(classifyBP("abc", "xyz").key, "normal");
});

test("classifyRecord usa los campos del registro", () => {
  assert.equal(classifyRecord({ ta_systolic: 145, ta_diastolic: 92 }).key, "stage2");
});

test("getCategory devuelve la categoria por clave y normal por defecto", () => {
  assert.equal(getCategory("crisis").label, "Crisis");
  assert.equal(getCategory("inexistente").key, "normal");
});

test("cada categoria expone color, tinte y consejo", () => {
  for (const category of BP_CATEGORIES) {
    assert.ok(category.color, `${category.key} debe tener color`);
    assert.ok(category.tint, `${category.key} debe tener tinte`);
    assert.ok(category.advice, `${category.key} debe tener consejo`);
  }
});
