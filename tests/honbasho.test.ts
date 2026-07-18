import test from "node:test";
import assert from "node:assert/strict";
import {
  getActiveHonbasho,
  HONBASHO_SCHEDULE,
  isHonbashoActive,
  OFFICIAL_HONBASHO_RESULTS_URL,
  toJapanLocalDateKey
} from "../lib/honbasho";

test("honbasho schedule entries use official results URL", () => {
  assert.ok(HONBASHO_SCHEDULE.length >= 18);
  assert.ok(HONBASHO_SCHEDULE.every((basho) => basho.resultsUrl === OFFICIAL_HONBASHO_RESULTS_URL));
});

test("detects active basho using Japan-local dates", () => {
  const activeBasho = getActiveHonbasho(new Date("2026-07-18T03:00:00.000Z"));

  assert.equal(activeBasho?.id, "2026-nagoya");
  assert.equal(toJapanLocalDateKey(new Date("2026-07-18T03:00:00.000Z")), "2026-07-18");
  assert.equal(isHonbashoActive(new Date("2026-07-18T03:00:00.000Z")), true);
});

test("returns inactive outside honbasho dates", () => {
  assert.equal(getActiveHonbasho(new Date("2026-02-01T03:00:00.000Z")), null);
  assert.equal(isHonbashoActive(new Date("2026-02-01T03:00:00.000Z")), false);
});

test("includes first and final Japan-local tournament days", () => {
  assert.equal(getActiveHonbasho(new Date("2026-07-11T15:00:00.000Z"))?.id, "2026-nagoya");
  assert.equal(getActiveHonbasho(new Date("2026-07-26T14:59:59.000Z"))?.id, "2026-nagoya");
});

test("excludes moments outside Japan-local tournament boundaries", () => {
  assert.equal(getActiveHonbasho(new Date("2026-07-11T14:59:59.000Z")), null);
  assert.equal(getActiveHonbasho(new Date("2026-07-26T15:00:00.000Z")), null);
});
