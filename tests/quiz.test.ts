import test from "node:test";
import assert from "node:assert/strict";
import { buildRankChoices, masteryScore, rankFamily, selectNextCard } from "../lib/quiz";

test("rankFamily normalizes rank names", () => {
  assert.equal(rankFamily("Yokozuna East"), "Yokozuna");
  assert.equal(rankFamily("Ozeki 1e"), "Ozeki");
  assert.equal(rankFamily("Sekiwake West"), "Sekiwake");
  assert.equal(rankFamily("Komusubi East"), "Komusubi");
  assert.equal(rankFamily("Maegashira 5"), "Maegashira");
});

test("buildRankChoices returns 4 unique choices containing the correct family", () => {
  const choices = buildRankChoices("Ozeki West");
  assert.equal(choices.length, 4);
  assert.equal(new Set(choices).size, 4);
  assert.ok(choices.includes("Ozeki"));
});

test("masteryScore increases with better accuracy and streak", () => {
  const low = masteryScore(1, 5, 0);
  const high = masteryScore(5, 1, 3);
  assert.ok(high > low);
});

test("selectNextCard avoids excluded ids when possible", () => {
  const cards = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const selected = selectNextCard(cards, ["a", "b"]);
  assert.equal(selected?.id, "c");
});

test("selectNextCard falls back to full deck when all cards are excluded", () => {
  const cards = [{ id: "a" }];
  const selected = selectNextCard(cards, ["a"]);
  assert.equal(selected?.id, "a");
});
