import test from "node:test";
import assert from "node:assert/strict";
import { buildRankChoices, celebrationTier, masteryScore, rankFamily, selectNextCard } from "../lib/quiz";

test("rankFamily normalizes rank names", () => {
  assert.equal(rankFamily("Yokozuna East"), "Yokozuna");
  assert.equal(rankFamily("Ozeki 1e"), "Ozeki");
  assert.equal(rankFamily("Sekiwake West"), "Sekiwake");
  assert.equal(rankFamily("Komusubi East"), "Komusubi");
  assert.equal(rankFamily("Maegashira 5"), "Maegashira");
});

test("buildRankChoices returns all unique families ordered highest to lowest", () => {
  const choices = buildRankChoices("Ozeki West");
  assert.equal(choices.length, 5);
  assert.equal(new Set(choices).size, 5);
  assert.ok(choices.includes("Ozeki"));
  assert.deepEqual(choices, ["Yokozuna", "Ozeki", "Sekiwake", "Komusubi", "Maegashira"]);
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

test("celebrationTier returns null below threshold", () => {
  assert.equal(celebrationTier(9, "terms"), null);
  assert.equal(celebrationTier(9, "kimarite"), null);
  assert.equal(celebrationTier(9, "rikishi"), null);
  assert.equal(celebrationTier(0, "rikishi"), null);
});

test("celebrationTier returns kachi at score 10 on all decks", () => {
  assert.equal(celebrationTier(10, "terms"), "kachi");
  assert.equal(celebrationTier(10, "kimarite"), "kachi");
  assert.equal(celebrationTier(10, "rikishi"), "kachi");
});

test("celebrationTier returns kachi for rikishi scores 11–19", () => {
  assert.equal(celebrationTier(11, "rikishi"), "kachi");
  assert.equal(celebrationTier(15, "rikishi"), "kachi");
  assert.equal(celebrationTier(19, "rikishi"), "kachi");
});

test("celebrationTier does not return kachi above 10 on non-rikishi decks", () => {
  assert.equal(celebrationTier(11, "terms"), null);
  assert.equal(celebrationTier(15, "kimarite"), null);
});

test("celebrationTier returns zensho only for rikishi at score 20", () => {
  assert.equal(celebrationTier(20, "rikishi"), "zensho");
  assert.equal(celebrationTier(20, "terms"), null);
  assert.equal(celebrationTier(20, "kimarite"), null);
});

test("selectNextCard falls back to full deck when all cards are excluded", () => {
  const cards = [{ id: "a" }];
  const selected = selectNextCard(cards, ["a"]);
  assert.equal(selected?.id, "a");
});
