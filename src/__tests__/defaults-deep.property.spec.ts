import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import fc from 'fast-check';

import defaultsDeep from '../main';

// Keys mergeWith skips on purpose, to prevent prototype pollution
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const safeKey = fc.string().filter((key) => !UNSAFE_KEYS.has(key));
const primitive = fc.oneof(
  fc.integer(),
  fc.string(),
  fc.boolean(),
  fc.constant(null)
);
const flatObject = fc.dictionary(safeKey, primitive);

describe('defaultsDeep properties', () => {
  test('that earlier arguments win for every key', () => {
    fc.assert(
      fc.property(flatObject, flatObject, flatObject, (a, b, c) => {
        const out = defaultsDeep(a, b, c);

        for (const key of new Set([
          ...Object.keys(a),
          ...Object.keys(b),
          ...Object.keys(c)
        ])) {
          const winner = [a, b, c].find((source) => Object.hasOwn(source, key));

          assert.equal(out[key], winner?.[key]);
        }

        assert.equal(
          Object.keys(out).length,
          new Set([...Object.keys(a), ...Object.keys(b), ...Object.keys(c)])
            .size
        );
      })
    );
  });

  test('that it never mutates its arguments', () => {
    fc.assert(
      fc.property(fc.array(fc.object(), { maxLength: 4 }), (sources) => {
        const before = structuredClone(sources);
        const out = defaultsDeep(...sources);

        assert.deepEqual(sources, before);

        for (const source of sources) assert.notEqual(out, source);
      })
    );
  });

  test('that arrays are replaced by reference, never merged', () => {
    fc.assert(
      fc.property(
        safeKey,
        fc.array(primitive),
        fc.array(primitive),
        (key, first, second) => {
          const out = defaultsDeep({ [key]: first }, { [key]: second });

          assert.equal(out[key], first);
        }
      )
    );
  });

  test('that nested plain objects are merged with earlier arguments winning', () => {
    fc.assert(
      fc.property(safeKey, flatObject, flatObject, (key, first, second) => {
        const out = defaultsDeep({ [key]: first }, { [key]: second });

        assert.deepEqual(out[key], { ...second, ...first });
      })
    );
  });

  test('that no input pollutes Object.prototype', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNSAFE_KEYS),
        fc.dictionary(safeKey, primitive, { minKeys: 1 }),
        (key, payload) => {
          const source = JSON.parse(`{${JSON.stringify(key)}:${JSON.stringify(payload)}}`);

          // Object.prototype has its own valueOf, toString and so on, so
          // compare all of its properties before and after
          const before = Object.getOwnPropertyDescriptors(Object.prototype);

          defaultsDeep(source, { nested: source });

          assert.deepEqual(
            Object.getOwnPropertyDescriptors(Object.prototype),
            before
          );
        }
      )
    );
  });
});
