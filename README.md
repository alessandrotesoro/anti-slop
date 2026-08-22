# @sematico/anti-slop

An npm distribution of [anti-slop](https://github.com/dmmulroy/anti-slop), a
small set of Oxlint JavaScript-plugin rules for rejecting low-evidence and
low-signal TypeScript and JavaScript patterns.

## Install

```sh
npm install --save-dev oxlint @sematico/anti-slop
```

This package supports Node.js 22 and newer. The plugin API is currently alpha,
so compatibility is described as tested support rather than a semver promise.
The published package is tested with Oxlint `1.78.0` and
`@oxlint/plugins` `1.78.0`.

## Configure the generic rules

Register the package specifier in your Oxlint configuration and enable the
rules you want:

```json
{
  "jsPlugins": ["@sematico/anti-slop"],
  "rules": {
    "anti-slop/no-unknown-parameters": "error",
    "anti-slop/no-unknown-returns": "error"
  }
}
```

The root export contains these 15 rules:

- `no-chained-type-assertions`
- `no-conditional-empty-object-spread`
- `no-known-value-widening`
- `no-module-mocking`
- `no-object-parameters`
- `no-reflect-apply`
- `no-reflect-get`
- `no-runtime-typeof`
- `no-shape-in-symbol-names`
- `no-unknown-parameters`
- `no-unknown-returns`
- `no-unknown-type-aliases`
- `no-unsafe-dictionary-type`
- `no-widen-then-assert`
- `require-safety-comment-for-type-assertion`

## Opt in to the Effect rule

The Effect policy is a separate export and is never enabled by registering the
root package:

```json
{
  "jsPlugins": ["@sematico/anti-slop", "@sematico/anti-slop/effect"],
  "rules": {
    "anti-slop/no-unknown-parameters": "error",
    "anti-slop-effect/no-service-constructor-imports": "error"
  }
}
```

`@sematico/anti-slop/effect` contains only
`no-service-constructor-imports`.

## Attribution and updates

This package preserves the upstream MIT notice in [LICENSE](./LICENSE). The
vendored commit and manual refresh procedure are recorded in
[UPSTREAM.md](./UPSTREAM.md). Rule behavior is intentionally kept aligned with
that snapshot; upstream refreshes should be reviewed rather than fetched at
install or lint time.
