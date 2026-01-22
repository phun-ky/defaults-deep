import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { mergeWith, MergeWithCustomizer } from '../merge-with';
import { isObjectLoose } from '@phun-ky/typeof';

describe('mergeWith', () => {
  test('mergeWith: mutates and returns the same object reference', () => {
    const target = { a: 1 };
    const out = mergeWith(target, { b: 2 });

    assert.equal(out, target);
    assert.deepEqual(target, { a: 1, b: 2 });
  });

  test('mergeWith: merges plain objects recursively', () => {
    const target = { a: { x: 1 }, b: 1 };
    const source = { a: { y: 2 }, b: 2 };

    mergeWith(target, source);

    assert.deepEqual(target, { a: { x: 1, y: 2 }, b: 2 });
  });

  test('mergeWith: when src value is plain object and target is not, create {} and merge into it', () => {
    const target: any = { a: 123 };
    const source = { a: { x: 1 } };

    mergeWith(target, source);

    assert.deepEqual(target, { a: { x: 1 } });
    assert.equal(typeof target.a, 'object');
  });

  test('mergeWith: arrays replace by default (same reference)', () => {
    const target = { list: [1] };
    const source = { list: [2] };

    mergeWith(target, source);

    assert.deepEqual(target, { list: [2] });
    assert.equal(target.list, source.list); // replacement assigns the source array reference
  });

  test('mergeWith: array replacement is not a clone (mutations reflect)', () => {
    const target = { list: [1] };
    const source = { list: [2] };

    mergeWith(target, source);

    source.list.push(3);
    assert.deepEqual(target.list, [2, 3]); // same reference
  });

  test('mergeWith: customizer can override array behavior (concat)', () => {
    const concatArrays: MergeWithCustomizer = (objValue, srcValue) => {
      if (Array.isArray(objValue) && Array.isArray(srcValue)) {
        return objValue.concat(srcValue);
      }
      return undefined;
    };

    const target = { a: [1], b: [2] };
    const source = { a: [3], b: [4] };

    mergeWith(target, source, concatArrays);

    assert.deepEqual(target, { a: [1, 3], b: [2, 4] });
  });

  test("mergeWith: customizer return value is assigned even if it's null/false/0/''", () => {
    const customizer: MergeWithCustomizer = (_obj, _src, key) => {
      if (key === 'a') return null;
      if (key === 'b') return false;
      if (key === 'c') return 0;
      if (key === 'd') return '';
      return undefined;
    };

    const target: any = { a: 1, b: 2, c: 3, d: 4 };
    const source: any = { a: 10, b: 20, c: 30, d: 40 };

    mergeWith(target, source, customizer);

    assert.deepEqual(target, { a: null, b: false, c: 0, d: '' });
  });

  test('mergeWith: customizer is called with expected arguments', () => {
    const calls: Array<{
      objValue: unknown;
      srcValue: unknown;
      key: string | symbol;
      object: Record<PropertyKey, unknown>;
      source: Record<PropertyKey, unknown>;
      stack: WeakMap<object, object>;
    }> = [];

    const customizer: MergeWithCustomizer = (
      objValue,
      srcValue,
      key,
      object,
      source,
      stack
    ) => {
      calls.push({ objValue, srcValue, key, object, source, stack });
      return undefined;
    };

    const target = { a: 1 };
    const source = { a: 2 };

    mergeWith(target, source, customizer);

    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.objValue, 1);
    assert.equal(calls[0]!.srcValue, 2);
    assert.equal(calls[0]!.key, 'a');
    assert.equal(calls[0]!.object, target);
    assert.equal(calls[0]!.source, source);
    assert.ok(calls[0]!.stack instanceof WeakMap);
  });

  test('mergeWith: merges multiple sources left-to-right (later sources win)', () => {
    const target = { a: 1, nested: { x: 1 } };

    mergeWith(target, { a: 2, nested: { y: 2 } }, { a: 3, nested: { z: 3 } });

    assert.deepEqual(target, { a: 3, nested: { x: 1, y: 2, z: 3 } });
  });

  test('mergeWith: merges enumerable symbol keys', () => {
    const sym = Symbol('k');
    const target: any = {};
    const source: any = { [sym]: 123 };

    mergeWith(target, source);

    assert.equal(target[sym], 123);
  });

  test('mergeWith: does not merge non-enumerable properties', () => {
    const target: any = {};
    const source: any = {};

    Object.defineProperty(source, 'hidden', {
      value: 42,
      enumerable: false
    });

    mergeWith(target, source);

    assert.equal(target.hidden, undefined);
  });

  test('mergeWith: assigns non-plain objects by replacement (class instances)', () => {
    class Box {
      constructor(public value: number) {}
    }

    const target: any = { box: { value: 1 } };
    const source: any = { box: new Box(2) };

    mergeWith(target, source);

    assert.ok(target.box instanceof Box);
    assert.equal(target.box.value, 2);
  });

  test('mergeWith: circular references in source do not cause infinite recursion', () => {
    const target: any = {};
    const source: any = { a: {} };
    source.a.self = source; // circular-ish reference

    mergeWith(target, source);

    // We don't assert deep equality into the circular structure,
    // just that the merge completed and created expected top-level key.
    assert.ok('a' in target);
    assert.ok(isObjectLoose(target.a));
  });

  test('mergeWith: repeated source object reuses the same merged reference', () => {
    const shared: any = { deep: { x: 1 } };
    const source: any = { a: shared, b: shared };

    const target: any = {};
    mergeWith(target, source);

    assert.deepEqual(target.a, { deep: { x: 1 } });
    assert.equal(target.a, target.b); // same merged object reference (graph preserved)
  });
});
