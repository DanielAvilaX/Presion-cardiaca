import { test } from "node:test";
import assert from "node:assert/strict";
import { escHtml } from "../src/utils/html.js";

test("escapa caracteres HTML peligrosos", () => {
  assert.equal(escHtml('<script>alert("x")</script>'), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
});

test("escapa el ampersand", () => {
  assert.equal(escHtml("Tom & Jerry"), "Tom &amp; Jerry");
});

test("convierte valores nulos en cadena vacia", () => {
  assert.equal(escHtml(null), "");
  assert.equal(escHtml(undefined), "");
});

test("convierte numeros a cadena", () => {
  assert.equal(escHtml(120), "120");
});
