<div align="center">
  <h1>@sematico/anti-slop</h1>
  <p>Opinionated Oxlint rules for TypeScript and JavaScript codebases.</p>

  <p>
    <a href="https://www.npmjs.com/package/@sematico/anti-slop"><img src="https://img.shields.io/npm/v/%40sematico%2Fanti-slop?style=flat-square&logo=npm&label=npm" alt="npm version"></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D22-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js >=22"></a>
    <a href="https://oxc.rs/docs/guide/usage/linter/js-plugins"><img src="https://img.shields.io/badge/oxlint-1.78.0-5e6ad2?style=flat-square" alt="Oxlint 1.78.0"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT license"></a>
  </p>
</div>

`@sematico/anti-slop` packages a focused set of Oxlint JavaScript-plugin rules
that reject low-evidence, low-signal patterns: hidden type widening, unparsed
boundaries, unsafe escape hatches, and architecture shortcuts.

> [!NOTE]
> Oxlint JavaScript plugins are currently alpha. This package is tested with
> Oxlint `1.78.0`, `@oxlint/plugins` `1.78.0`, and Node.js `22+`.

## Install

```sh
npm install --save-dev oxlint @sematico/anti-slop
```

The package is ESM-only and ships prebuilt JavaScript and TypeScript
declarations. It does not run install hooks, fetch source code, or edit your
Oxlint configuration.

## Configure

### Generic rules

Register the root plugin in your Oxlint configuration and enable the rules that
fit your codebase:

```json
{
  "jsPlugins": ["@sematico/anti-slop"],
  "rules": {
    "anti-slop/no-unknown-parameters": "error",
    "anti-slop/no-unknown-returns": "error",
    "anti-slop/require-safety-comment-for-type-assertion": "warn"
  }
}
```

### Effect rules

Effect policy is opt-in through a separate export. Register it only when your
project uses Effect services and Layers:

```json
{
  "jsPlugins": ["@sematico/anti-slop", "@sematico/anti-slop/effect"],
  "rules": {
    "anti-slop/no-unknown-parameters": "error",
    "anti-slop-effect/no-service-constructor-imports": "error"
  }
}
```

Registering the root package alone never enables the Effect rule.

## Rules

The root export contains 15 generic rules:

| Rule                                        | Purpose                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `no-chained-type-assertions`                | Reject chained `as` and angle-bracket assertions.                  |
| `no-conditional-empty-object-spread`        | Reject conditional spreads of an empty object to omit fields.      |
| `no-known-value-widening`                   | Keep known values from flowing into broad target types.            |
| `no-module-mocking`                         | Replace Jest and Vitest module mocks with real interfaces.         |
| `no-object-parameters`                      | Require named owner types instead of `object` parameters.          |
| `no-reflect-apply`                          | Replace `Reflect.apply` with typed calls or interfaces.            |
| `no-reflect-get`                            | Replace `Reflect.get` with typed property access.                  |
| `no-runtime-typeof`                         | Require boundary decoding instead of runtime `typeof` checks.      |
| `no-shape-in-symbol-names`                  | Keep the structural term `shape` out of symbol names.              |
| `no-unknown-parameters`                     | Decode `unknown` inputs at their I/O boundary.                     |
| `no-unknown-returns`                        | Keep `unknown` out of public return contracts.                     |
| `no-unknown-type-aliases`                   | Keep aliases from hiding `unknown`.                                |
| `no-unsafe-dictionary-type`                 | Require concrete value types for dictionaries.                     |
| `no-widen-then-assert`                      | Reject widening a value before asserting it back to a narrow type. |
| `require-safety-comment-for-type-assertion` | Require a nearby `SAFETY:` justification for type assertions.      |

The `@sematico/anti-slop/effect` export contains one additional opt-in rule:
`no-service-constructor-imports`, which keeps project-local Effect service
constructors out of runtime code.

## Development

```sh
git clone https://github.com/alessandrotesoro/anti-slop.git
cd anti-slop
npm ci
npm run verify
```

Useful checks:

- `npm run verify` runs formatting, linting, type checking, rule tests, the
  build, export checks, and an isolated packed-consumer test.
- `npm run test:packed` installs the generated tarball into a fresh npm
  consumer and verifies both plugin entry points with Oxlint.
- `npm run build` emits the root and Effect ESM entry points in `dist/`.

The vendored source is pinned to an upstream commit. Review the upstream diff,
update [UPSTREAM.md](./UPSTREAM.md), and rerun `npm run verify` when refreshing
that snapshot.

## Credits

This package is a distribution of [Dillon Mulroy's `anti-slop` repository](https://github.com/dmmulroy/anti-slop),
vendored at commit [`6d538555cb151d4121ed51a27db81890eacf8ae9`](https://github.com/dmmulroy/anti-slop/tree/6d538555cb151d4121ed51a27db81890eacf8ae9).
The upstream MIT notice is preserved in [LICENSE](./LICENSE), and the snapshot
provenance is documented in [UPSTREAM.md](./UPSTREAM.md).
