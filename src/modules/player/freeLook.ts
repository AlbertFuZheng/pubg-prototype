// ============================================================
// freeLook.ts — 自由视角 (Alt)
// ============================================================

import { FREE_LOOK } from './constants';

/**
 * Update free-look yaw offset.
 * While Alt is held: accumulate mouse X into freeLookYawOffset (clamped).
 * When released: lerp back to 0.
 */
export function updateFreeLook(
  isFreeLooking: boolean,
  currentOffset: number,
  mouseMovementX: number,
  sensitivity: number,
  delta: number,
): number {
  if (isFreeLooking) {
    // Accumulate offset
    const newOffset = currentOffset - mouseMovementX * sensitivity;
    // Clamp
    return Math.max(-FREE_LOOK.maxYawOffset, Math.min(FREE_LOOK.maxYawOffset, newOffset));
  } else {
    // Return to center
    const speed = FREE_LOOK.returnLerpSpeed * delta;
    return currentOffset * (1 - Math.min(1, speed));
  }
}
