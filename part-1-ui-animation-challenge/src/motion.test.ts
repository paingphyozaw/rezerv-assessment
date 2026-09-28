import test from 'node:test';
import assert from 'node:assert/strict';
import { modulo, poseAt, posesFor, windowOpacity } from './motion.ts';

test('every character joins the loop continuously, forward and backward', () => {
  for (const mobile of [true, false]) {
    const count = mobile ? 16 : 24;
    for (let i = 0; i < count; i++) {
      const poses = posesFor(i, count, mobile);
      const start = poseAt(poses, 0),
        before = poseAt(poses, 1 - 1e-7),
        after = poseAt(poses, 1 + 1e-7);
      for (const key of ['x', 'y', 'r', 's'] as const) {
        assert.ok(Math.abs(start[key] - before[key]) < 1e-8);
        assert.ok(Math.abs(start[key] - after[key]) < 1e-8);
        assert.ok(Number.isFinite(poseAt(poses, -0.6)[key]));
      }
      assert.deepEqual(poseAt(poses, 0.25), poseAt(poses, 4.25));
    }
  }
});
test('native scroll rebasing preserves the visual phase in both directions', () => {
  const cycle = 4200;
  for (const y of [0, 10, cycle * 0.49, cycle * 2.51, cycle * 3]) {
    const rebased = cycle + modulo(y, cycle);
    assert.ok(Math.abs(modulo(y / cycle) - modulo(rebased / cycle)) < 1e-12);
    assert.ok(rebased >= cycle && rebased < cycle * 2);
  }
});
test('scene windows are bounded and the hero is fully visible across the seam', () => {
  for (let p = 0; p <= 1; p += 0.001)
    assert.ok(
      windowOpacity(p, 0.22, 0.65, 0.13) >= 0 &&
        windowOpacity(p, 0.22, 0.65, 0.13) <= 1
    );
  assert.equal(windowOpacity(0, 0.07, 0.95, 0.13), 0);
  assert.equal(windowOpacity(1, 0.07, 0.95, 0.13), 0);
});
