[@phun-ky/defaults-deep](../README.md) / utils/merge-with

# utils/merge-with

> Last updated 2026-02-10T11:26:54.962Z

## Type Aliases

### MergeWithCustomizer()

```ts
type MergeWithCustomizer = (
  objValue,
  srcValue,
  key,
  object,
  source,
  stack
) => unknown;
```

Defined in: [utils/merge-with.ts:43](https://github.com/phun-ky/defaults-deep/blob/main/src/utils/merge-with.ts#L43)

Customizer function used by [mergeWith](#mergewith) to override merge behaviour.

If the customizer returns `undefined`, [mergeWith](#mergewith) falls back to its default
deep-merge rules. Any other return value will be assigned to the destination key.

#### Parameters

| Parameter  | Type                                                                                                                  | Description                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------- |
| `objValue` | `unknown`                                                                                                             | Current value on the destination (`object`) for `key`.                            |
| `srcValue` | `unknown`                                                                                                             | Incoming value from the current `source` for `key`.                               |
| `key`      | `string`                                                                                                              | `symbol`                                                                          | Property key being merged (string or symbol). |
| `object`   | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`PropertyKey`, `unknown`> | Destination object being mutated/merged into.                                     |
| `source`   | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`PropertyKey`, `unknown`> | Current source object being merged from.                                          |
| `stack`    | [`WeakMap`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)<`object`, `object`>   | A `WeakMap` used internally to prevent infinite recursion on circular references. |

#### Returns

`unknown`

The value to assign for this key, or `undefined` to use default merge behaviour.

#### Example

```ts
import { mergeWith, type MergeWithCustomizer } from './mergeWith';

const concatArrays: MergeWithCustomizer = (objValue, srcValue) => {
  if (Array.isArray(objValue) && Array.isArray(srcValue)) {
    return objValue.concat(srcValue);
  }
  return undefined;
};

const a = { list: [1] };
const b = { list: [2] };

mergeWith(a, b, concatArrays);
// => { list: [1, 2] }
```

## Functions

### mergeWith()

#### Call Signature

```ts
function mergeWith<T, S>(object, ...sources): MergeResult<T, S>;
```

Defined in: [utils/merge-with.ts:119](https://github.com/phun-ky/defaults-deep/blob/main/src/utils/merge-with.ts#L119)

Deep-merges one or more source objects into a destination object, with optional customization.

This is a "vanilla TS" alternative to lodash's `mergeWith` with a deliberately conservative
default strategy:

- **Mutates** and returns the destination `object`.
- Enumerates **own enumerable string keys** and **own enumerable symbol keys** from each source.
- When both destination and source values are **plain objects**, merges recursively.
- When the source value is a **plain object** but the destination is not, creates `{}` and merges into it.
- All other value types (arrays, dates, maps, sets, functions, primitives, class instances, etc.)
  are assigned by **replacement** unless the customizer handles them.
- Circular references in **sources** are prevented from causing infinite recursion via a `WeakMap` stack.

##### Type Parameters

| Type Parameter                                                                                                                              | Description                         |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `T` _extends_ [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`PropertyKey`, `any`>             | Destination object type.            |
| `S` _extends_ readonly [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`PropertyKey`, `any`>\[] | Tuple/array of source object types. |

##### Parameters

| Parameter    | Type | Description                                         |
| ------------ | ---- | --------------------------------------------------- |
| `object`     | `T`  | Destination object to merge into (will be mutated). |
| ...`sources` | `S`  | -                                                   |

##### Returns

`MergeResult`<`T`, `S`>

The same `object` reference, now merged with all sources.

##### Remarks

- The default merge behaviour only recurses into "plain objects", as determined by `isObjectPlain`.
- "Loose objects" are guarded using `isObjectLoose` to avoid attempting to merge non-object sources.
- If you want lodash-like array merging semantics (concat or index-wise), implement it via `customizer`.

##### Examples

```ts
const target = { a: { x: 1 }, b: 1 };
const source = { a: { y: 2 }, b: 2 };

mergeWith(target, source);
// => { a: { x: 1, y: 2 }, b: 2 }
// target is mutated
```

```ts
const target = { list: [1] };
const source = { list: [2] };

mergeWith(target, source);
// => { list: [2] }  (arrays replace by default)
```

```ts
const concatArrays: MergeWithCustomizer = (objValue, srcValue) => {
  if (Array.isArray(objValue) && Array.isArray(srcValue)) {
    return objValue.concat(srcValue);
  }
};

mergeWith({ list: [1] }, { list: [2] }, concatArrays);
// => { list: [1, 2] }
```

#### Call Signature

```ts
function mergeWith<T, S>(object, ...args): MergeResult<T, S>;
```

Defined in: [utils/merge-with.ts:124](https://github.com/phun-ky/defaults-deep/blob/main/src/utils/merge-with.ts#L124)

Deep-merges one or more source objects into a destination object, with optional customization.

This is a "vanilla TS" alternative to lodash's `mergeWith` with a deliberately conservative
default strategy:

- **Mutates** and returns the destination `object`.
- Enumerates **own enumerable string keys** and **own enumerable symbol keys** from each source.
- When both destination and source values are **plain objects**, merges recursively.
- When the source value is a **plain object** but the destination is not, creates `{}` and merges into it.
- All other value types (arrays, dates, maps, sets, functions, primitives, class instances, etc.)
  are assigned by **replacement** unless the customizer handles them.
- Circular references in **sources** are prevented from causing infinite recursion via a `WeakMap` stack.

##### Type Parameters

| Type Parameter                                                                                                                              | Description                         |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `T` _extends_ [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`PropertyKey`, `any`>             | Destination object type.            |
| `S` _extends_ readonly [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`PropertyKey`, `any`>\[] | Tuple/array of source object types. |

##### Parameters

| Parameter | Type                                                                | Description                                                                                       |
| --------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `object`  | `T`                                                                 | Destination object to merge into (will be mutated).                                               |
| ...`args` | \[`...sources: S[]`, [`MergeWithCustomizer`](#mergewithcustomizer)] | One or more source objects, optionally followed by a [MergeWithCustomizer](#mergewithcustomizer). |

##### Returns

`MergeResult`<`T`, `S`>

The same `object` reference, now merged with all sources.

##### Remarks

- The default merge behaviour only recurses into "plain objects", as determined by `isObjectPlain`.
- "Loose objects" are guarded using `isObjectLoose` to avoid attempting to merge non-object sources.
- If you want lodash-like array merging semantics (concat or index-wise), implement it via `customizer`.

##### Examples

```ts
const target = { a: { x: 1 }, b: 1 };
const source = { a: { y: 2 }, b: 2 };

mergeWith(target, source);
// => { a: { x: 1, y: 2 }, b: 2 }
// target is mutated
```

```ts
const target = { list: [1] };
const source = { list: [2] };

mergeWith(target, source);
// => { list: [2] }  (arrays replace by default)
```

```ts
const concatArrays: MergeWithCustomizer = (objValue, srcValue) => {
  if (Array.isArray(objValue) && Array.isArray(srcValue)) {
    return objValue.concat(srcValue);
  }
};

mergeWith({ list: [1] }, { list: [2] }, concatArrays);
// => { list: [1, 2] }
```

---

**Contributing**

Want to contribute? Please read the [CONTRIBUTING.md](https://github.com/phun-ky/defaults-deep/blob/main/CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](https://github.com/phun-ky/defaults-deep/blob/main/CODE_OF_CONDUCT.md)

**Sponsor me**

I'm an Open Source evangelist, creating stuff that does not exist yet to help get rid of secondary activities and to enhance systems already in place, be it documentation or web sites.

The sponsorship is an unique opportunity to alleviate more hours for me to maintain my projects, create new ones and contribute to the large community we're all part of :)

[Support me on GitHub Sponsors](https://github.com/sponsors/phun-ky).

---

This project is maintained by [Alexander Vassbotn Røyne-Helgesen](http://phun-ky.net) and is based on original work by Drew Llewellyn (<drew@drew.pro>, https://drew.pro). The original upstream code is licensed under the **ISC License**, and the modifications/changes in this fork are licensed under the **MIT License**.
