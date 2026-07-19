import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ActiveBashoBanner } from "../app/active-basho-banner";
import { OFFICIAL_HONBASHO_RESULTS_URL } from "../lib/honbasho";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("root header uses white background instead of gradient", () => {
  assert.match(layout, /bg-white/);
  assert.doesNotMatch(layout, /bg-gradient-to-r/);
});

test("active basho banner renders official results link", () => {
  const markup = renderToStaticMarkup(
    createElement(ActiveBashoBanner, { referenceDate: new Date("2026-07-18T03:00:00.000Z") })
  );

  assert.match(markup, /Nagoya basho live/);
  assert.match(markup, new RegExp(`href="${OFFICIAL_HONBASHO_RESULTS_URL}"`));
  assert.match(markup, /target="_blank"/);
  assert.match(markup, /rel="noopener noreferrer"/);
});

test("active basho banner uses inviting site palette without red emphasis", () => {
  const markup = renderToStaticMarkup(
    createElement(ActiveBashoBanner, { referenceDate: new Date("2026-07-18T03:00:00.000Z") })
  );

  assert.match(markup, /bg-pine\/10/);
  assert.match(markup, /hover:text-pine/);
  assert.doesNotMatch(markup, /clay/);
});

test("active basho banner does not render outside tournament dates", () => {
  const markup = renderToStaticMarkup(
    createElement(ActiveBashoBanner, { referenceDate: new Date("2026-02-01T03:00:00.000Z") })
  );

  assert.equal(markup, "");
});

test("root layout renders active basho banner before normal header", () => {
  assert.match(layout, /<ActiveBashoBanner \/>[\s\S]*<header/);
});
