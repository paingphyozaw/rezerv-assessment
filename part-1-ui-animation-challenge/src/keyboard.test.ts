import test from 'node:test';
import assert from 'node:assert/strict';
import { keyScrollDistance } from './keyboard.ts';

const page = { shift: false, onButton: false, pageHeight: 800 };

test('arrow keys scroll a small step', () => {
  assert.equal(keyScrollDistance('ArrowDown', page), 40);
  assert.equal(keyScrollDistance('ArrowUp', page), -40);
});

test('page keys and space scroll most of a screen', () => {
  assert.equal(keyScrollDistance('PageDown', page), 720);
  assert.equal(keyScrollDistance('PageUp', page), -720);
  assert.equal(keyScrollDistance(' ', page), 720);
  assert.equal(keyScrollDistance(' ', { ...page, shift: true }), -720);
});

test('space on a focused button presses the button instead of scrolling', () => {
  assert.equal(keyScrollDistance(' ', { ...page, onButton: true }), null);
  assert.equal(keyScrollDistance('ArrowDown', { ...page, onButton: true }), 40);
});

test('other keys are left alone', () => {
  for (const key of ['Home', 'End', 'Enter', 'a', 'Tab'])
    assert.equal(keyScrollDistance(key, page), null, key);
});
