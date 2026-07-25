import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildRikishiBonuses, findKimariteForSignatureManeuver, normalizeKimariteLabel } from "../lib/data";

const kimarite = [
  { term: "Yorikiri", definition: "Force out.", japanese: "寄り切り" },
  { term: "Oshidashi", definition: "Push out.", japanese: "押し出し" },
  { term: "Tsukidashi", definition: "Thrust out.", japanese: "突き出し" },
  { term: "Uwatenage", definition: "Overarm throw.", japanese: "上手投げ" }
];

test("normalizeKimariteLabel ignores casing, spaces, punctuation, and hyphenation", () => {
  assert.equal(normalizeKimariteLabel("Migi-yotsu"), "migiyotsu");
  assert.equal(normalizeKimariteLabel("Tsuki dashi"), "tsukidashi");
});

test("findKimariteForSignatureManeuver matches official shorthand through guarded aliases", () => {
  const match = findKimariteForSignatureManeuver("migi-yotsu, oshi, yori", kimarite);
  assert.equal(match?.term, "Oshidashi");
});

test("buildRikishiBonuses builds rank first and signature maneuver second", () => {
  const bonuses = buildRikishiBonuses({ currentRank: "Ozeki West", signatureManeuver: "tsuki, oshi" }, kimarite);

  assert.equal(bonuses.length, 2);
  assert.equal(bonuses[0].id, "rank-family");
  assert.equal(bonuses[0].answer, "Ozeki");
  assert.equal(bonuses[1].id, "signature-maneuver");
  assert.equal(bonuses[1].answer, "Tsukidashi");
  assert.ok(bonuses[1].choices.includes("Tsukidashi"));
  assert.equal(bonuses[1].detail?.japanese, "突き出し");
  assert.equal(bonuses[1].detail?.summary, "Thrust out.");
});

test("buildRikishiBonuses skips unusable signature maneuver values without empty prompts", () => {
  const bonuses = buildRikishiBonuses({ currentRank: "Maegashira 5", signatureManeuver: "migi-yotsu, nage" }, kimarite);

  assert.equal(bonuses.length, 1);
  assert.equal(bonuses[0].id, "rank-family");
});

test("deck page source keeps independent ordered bonus progression", () => {
  const source = readFileSync(new URL("../app/deck/[slug]/page.tsx", import.meta.url), "utf8");

  assert.match(source, /setBonusIndex\(\(value\) => value \+ 1\)/);
  assert.ok(source.includes(":bonus:${currentBonus.id}"));
  assert.match(source, /result\.detail\.summary/);
});
