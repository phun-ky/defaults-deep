import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import defaultsDeep from '../main';

describe('defaults-deep', () => {
  test('defaultsDeep: returns a new object (does not return any input reference)', () => {
    const a = { a: 1 };
    const b = { b: 2 };

    const out = defaultsDeep(a, b);

    assert.notEqual(out, a);
    assert.notEqual(out, b);
    assert.deepEqual(out, { a: 1, b: 2 });
  });

  test('defaultsDeep: earlier arguments win (right-to-left processing)', () => {
    const out = defaultsDeep(
      { a: 1, nested: { x: 1 } },
      { a: 2, nested: { y: 2 } }
    );

    // a from first arg wins; nested merges
    assert.deepEqual(out, { a: 1, nested: { x: 1, y: 2 } });
  });

  test('defaultsDeep: deep merges plain objects across multiple sources', () => {
    const out = defaultsDeep({ a: { x: 1 } }, { a: { y: 2 } }, { a: { z: 3 } });

    assert.deepEqual(out, { a: { x: 1, y: 2, z: 3 } });
  });

  test('defaultsDeep: arrays are preserved by replacement (not deep-merged), and earlier args win', () => {
    const out = defaultsDeep(
      { list: [1] }, // should win
      { list: [2, 3] } // should NOT overwrite because it's applied first
    );

    assert.deepEqual(out, { list: [1] });
  });

  test('defaultsDeep: arrays at nested keys are also preserved by replacement', () => {
    const out = defaultsDeep(
      { nested: { list: [1] } },
      { nested: { list: [2, 3] } }
    );

    assert.deepEqual(out, { nested: { list: [1] } });
  });

  test('defaultsDeep: non-object-like sources are ignored', () => {
    const out = defaultsDeep(
      { a: 1, nested: { x: 1 } },
      null,
      undefined,
      123,
      'str',
      true,
      Symbol('x')
    );

    assert.deepEqual(out, { a: 1, nested: { x: 1 } });
  });

  test('defaultsDeep: symbol keys are merged (enumerable only)', () => {
    const sym = Symbol('k');

    const out = defaultsDeep({ [sym]: 1, a: 1 }, { [sym]: 2, b: 2 });

    // earlier args win for sym as well
    assert.equal(out[sym], 1);
    assert.deepEqual({ a: (out as any).a, b: (out as any).b }, { a: 1, b: 2 });
  });

  test('defaultsDeep: does not copy non-enumerable props from sources', () => {
    const src: any = { a: 1 };
    Object.defineProperty(src, 'hidden', { value: 42, enumerable: false });

    const out = defaultsDeep({}, src);

    assert.deepEqual(out, { a: 1 });
    assert.equal((out as any).hidden, undefined);
  });

  test('defaultsDeep: assigns non-plain objects by replacement (e.g. class instances), earlier args win', () => {
    class Box {
      constructor(public value: number) {}
    }

    const out = defaultsDeep(
      { box: new Box(1) }, // earlier wins
      { box: new Box(2) }
    );

    assert.ok((out as any).box instanceof Box);
    assert.equal((out as any).box.value, 1);
  });

  test('defaultsDeep: keeps merging even if some sources are empty objects', () => {
    const out = defaultsDeep({ a: 1 }, {}, { b: 2 });
    assert.deepEqual(out, { a: 1, b: 2 });
  });

  test('defaultsDeep: does not mutate input source objects', () => {
    const a = { nested: { x: 1 } };
    const b = { nested: { y: 2 } };

    const out = defaultsDeep(a, b);

    assert.deepEqual(a, { nested: { x: 1 } });
    assert.deepEqual(b, { nested: { y: 2 } });

    // output is new object
    assert.notEqual(out, a);
    assert.notEqual(out, b);
  });

  test('defaultsDeep: circular-ish sources do not cause infinite recursion', () => {
    const src: any = { a: { x: 1 } };
    src.a.self = src; // creates a cycle

    const out = defaultsDeep({}, src);

    assert.ok('a' in out);
    assert.equal((out as any).a.x, 1);
  });
});
