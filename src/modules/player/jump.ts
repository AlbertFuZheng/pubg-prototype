// ============================================================
// jump.ts — 跳跃系统
// ============================================================

import type { RapierRigidBody } from '@react-three/rapier';
import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { JUMP_IMPULSE, JUMP_COOLDOWN, ANIM, STANCE_CONFIG } from './constants';
import type { PlayerState } from './types';

export function handleJump(params: {
  jumpPressed: boolean;
  state: PlayerState;
  actions: THREE.AnimationAction[];
  controls: React.RefObject<RapierRigidBody | null>;
  world: any;
  now: number;
  setAction: (a: THREE.AnimationAction) => void;
  setIsJumping: (v: boolean) => void;
  setJumpWait: (v: boolean) => void;
}): void {
  const { jumpPressed, state, actions, controls, world, now, setAction, setIsJumping, setJumpWait } = params;

  if (!controls.current) return;

  const stanceCfg = STANCE_CONFIG[state.stance];
  if (!stanceCfg.canJump) return;

  // Ground check via ray cast
  const pos = controls.current.translation();
  const ray = world.castRay(
    new RAPIER.Ray({ x: pos.x, y: pos.y, z: pos.z }, { x: 0, y: -1, z: 0 }),
    0.8,
    true,
  );
  const isGrounded = ray && ray.collider && Math.abs(ray.timeOfImpact) <= 0.6;

  // Reset jump state on landing
  if (isGrounded && state.isJumping) {
    setIsJumping(false);
    setJumpWait(false);
  }

  // Trigger jump
  if (jumpPressed && isGrounded && !state.isJumping && now - state.lastJumpTime > JUMP_COOLDOWN) {
    setAction(actions[ANIM.JUMP_UP]);
    setIsJumping(true);
    setJumpWait(true);
    state.lastJumpTime = now;

    controls.current.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);

    const dur = actions[ANIM.JUMP_UP].getClip().duration;
    setTimeout(() => setJumpWait(false), dur * 1000);
  }
}
