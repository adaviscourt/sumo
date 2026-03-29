import test from "node:test";
import assert from "node:assert/strict";
import { calculateRank, RANKS } from "../lib/rank";

test("starts at Jonokuchi with zero correct answers", () => {
  const { rank } = calculateRank(0);
  assert.equal(rank.name, "Jonokuchi");
});

test("reaches Jonidan at threshold", () => {
  const { rank } = calculateRank(8);
  assert.equal(rank.name, "Jonidan");
});

test("stays at Jonidan just below Sandanme threshold", () => {
  const { rank } = calculateRank(19);
  assert.equal(rank.name, "Jonidan");
});

test("reaches Yokozuna at threshold", () => {
  const { rank } = calculateRank(650);
  assert.equal(rank.name, "Yokozuna");
});

test("stays at Yokozuna above threshold", () => {
  const { rank } = calculateRank(9999);
  assert.equal(rank.name, "Yokozuna");
});

test("toNext is null at Yokozuna", () => {
  const { toNext } = calculateRank(650);
  assert.equal(toNext, null);
});

test("toNext reflects distance to next rank", () => {
  // Jonidan threshold=8, Sandanme threshold=20 → toNext from score 10 = 10
  const { toNext } = calculateRank(10);
  assert.equal(toNext, 10);
});

test("progress resets at each rank boundary", () => {
  const { progress } = calculateRank(8);
  assert.equal(progress, 0);
});

test("RANKS are ordered by ascending threshold", () => {
  for (let i = 1; i < RANKS.length; i++) {
    assert.ok(RANKS[i]!.threshold > RANKS[i - 1]!.threshold);
  }
});
