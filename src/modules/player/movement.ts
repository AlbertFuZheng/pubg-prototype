// ============================================================
// movement.ts — 移动动画切换逻辑
// ============================================================

import * as THREE from 'three';
import { ANIM, Stance } from './constants';
import type { InputState, PlayerState } from './types';

export function handleMovement(params: {
  input: InputState;
  state: PlayerState;
  actions: THREE.AnimationAction[];
  setAction: (action: THREE.AnimationAction) => void;
  isJumpWait: boolean;
}): void {
  const { input, state, actions, setAction, isJumpWait } = params;

  if (isJumpWait || state.isJumping) return;

  const { forward, backward, left, right } = input;

  // Sprint only allowed in certain stances and moving forward
  const canSprint = input.sprint && forward && !backward;

  if (forward || backward) {
    if (canSprint && state.stance === Stance.Standing) {
      setAction(actions[forward ? ANIM.RUN_FORWARD : ANIM.RUN_BACKWARD]);
    } else {
      setAction(actions[forward ? ANIM.WALK_FORWARD : ANIM.WALK_BACKWARD]);
    }
    return;
  }

  if (left || right) {
    setAction(actions[left ? ANIM.STRAFE_LEFT : ANIM.STRAFE_RIGHT]);
    return;
  }

  // Idle
  setAction(actions[ANIM.IDLE]);
}
