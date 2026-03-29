import test from "node:test";
import assert from "node:assert/strict";
import { calculateRank, RANKS, QUALIFYING_ACCURACY } from "../lib/rank";

test("starts at Jonokuchi with zero qualifying sessions", () => {
  const { rank } = calculateRank(0);
  assert.equal(rank.name, "Jonokuchi");
});

test("reaches Jonidan at threshold (2 qualifying sessions)", () => {
  const { rank } = calculateRank(2);
  assert.equal(rank.name, "Jonidan");
});

test("stays at Jonidan just below Sandanme threshold", () => {
  const { rank } = calculateRank(4);
  assert.equal(rank.name, "Jonidan");
});

test("reaches Yokozuna at threshold (100 qualifying sessions)", () => {
  const { rank } = calculateRank(100);
  assert.equal(rank.name, "Yokozuna");
});

test("stays at Yokozuna above threshold", () => {
  const { rank } = calculateRank(9999);
  assert.equal(rank.name, "Yokozuna");
});

test("toNext is null at Yokozuna", () => {
  const { toNext } = calculateRank(100);
  assert.equal(toNext, null);
});

test("toNext reflects distance to next rank", () => {
  // Jonidan threshold=2, Sandanme threshold=5 → at 3 sessions, toNext=2
  const { toNext } = calculateRank(3);
  assert.equal(toNext, 2);
});

test("progress resets at each rank boundary", () => {
  const { progress } = calculateRank(2);
  assert.equal(progress, 0);
});

test("RANKS are ordered by ascending threshold", () => {
  for (let i = 1; i < RANKS.length; i++) {
    assert.ok(RANKS[i]!.threshold > RANKS[i - 1]!.threshold);
  }
});

test("QUALIFYING_ACCURACY is 0.7", () => {
  assert.equal(QUALIFYING_ACCURACY, 0.7);
});
