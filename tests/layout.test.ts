import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("root header uses white background instead of gradient", () => {
  assert.match(layout, /bg-white/);
  assert.doesNotMatch(layout, /bg-gradient-to-r/);
});
