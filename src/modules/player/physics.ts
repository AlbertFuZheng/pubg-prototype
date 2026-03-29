// ============================================================
// physics.ts — 物理移动计算（PUBG 速度体系 + 加减速 + 方向修饰）
// ============================================================

import * as THREE from 'three';
import type { RapierRigidBody } from '@react-three/rapier';
import {
  MOVE_SPEED,
  SPRINT_SPEED,
  CROUCH_SPEED,
  PRONE_SPEED,
  BACKWARD_MULTIPLIER,
  STRAFE_MULTIPLIER,
  ADS_MOVE_MULTIPLIER,
  Stance,
  STANCE_CONFIG,
} from './constants';
import type { PlayerState, InputState } from './types';

const _dirVec = new THREE.Vector3();

export function updateMovementPhysics(params: {
  input: InputState;
  state: PlayerState;
  playerYRotation: THREE.Quaternion;
  controls: React.RefObject<RapierRigidBody | null>;
  smoothedPlayerPosition: React.MutableRefObject<THREE.Vector3>;
  group: React.RefObject<THREE.Group | null>;
  delta: number;
}): void {
  const { input, state, playerYRotation, controls, smoothedPlayerPosition, group, delta } = params;
  if (!controls.current) return;

  const stanceCfg = STANCE_CONFIG[state.stance];

  // Base speed for current stance
  let baseSpeed: number;
  if (state.stance === Stance.Prone) {
    baseSpeed = PRONE_SPEED;
  } else if (state.stance === Stance.Crouching) {
    baseSpeed = CROUCH_SPEED;
  } else {
    baseSpeed = state.isSprinting ? SPRINT_SPEED : MOVE_SPEED;
  }

  // ADS modifier
  if (state.isAiming) {
    baseSpeed *= ADS_MOVE_MULTIPLIER;
  }

  // Direction vectors based on player facing
  const playerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerYRotation);
  const playerRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), playerForward);

  // Compute movement direction
  let moveZ = 0; // forward/backward
  let moveX = 0; // left/right

  if (input.forward) moveZ -= 1;
  if (input.backward) moveZ += 1;
  if (input.left) moveX -= 1;
  if (input.right) moveX += 1;

  // Direction-based speed modifiers
  let speedMod = 1.0;
  if (moveZ > 0) speedMod *= BACKWARD_MULTIPLIER; // backward
  if (moveX !== 0 && moveZ === 0) speedMod *= STRAFE_MULTIPLIER; // pure strafe

  // Diagonal normalization
  if (moveZ !== 0 && moveX !== 0) {
    const diag = 1 / Math.SQRT2;
    moveZ *= diag;
    moveX *= diag;
  }

  const finalSpeed = baseSpeed * speedMod;

  _dirVec
    .copy(playerForward)
    .multiplyScalar(moveZ * finalSpeed)
    .add(playerRight.clone().multiplyScalar(moveX * finalSpeed));

  // Set velocity (preserve Y for gravity/jump)
  const vel = controls.current.linvel();
  controls.current.setLinvel(
    { x: _dirVec.x, y: vel.y, z: _dirVec.z },
    true,
  );

  // Read visual position from the Three.js group (already interpolated by rapier)
  // This ensures camera and model use the exact same position each frame — no ghosting
  if (group.current) {
    const worldPos = new THREE.Vector3();
    group.current.getWorldPosition(worldPos);
    smoothedPlayerPosition.current.set(worldPos.x, worldPos.y + stanceCfg.cameraHeight, worldPos.z);
  }
}
