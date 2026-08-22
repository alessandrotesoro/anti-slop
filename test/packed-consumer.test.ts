import { execFileSync, spawnSync } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { deepStrictEqual, match, ok, strictEqual } from "node:assert/strict";

type PackedFile = { filename: string };
type PackageManifest = {
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function runOxlint(consumerRoot: string, configPath: string, sourcePath: string) {
  const result = spawnSync(
    join(consumerRoot, "node_modules/.bin/oxlint"),
    ["--config", configPath, sourcePath],
    {
      cwd: consumerRoot,
      encoding: "utf8",
    },
  );

  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

test("the packed package works from a fresh npm consumer", async () => {
  const consumerRoot = await mkdtemp(join(tmpdir(), "anti-slop-consumer-"));

  try {
    execFileSync("npm", ["run", "build"], { cwd: repoRoot, stdio: "ignore" });
    const packageManifest = JSON.parse(
      await readFile(join(repoRoot, "package.json"), "utf8"),
    ) as PackageManifest;
    const oxlintVersion = packageManifest.devDependencies?.oxlint;
    const typescriptVersion = packageManifest.devDependencies?.typescript;
    if (typeof oxlintVersion !== "string" || typeof typescriptVersion !== "string") {
      throw new Error("package.json must declare string devDependencies for oxlint and typescript");
    }

    const packed = JSON.parse(
      execFileSync(
        "npm",
        ["pack", "--json", "--ignore-scripts", "--pack-destination", consumerRoot],
        {
          cwd: repoRoot,
          encoding: "utf8",
        },
      ),
    ) as PackedFile[];
    strictEqual(packed.length, 1);
    const tarballPath = resolve(consumerRoot, packed[0].filename);

    await writeJson(join(consumerRoot, "package.json"), {
      name: "anti-slop-consumer",
      private: true,
      type: "module",
    });
    await Promise.all(
      ["generic-valid.ts", "generic-violation.ts", "effect-violation.ts"].map((fixture) =>
        copyFile(join(repoRoot, "test/fixtures", fixture), join(consumerRoot, fixture)),
      ),
    );
    await writeFile(
      join(consumerRoot, "issue-service.ts"),
      "export const makeIssueService = () => ({});\n",
    );
    await writeFile(
      join(consumerRoot, "consumer-types.ts"),
      [
        'import antiSlop from "@sematico/anti-slop";',
        'import antiSlopEffect from "@sematico/anti-slop/effect";',
        "antiSlop;",
        "antiSlopEffect;",
        "",
      ].join("\n"),
    );

    await execFileSync(
      "npm",
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--save-dev",
        `oxlint@${oxlintVersion}`,
        `typescript@${typescriptVersion}`,
        tarballPath,
      ],
      { cwd: consumerRoot, stdio: "ignore" },
    );

    execFileSync(
      join(consumerRoot, "node_modules/.bin/tsc"),
      [
        "--noEmit",
        "--module",
        "NodeNext",
        "--moduleResolution",
        "NodeNext",
        "--target",
        "ES2022",
        "consumer-types.ts",
      ],
      { cwd: consumerRoot, stdio: "ignore" },
    );

    const genericConfigPath = join(consumerRoot, "generic.json");
    const effectConfigPath = join(consumerRoot, "effect.json");
    await writeJson(genericConfigPath, {
      jsPlugins: ["@sematico/anti-slop"],
      rules: {
        "anti-slop/no-object-parameters": "error",
      },
    });
    await writeJson(effectConfigPath, {
      jsPlugins: ["@sematico/anti-slop/effect"],
      rules: {
        "anti-slop-effect/no-service-constructor-imports": "error",
      },
    });

    const genericValid = runOxlint(
      consumerRoot,
      genericConfigPath,
      join(consumerRoot, "generic-valid.ts"),
    );
    strictEqual(genericValid.status, 0);

    const genericLint = runOxlint(
      consumerRoot,
      genericConfigPath,
      join(consumerRoot, "generic-violation.ts"),
    );
    strictEqual(genericLint.status, 1);
    match(genericLint.output, /anti-slop(?:\/|\()no-object-parameters/u);

    const effectWithoutPlugin = runOxlint(
      consumerRoot,
      genericConfigPath,
      join(consumerRoot, "effect-violation.ts"),
    );
    strictEqual(effectWithoutPlugin.status, 0);
    ok(
      !/anti-slop-effect(?:\/|\()no-service-constructor-imports/u.test(effectWithoutPlugin.output),
    );

    const effectLint = runOxlint(
      consumerRoot,
      effectConfigPath,
      join(consumerRoot, "effect-violation.ts"),
    );
    strictEqual(effectLint.status, 1);
    match(effectLint.output, /anti-slop-effect(?:\/|\()no-service-constructor-imports/u);

    const installedManifest = JSON.parse(
      await readFile(join(consumerRoot, "node_modules/@sematico/anti-slop/package.json"), "utf8"),
    ) as PackageManifest;
    const lifecycleScripts = Object.keys(installedManifest.scripts ?? {}).filter((name) =>
      /^(?:pre|post)?install$/u.test(name),
    );
    deepStrictEqual(lifecycleScripts, []);

    const tarballEntries = execFileSync("tar", ["-tzf", tarballPath], {
      encoding: "utf8",
    }).split("\n");
    for (const expectedEntry of [
      "package/dist/index.js",
      "package/dist/effect.js",
      "package/dist/index.d.ts",
      "package/dist/effect.d.ts",
      "package/README.md",
      "package/LICENSE",
      "package/UPSTREAM.md",
      "package/package.json",
    ]) {
      ok(tarballEntries.includes(expectedEntry), `missing ${expectedEntry}`);
    }
    ok(!tarballEntries.some((entry) => entry.startsWith("package/src/")));
    ok(!tarballEntries.some((entry) => entry.startsWith("package/test/")));
    ok(!tarballEntries.some((entry) => entry.startsWith("package/node_modules/")));
  } finally {
    await rm(consumerRoot, { recursive: true, force: true });
  }
});
