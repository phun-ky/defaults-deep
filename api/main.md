[@phun-ky/defaults-deep](README.md) / main

# main

> Last updated 2026-01-22T10:09:06.210Z

## Functions

### defaultsDeep()

```ts
function defaultsDeep(...args): Record<PropertyKey, unknown>;
```

Defined in: [main.ts:57](https://github.com/phun-ky/defaults-deep/blob/main/src/main.ts#L57)

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

#### Parameters

| Parameter | Type         | Description                                                               |
| --------- | ------------ | ------------------------------------------------------------------------- |
| ...`args` | `unknown`\[] | A list of potential default/source values. Non-object values are ignored. |

#### Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`PropertyKey`, `unknown`>

A new object containing the merged result.

#### Examples

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

#### Remarks

- The customizer only checks the _source_ value for arrays. If `s` is an array, it is returned
  and assigned as-is. Otherwise returning `undefined` delegates merging to [mergeWith](utils/merge-with.md#mergewith)'s
  default behaviour (which deep-merges plain objects and replaces other value types).
- The output type is `Record<PropertyKey, unknown>` to keep the API broadly usable without
  over-promising specific shapes.

---

**Contributing**

Want to contribute? Please read the [CONTRIBUTING.md](https://github.com/phun-ky/defaults-deep/blob/main/CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](https://github.com/phun-ky/defaults-deep/blob/main/CODE_OF_CONDUCT.md)

**Sponsor me**

I'm an Open Source evangelist, creating stuff that does not exist yet to help get rid of secondary activities and to enhance systems already in place, be it documentation or web sites.

The sponsorship is an unique opportunity to alleviate more hours for me to maintain my projects, create new ones and contribute to the large community we're all part of :)

[Support me on GitHub Sponsors](https://github.com/sponsors/phun-ky).

---

This project is maintained by [Alexander Vassbotn Røyne-Helgesen](http://phun-ky.net) and is based on original work by Drew Llewellyn (<drew@drew.pro>, https://drew.pro). The original upstream code is licensed under the **ISC License**, and the modifications/changes in this fork are licensed under the **MIT License**.
