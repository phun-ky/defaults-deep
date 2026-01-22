/* eslint-disable @typescript-eslint/no-explicit-any */
import { isObjectLoose } from '@phun-ky/typeof';

import { mergeWith } from './utils/merge-with';

/**
 * Deeply applies "defaults" from right-to-left sources into a new object, while preserving arrays.
 *
 * This function mimics the common lodash pattern:
 * `_.toArray(arguments).reverse().forEach(x => _.mergeWith(output, x, customizer))`,
 * but implemented in vanilla TypeScript with a small, predictable merge core.
 *
 * **Key behaviours**
 * - **Returns a new object** (the returned object is created inside the function).
 * - Sources are processed **right-to-left** (`reverse()`), meaning **earlier arguments win**:
 *   values from the first argument are treated as "defaults" that should *not* be overwritten
 *   by later arguments (because later arguments are merged first).
 * - Only **object-like** sources participate in merging. Non-objects are skipped via `isObjectLoose`.
 * - Uses {@link mergeWith} for the deep merge logic.
 * - **Arrays are preserved by replacement**: if a source value is an array, it replaces the
 *   destination value at that key (rather than being merged element-by-element).
 *
 * @param args - A list of potential default/source values. Non-object values are ignored.
 * @returns A new object containing the merged result.
 *
 *
 * @example
 * ```ts
 * defaultsDeep(
 *   { a: 1, nested: { x: 1 }, list: [1] },
 *   { a: 2, nested: { y: 2 }, list: [2] }
 * );
 * // => { a: 1, nested: { x: 1, y: 2 }, list: [1] }
 * // (earlier args win; arrays preserved by replacement)
 * ```
 *
 * @example
 * ```ts
 * defaultsDeep(
 *   { opts: { retry: 3 } },
 *   null,
 *   { opts: { timeout: 1000 } }
 * );
 * // => { opts: { retry: 3, timeout: 1000 } }
 * // (non-object sources are ignored)
 * ```
 *
 * @remarks
 *
 * - The customizer only checks the *source* value for arrays. If `s` is an array, it is returned
 *   and assigned as-is. Otherwise returning `undefined` delegates merging to {@link mergeWith}'s
 *   default behaviour (which deep-merges plain objects and replaces other value types).
 * - The output type is `Record<PropertyKey, unknown>` to keep the API broadly usable without
 *   over-promising specific shapes.
 *
 */
const defaultsDeep = (...args: unknown[]) => {
  const output: Record<PropertyKey, unknown> = {};

  for (const item of args.slice().reverse()) {
    if (!isObjectLoose(item)) continue;

    mergeWith(output, item, (_o: any, s: any[] | undefined) =>
      Array.isArray(s) ? s : undefined
    );
  }

  return output;
};

export default defaultsDeep;
