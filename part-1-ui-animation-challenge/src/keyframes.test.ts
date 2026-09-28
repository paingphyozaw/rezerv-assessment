import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FADES,
  POSE_TIMES,
  SCENE_START,
  SPACE,
  getPoses,
  getScene,
  isInSpace
} from './keyframes.ts';

test('every character ends the loop where it started', () => {
  for (const isMobile of [true, false]) {
    const count = isMobile ? 16 : 24;
    for (let i = 0; i < count; i++) {
      const poses = getPoses(i, count, isMobile);
      assert.equal(poses.length, 5);
      assert.deepEqual(poses[4], poses[0]);
      for (const pose of poses)
        for (const value of Object.values(pose))
          assert.ok(Number.isFinite(value), `character ${i} has ${value}`);
    }
  }
});

test('pose times go from 0 to 1 and always increase', () => {
  assert.equal(POSE_TIMES[0], 0);
  assert.equal(POSE_TIMES.at(-1), 1);
  for (let i = 1; i < POSE_TIMES.length; i++)
    assert.ok(POSE_TIMES[i] > POSE_TIMES[i - 1]);
});

test('every fade fits inside the loop', () => {
  for (const [name, range] of Object.entries(FADES)) {
    assert.ok(range.start >= 0 && range.end <= 1, name);
    assert.ok(range.start + range.fade <= range.end - range.fade, name);
  }
});

test('getScene switches at each scene start, including the loop seam', () => {
  const cases: [number, number][] = [
    [0, 0],
    [SCENE_START.orbit - 0.0001, 0],
    [SCENE_START.orbit, 1],
    [0.5, 1],
    [SCENE_START.grid - 0.0001, 1],
    [SCENE_START.grid, 2],
    [SCENE_START.heroAgain - 0.0001, 2],
    [SCENE_START.heroAgain, 0],
    [1, 0]
  ];
  for (const [progress, scene] of cases)
    assert.equal(getScene(progress), scene, `progress ${progress}`);
});

test('isInSpace is true only during the space scene', () => {
  assert.equal(isInSpace(0), false);
  assert.equal(isInSpace(SPACE.start - 0.0001), false);
  assert.equal(isInSpace(SPACE.start), true);
  assert.equal(isInSpace(0.45), true);
  assert.equal(isInSpace(SPACE.end), false);
  assert.equal(isInSpace(1), false);
});
