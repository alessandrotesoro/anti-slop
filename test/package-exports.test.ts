import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { deepStrictEqual, match, ok, strictEqual } from "node:assert/strict";

import antiSlopPlugin from "@sematico/anti-slop";
import antiSlopEffectPlugin from "@sematico/anti-slop/effect";

const GENERIC_RULE_IDS = [
  "no-chained-type-assertions",
  "no-conditional-empty-object-spread",
  "no-known-value-widening",
  "no-module-mocking",
  "no-object-parameters",
  "no-reflect-apply",
  "no-reflect-get",
  "no-runtime-typeof",
  "no-shape-in-symbol-names",
  "no-unknown-parameters",
  "no-unknown-returns",
  "no-unknown-type-aliases",
  "no-unsafe-dictionary-type",
  "no-widen-then-assert",
  "require-safety-comment-for-type-assertion",
].toSorted();

const EFFECT_RULE_IDS = ["no-service-constructor-imports"];

test("exports the complete generic plugin inventory", () => {
  strictEqual(antiSlopPlugin.meta?.name, "anti-slop");
  deepStrictEqual(Object.keys(antiSlopPlugin.rules ?? {}).toSorted(), GENERIC_RULE_IDS);
  ok(!Object.hasOwn(antiSlopPlugin.rules ?? {}, "no-service-constructor-imports"));
});

test("exports Effect rules through a separate opt-in plugin", () => {
  strictEqual(antiSlopEffectPlugin.meta?.name, "anti-slop-effect");
  deepStrictEqual(Object.keys(antiSlopEffectPlugin.rules ?? {}), EFFECT_RULE_IDS);
});

test("advertises only the ESM root and Effect package exports", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    type: string;
    engines: { node: string };
    exports: Record<string, Record<string, string>>;
  };

  deepStrictEqual(Object.keys(packageJson.exports).toSorted(), [".", "./effect"]);
  for (const exportDefinition of Object.values(packageJson.exports)) {
    match(exportDefinition.types, /^\.\/dist\/.+\.d\.ts$/);
    match(exportDefinition.import, /^\.\/dist\/.+\.js$/);
    strictEqual(exportDefinition.require, undefined);
  }
  strictEqual(packageJson.type, "module");
  strictEqual(packageJson.engines.node, ">=22");
});

test("builds JavaScript entrypoints rather than exposing TypeScript source", async () => {
  const [rootEntry, effectEntry] = await Promise.all([
    readFile(new URL("../dist/index.js", import.meta.url), "utf8"),
    readFile(new URL("../dist/effect.js", import.meta.url), "utf8"),
  ]);

  ok(!rootEntry.includes('.ts"') && !rootEntry.includes(".ts'"));
  ok(!effectEntry.includes('.ts"') && !effectEntry.includes(".ts'"));
});
