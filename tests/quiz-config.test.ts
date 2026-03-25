import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { QUESTIONS_PER_QUIZ } from "../lib/config";

test("quiz session length is fixed at 10 questions", () => {
  assert.equal(QUESTIONS_PER_QUIZ, 10);
});

test("home deck tiles show question and deck card labels", () => {
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /\{QUESTIONS_PER_QUIZ\} questions/);
  assert.match(source, /\{deck.cardCount\} cards/);
});

test("home deck tiles include expected emoji markers", () => {
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /terms: "📘"/);
  assert.match(source, /kimarite: "💪"/);
  assert.match(source, /rikishi: "🥋"/);
});
