// ============================================================
// lean.ts — 探头系统 (Q/E)
// ============================================================

import { LEAN } from './constants';

/**
 * Update lean value (-1 left, 0 center, 1 right).
 * Uses delta-time based lerp for smooth transitions.
 */
export function updateLean(
  leanLeft: boolean,
  leanRight: boolean,
  currentLean: number,
  delta: number,
): number {
  const target = leanLeft ? -1 : leanRight ? 1 : 0;
  const speed = LEAN.lerpSpeed * delta;
  // Lerp toward target
  return currentLean + (target - currentLean) * Math.min(1, speed);
}
