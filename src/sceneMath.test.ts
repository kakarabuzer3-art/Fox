import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCarouselProgress,
  computeNextNovubarStop,
  computeSceneFrameRect,
  computeStillWidth,
  computeStoryPanelState,
  computeTargetFrame,
  computeWordmarkLetterSpacing,
} from './sceneMath';

test('computeStillWidth rounds to multiple of 64 and clamps to [1024, 2048]', () => {
  assert.equal(computeStillWidth(390, 1), 1024);
  assert.equal(computeStillWidth(390, 3), 1216); // 390*3*1.05 = 1228.5 -> 1216
  assert.equal(computeStillWidth(1440, 1), 1536); // 1440*1.05 = 1512 -> 1536
  assert.equal(computeStillWidth(1440, 2), 2048); // clamped max
});

test('computeWordmarkLetterSpacing distributes remaining width across inter-letter gaps', () => {
  assert.equal(computeWordmarkLetterSpacing(464, 1, 404, 4), 20);
  assert.equal(computeWordmarkLetterSpacing(737, 1, 687, 6), 10);
});

test('computeTargetFrame reaches frame 240 at 85% stage progress and holds', () => {
  assert.equal(computeTargetFrame(0), 0);
  assert.equal(Math.round(computeTargetFrame(0.425)), 120);
  assert.equal(computeTargetFrame(0.85), 240);
  assert.equal(computeTargetFrame(1), 240);
});

test('computeSceneFrameRect matches hero cover at frame 0 and full-height fit at frame 240', () => {
  const start = computeSceneFrameRect(1440, 900, 0);
  assert.equal(start.t, 0);
  assert.equal(start.rect.h, 900);
  assert.equal(start.rect.w, 1600);
  assert.equal(start.rect.x, -80);
  assert.equal(start.rect.y, 0);

  // Ultra-wide screen: at frame 240, rect fits canvas height and centers horizontally
  const endWide = computeSceneFrameRect(2400, 900, 240);
  assert.equal(endWide.t, 1);
  assert.equal(endWide.rect.h, 900);
  assert.equal(endWide.rect.w, 1600);
  assert.equal(endWide.rect.x, 400);
  assert.equal(endWide.rect.y, 0);
});

test('computeStoryPanelState times Panel 01, Panel 02, and dashes accurately', () => {
  const before = computeStoryPanelState(0.1, true);
  assert.equal(before.a1, 0);
  assert.equal(before.a2, 0);
  assert.equal(before.dashesOpacity, 0);

  const midP1 = computeStoryPanelState(0.32, true);
  assert.equal(midP1.a1, 1);
  assert.equal(midP1.a2, 0);
  assert.equal(midP1.dashesOnRight, true);

  const between = computeStoryPanelState(0.55, true);
  assert.equal(between.a1, 0);
  assert.equal(between.a2, 0);
  assert.equal(between.dashesOpacity, 0);
  assert.equal(between.dash1, 1);

  const midP2 = computeStoryPanelState(0.8, true);
  assert.equal(midP2.a1, 0);
  assert.equal(midP2.a2, 1);
  assert.equal(midP2.dashesOnRight, false);

  const reducedBefore = computeStoryPanelState(0.49, false);
  assert.equal(reducedBefore.a1, 1);
  assert.equal(reducedBefore.a2, 0);
  const reducedAfter = computeStoryPanelState(0.5, false);
  assert.equal(reducedAfter.a1, 0);
  assert.equal(reducedAfter.a2, 1);
});

test('computeCarouselProgress starts at visible fraction and reaches 1 at end', () => {
  assert.equal(computeCarouselProgress(1000, 4000, 0), 0.25);
  assert.equal(computeCarouselProgress(1000, 4000, 1500), 0.625);
  assert.equal(computeCarouselProgress(1000, 4000, 3000), 1);
});

test('computeNextNovubarStop cycles through all 4 stops and wraps to top', () => {
  const storyTop = 900;
  const vh = 900;
  const partnersTop = 3600;

  assert.equal(computeNextNovubarStop(0, storyTop, vh, partnersTop), 918);
  assert.equal(computeNextNovubarStop(918, storyTop, vh, partnersTop), 2115);
  assert.equal(computeNextNovubarStop(2115, storyTop, vh, partnersTop), 3600);
  assert.equal(computeNextNovubarStop(3600, storyTop, vh, partnersTop), 0);
});
