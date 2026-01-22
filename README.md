# @phun-ky/defaults-deep

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg)](http://makeapullrequest.com) [![SemVer 2.0](https://img.shields.io/badge/SemVer-2.0-green.svg)](http://semver.org/spec/v2.0.0.html) ![npm version](https://img.shields.io/npm/v/@phun-ky/defaults-deep) ![issues](https://img.shields.io/github/issues/phun-ky/defaults-deep) ![license](https://img.shields.io/npm/l/@phun-ky/defaults-deep) ![size](https://img.shields.io/bundlephobia/min/@phun-ky/defaults-deep) ![npm](https://img.shields.io/npm/dm/%40phun-ky/defaults-deep) ![GitHub Repo stars](https://img.shields.io/github/stars/phun-ky/defaults-deep) [![codecov](https://codecov.io/gh/phun-ky/defaults-deep/graph/badge.svg?token=VA91DL7ZLZ)](https://codecov.io/gh/phun-ky/defaults-deep) [![build](https://github.com/phun-ky/defaults-deep/actions/workflows/check.yml/badge.svg)](https://github.com/phun-ky/defaults-deep/actions/workflows/check.yml)

## About

Similar to lodash's defaultsDeep, but without mutating the source object, and no merging of arrays, and no lodash as dependency!

## Table of Contents<!-- omit from toc -->- [defaults-deep](#defaults-deep)

- [@phun-ky/defaults-deep](#phun-kydefaults-deep)
  - [About](#about)
  - [Table of Contents- defaults-deep](#table-of-contents--defaults-deep)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Parameters](#parameters)
    - [Returns](#returns)
    - [Examples](#examples)
  - [Differences from lodash (`_.defaultsDeep` / `_.mergeWith` pattern)](#differences-from-lodash-_defaultsdeep--_mergewith-pattern)
  - [Notice](#notice)
  - [Contributing](#contributing)
  - [License](#license)
  - [Changelog](#changelog)
  - [Sponsor me](#sponsor-me)

## Installation

Install the package via `npm`:

```
npm i --save @phun-ky/defaults-deep
```

## Usage

```ts
function defaultsDeep(...args): Record<PropertyKey, unknown>;
```

Deeply applies "defaults" from right-to-left sources into a new object, while preserving arrays.

This function mimics the common lodash pattern:
`_.toArray(arguments).reverse().forEach(x => _.mergeWith(output, x, customizer))`,
but implemented in vanilla TypeScript with a small, predictable merge core.

**Key behaviours**

- **Returns a new object** (the returned object is created inside the function).
- Sources are processed **right-to-left** (`reverse()`), meaning **earlier arguments win**:
  values from the first argument are treated as "defaults" that should _not_ be overwritten
  by later arguments (because later arguments are merged first).
- Only **object-like** sources participate in merging. Non-objects are skipped via `isObjectLoose`.
- Uses [mergeWith](utils/merge-with.md#mergewith) for the deep merge logic.
- **Arrays are preserved by replacement**: if a source value is an array, it replaces the
  destination value at that key (rather than being merged element-by-element).

### Parameters

| Parameter | Type         | Description                                                               |
| --------- | ------------ | ------------------------------------------------------------------------- |
| ...`args` | `unknown`\[] | A list of potential default/source values. Non-object values are ignored. |

### Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`PropertyKey`, `unknown`>

A new object containing the merged result.

### Examples

```ts
defaultsDeep(
  { a: 1, nested: { x: 1 }, list: [1] },
  { a: 2, nested: { y: 2 }, list: [2] }
);
// => { a: 1, nested: { x: 1, y: 2 }, list: [1] }
// (earlier args win; arrays preserved by replacement)
```

```ts
defaultsDeep({ opts: { retry: 3 } }, null, { opts: { timeout: 1000 } });
// => { opts: { retry: 3, timeout: 1000 } }
// (non-object sources are ignored)
```

## Differences from lodash (`_.defaultsDeep` / `_.mergeWith` pattern)

This package is inspired by lodash's common `_.defaultsDeep` approach (often implemented as `_.toArray(arguments).reverse()` + `_.mergeWith(...)`), but it is **not a drop-in, byte-for-byte compatible clone**. The goal here is to cover the common "configuration defaults" use case with a much smaller, dependency-free implementation. For typical plain objects (JSON-like data) and arrays, the results should match what you expect from the lodash approach.

The biggest difference is the underlying merge engine. Lodash's `mergeWith` is a mature, highly general deep-merge with lots of special-case behaviour for many JavaScript value types and edge cases. This implementation intentionally keeps the default rules conservative: it only deep-merges **plain objects** and treats most other things as **replace-by-assignment**. That means values like arrays, dates, maps/sets, functions, class instances, and other non-plain objects are not recursively merged unless you explicitly handle them via a customizer.

Array behaviour is also deliberately simpler and more explicit. Lodash's merge behaviour around arrays can be nuanced depending on the function and scenario; in this implementation, arrays are **preserved by replacement** (the source array overwrites the destination array) rather than being merged element-by-element. This matches the "array preservation" intent for defaults/config objects, but if you expect lodash-style index-wise array merging or concatenation in some cases, you'll need to provide your own customizer.

Another difference is how non-object inputs are treated. Lodash tends to be extremely permissive about odd inputs and will try hard to produce "something reasonable" even when sources are primitives or exotic objects. This implementation focuses on predictable behaviour for configuration merging: non-object sources are typically ignored (or treated as simple replacements at a property level), and only "object-like" values participate meaningfully in deep merging. If you pass primitives/functions as top-level sources, don't expect identical behaviour to lodash across all cases.

Finally, because this package is written in TypeScript with a strict API surface, you may notice differences at compile time even when runtime behaviour is similar. The functions lean on explicit type guards and object-shape constraints rather than lodash's "accept almost anything" philosophy. The payoff is a smaller dependency footprint and clearer semantics for the common defaults use case, at the cost of not matching lodash's full breadth of type handling and edge-case compatibility.

## Notice

This project is a fork of <https://github.com/nodeutils/defaults-deep>. Original work © 2016 Drew Llewellyn, licensed ISC (see LICENSE-ISC). Modifications © 2026 Alexander Vassbotn Røyne-Helgesen, licensed MIT (see LICENSE-MIT).

## Contributing

Want to contribute? Please read the [CONTRIBUTING.md](https://github.com/phun-ky/defaults-deep/blob/main/CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](https://github.com/phun-ky/defaults-deep/blob/main/CODE_OF_CONDUCT.md)

## License

This project is maintained by [Alexander Vassbotn Røyne-Helgesen](http://phun-ky.net) and is based on original work by Drew Llewellyn (<drew@drew.pro>, <https://drew.pro>). The original upstream code is licensed under the **ISC License**, and the modifications/changes in this fork are licensed under the **MIT License**.

## Changelog

See the [CHANGELOG.md](https://github.com/phun-ky/defaults-deep/blob/main/CHANGELOG.md) for details on the latest updates.

## Sponsor me

I'm an Open Source evangelist, creating stuff that does not exist yet to help get rid of secondary activities and to enhance systems already in place, be it documentation or web sites.

The sponsorship is an unique opportunity to alleviate more hours for me to maintain my projects, create new ones and contribute to the large community we're all part of :)

[Support me on GitHub Sponsors](https://github.com/sponsors/phun-ky).

p.s. **Ukraine is still under brutal Russian invasion. A lot of Ukrainian people are hurt, without shelter and need help**. You can help in various ways, for instance, directly helping refugees, spreading awareness, putting pressure on your local government or companies. You can also support Ukraine by donating e.g. to [Red Cross](https://www.icrc.org/en/donate/ukraine), [Ukraine humanitarian organisation](https://savelife.in.ua/en/donate-en/#donate-army-card-weekly) or [donate Ambulances for Ukraine](https://www.gofundme.com/f/help-to-save-the-lives-of-civilians-in-a-war-zone).
