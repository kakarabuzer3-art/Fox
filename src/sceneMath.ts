export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function easeInOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Responsive Higgsfield resizer width:
 * viewportWidth * dpr * 1.05, rounded to a multiple of 64, clamped to [1024, 2048].
 */
export function computeStillWidth(viewportWidth: number, dpr: number): number {
  const raw = viewportWidth * (dpr || 1) * 1.05;
  const rounded = Math.round(raw / 64) * 64;
  return clamp(rounded, 1024, 2048);
}

/**
 * Wordmark letter-spacing fit: (target * u - naturalWidth) / (letterCount - 1)
 */
export function computeWordmarkLetterSpacing(
  targetDesignPx: number,
  u: number,
  naturalWidth: number,
  letterCount: number
): number {
  if (letterCount <= 1) return 0;
  return (targetDesignPx * u - naturalWidth) / (letterCount - 1);
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Compute interpolated framing rectangle between hero cover-fit (Rect 0)
 * and full-height fit (Rect 1) for a 16:9 video frame.
 */
export function computeSceneFrameRect(
  canvasWidth: number,
  canvasHeight: number,
  curFrame: number,
  videoAspect = 16 / 9
): { rect: Rect; t: number } {
  const rawT = clamp((curFrame / 240 - 0.35) / 0.55, 0, 1);
  const t = easeInOutCubic(rawT);

  // Rect 0: cover-fitted into box of full canvas width and height max(width * 900/1440, canvasHeight),
  // anchored at the top and centred.
  const boxH = Math.max((canvasWidth * 900) / 1440, canvasHeight);
  const h0 = Math.max(boxH, canvasWidth / videoAspect);
  const w0 = h0 * videoAspect;
  const x0 = (canvasWidth - w0) / 2;
  const y0 = (boxH - h0) / 2;

  // Rect 1: full canvas height, centred horizontally.
  const h1 = canvasHeight;
  const w1 = h1 * videoAspect;
  const x1 = (canvasWidth - w1) / 2;
  const y1 = 0;

  return {
    t,
    rect: {
      x: x0 + (x1 - x0) * t,
      y: y0 + (y1 - y0) * t,
      w: w0 + (w1 - w0) * t,
      h: h0 + (h1 - h0) * t,
    },
  };
}

/**
 * Story panel opacity & dash fill timing for video-scrubbed scene.
 */
export function computeStoryPanelState(p: number, videoActive: boolean) {
  const progress = clamp(p, 0, 1);
  if (!videoActive) {
    const first = progress < 0.5;
    return {
      a1: first ? 1 : 0,
      a2: first ? 0 : 1,
      dash1: first ? clamp(progress / 0.5) : 1,
      dash2: first ? 0 : clamp((progress - 0.5) / 0.5),
      dashesOnRight: false,
      dashesOpacity: 1,
    };
  }
  const a1 =
    clamp((progress - 0.2) / 0.06) * (1 - clamp((progress - 0.43) / 0.06));
  const a2 = clamp((progress - 0.64) / 0.08);
  const dash1 = clamp((progress - 0.2) / 0.35);
  const dash2 = clamp((progress - 0.55) / 0.45);
  return {
    a1,
    a2,
    dash1,
    dash2,
    dashesOnRight: progress < 0.55,
    dashesOpacity: Math.max(a1, a2),
  };
}

/**
 * Target frame from stage scroll progress P in [0, 1].
 */
export function computeTargetFrame(stageProgress: number): number {
  return Math.min(1, clamp(stageProgress, 0, 1) / 0.85) * 240;
}

/**
 * Carousel progress bar fill width ratio: visibleFraction + (1 - visibleFraction) * scrollFraction
 */
export function computeCarouselProgress(
  clientWidth: number,
  scrollWidth: number,
  scrollLeft: number
): number {
  if (scrollWidth <= 0) return 1;
  const vis = clamp(clientWidth / scrollWidth, 0, 1);
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  const frac = maxScroll > 0 ? clamp(scrollLeft / maxScroll, 0, 1) : 0;
  return vis + (1 - vis) * frac;
}

/**
 * Next Novubar stop from current scrollY.
 */
export function computeNextNovubarStop(
  currentY: number,
  storyTop: number,
  viewportHeight: number,
  partnersTop: number
): number {
  const stops = [
    0,
    Math.round(storyTop + viewportHeight * 0.02),
    Math.round(storyTop + viewportHeight * 1.35),
    Math.round(partnersTop),
  ];
  for (const s of stops) {
    if (s > currentY + 40) return s;
  }
  return stops[0];
}
