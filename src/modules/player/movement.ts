// ============================================================
// movement.ts — 移动动画切换逻辑（支持站/蹲/趴三姿态）
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

  // ---- Prone 趴下 ----
  if (state.stance === Stance.Prone) {
    if (forward) {
      setAction(actions[ANIM.PRONE_FORWARD]);
    } else if (backward) {
      setAction(actions[ANIM.PRONE_BACKWARD]);
    } else {
      setAction(actions[ANIM.PRONE_IDLE]);
    }
    return;
  }

  // ---- Crouching 蹲下 ----
  if (state.stance === Stance.Crouching) {
    if (forward || backward) {
      if (state.isSprinting && forward) {
        // 蹲下冲刺用蹲走前进（蹲姿没有冲刺动画）
        setAction(actions[ANIM.CROUCH_WALK_FORWARD]);
      } else {
        setAction(actions[forward ? ANIM.CROUCH_WALK_FORWARD : ANIM.CROUCH_WALK_BACKWARD]);
      }
      return;
    }
    if (left || right) {
      setAction(actions[left ? ANIM.CROUCH_STRAFE_LEFT : ANIM.CROUCH_STRAFE_RIGHT]);
      return;
    }
    setAction(actions[ANIM.CROUCH_IDLE]);
    return;
  }

  // ---- Standing 站立 ----
  if (forward || backward) {
    if (state.isSprinting && forward) {
      setAction(actions[ANIM.SPRINT_FORWARD]);
    } else if (input.sprint && forward) {
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
