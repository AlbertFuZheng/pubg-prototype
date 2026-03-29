// ============================================================
// stance.ts — 姿态状态机 (站/蹲/趴)
// ============================================================

import { Stance, STANCE_CONFIG } from './constants';
import type { PlayerState } from './types';

/**
 * Handle stance toggle inputs.
 * C = toggle standing/crouching
 * Z = toggle to/from prone
 */
export function handleStanceChange(params: {
  crouchPressed: boolean; // single press detected
  pronePressed: boolean; // single press detected
  state: PlayerState;
}): Stance {
  const { crouchPressed, pronePressed, state } = params;

  if (pronePressed) {
    // If already prone, stand up; otherwise go prone
    return state.stance === Stance.Prone ? Stance.Standing : Stance.Prone;
  }

  if (crouchPressed) {
    // Toggle between standing and crouching
    if (state.stance === Stance.Standing) return Stance.Crouching;
    if (state.stance === Stance.Crouching) return Stance.Standing;
    // If prone and C pressed, go to crouching
    if (state.stance === Stance.Prone) return Stance.Crouching;
  }

  return state.stance;
}
