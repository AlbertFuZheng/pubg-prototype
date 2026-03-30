// ============================================================
// shooting.ts — 射击系统（射线检测 + 扩散 + 后坐力）
// ============================================================

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type { RapierRigidBody } from '@react-three/rapier';
import { SHOOTING, Stance } from './constants';
import type { PlayerState, InputState } from './types';

/**
 * Update shooting spread (recovers over time, increases on fire/move).
 */
export function updateSpread(params: {
  state: PlayerState;
  input: InputState;
  delta: number;
}): number {
  const { state, input, delta } = params;
  const cfg = state.isAiming ? SHOOTING.ads : SHOOTING.hipFire;

  let spread = state.currentSpread;

  // Recovery
  spread -= cfg.recoveryRate * delta;

  // Movement penalty
  const isMoving = input.forward || input.backward || input.left || input.right;
  if (isMoving) {
    spread = Math.max(spread, cfg.baseSpread + cfg.moveSpreadBonus);
  }

  return Math.max(cfg.baseSpread, Math.min(cfg.maxSpread, spread));
}

/**
 * Update recoil (accumulates on fire, recovers over time).
 */
export function updateRecoil(params: {
  state: PlayerState;
  justFired: boolean;
  delta: number;
}): { recoilPitch: number; recoilYaw: number } {
  const { state, justFired, delta } = params;
  const cfg = SHOOTING.recoil;
  const stanceMul = cfg.stanceMultiplier[state.stance] ?? 1;

  let rp = state.recoilPitch;
  let ry = state.recoilYaw;

  if (justFired) {
    // Add recoil
    const vRecoil = (cfg.verticalBase + cfg.verticalAccumulation * state.consecutiveShots) * stanceMul;
    rp += vRecoil * (Math.PI / 180);

    const hRecoil = (Math.random() * 2 - 1) * cfg.horizontalRange * stanceMul;
    ry += hRecoil * (Math.PI / 180);
  }

  // Recovery
  const recoveryRate = cfg.recoverySpeed * delta * (Math.PI / 180);
  if (Math.abs(rp) > 0.0001) {
    rp -= Math.sign(rp) * Math.min(Math.abs(rp), recoveryRate);
  }
  if (Math.abs(ry) > 0.0001) {
    ry -= Math.sign(ry) * Math.min(Math.abs(ry), recoveryRate * 0.5);
  }

  return { recoilPitch: rp, recoilYaw: ry };
}

/**
 * Hit result from ray-cast shooting.
 */
export interface ShootHitResult {
  hit: boolean;
  hitPoint?: THREE.Vector3;
  hitNormal?: THREE.Vector3;
  rayOrigin?: THREE.Vector3;
  rayDirection?: THREE.Vector3;
}

/**
 * Perform ray-cast shooting.
 */
export function handleShooting(params: {
  world: any;
  camera: THREE.Camera;
  controls: React.RefObject<RapierRigidBody | null>;
  shoot: boolean;
  spread: number; // current spread in degrees
  shootRayDirection: React.MutableRefObject<THREE.Vector3>;
}): ShootHitResult {
  const { world, camera, controls, shoot, spread, shootRayDirection } = params;

  if (!shoot || !controls.current) return { hit: false };

  // Base direction from camera
  const baseDir = camera.getWorldDirection(new THREE.Vector3());

  // Apply spread
  if (spread > 0) {
    const spreadRad = (spread * Math.PI) / 180;
    const randomAngle = Math.random() * Math.PI * 2;
    const randomRadius = Math.random() * spreadRad;
    const right = new THREE.Vector3().crossVectors(baseDir, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, baseDir).normalize();
    baseDir.add(right.multiplyScalar(Math.cos(randomAngle) * randomRadius));
    baseDir.add(up.multiplyScalar(Math.sin(randomAngle) * randomRadius));
    baseDir.normalize();
  }

  shootRayDirection.current.copy(baseDir);

  const rayOrigin = camera.position.clone();
  const shootRay = world.castRay(
    new RAPIER.Ray(rayOrigin, shootRayDirection.current),
    100,
    true,
  );

  if (shootRay && shootRay.collider) {
    const hitBody = shootRay.collider.parent();
    if (hitBody && hitBody.isValid()) {
      const playerHandle = controls.current.handle;
      const hitHandle = hitBody.handle;
      if (playerHandle !== hitHandle) {
        const impulseStrength = 0.03;
        const hitPoint = new THREE.Vector3()
          .copy(rayOrigin)
          .add(new THREE.Vector3().copy(shootRayDirection.current).multiplyScalar(shootRay.timeOfImpact));

        hitBody.applyImpulseAtPoint(
          {
            x: shootRayDirection.current.x * impulseStrength,
            y: shootRayDirection.current.y * impulseStrength,
            z: shootRayDirection.current.z * impulseStrength,
          },
          hitPoint,
          true,
        );

        // Compute hit normal from the collider shape
        const hitNormal = new THREE.Vector3().copy(shootRayDirection.current).negate().normalize();
        // Try to get a better normal from the ray's feature
        // For flat surfaces, use the ray direction inverted as a fallback
        // Rapier doesn't directly provide normals from castRay, so we approximate:
        // Use the dominant axis of the hit direction for flat surfaces
        const absX = Math.abs(hitNormal.x);
        const absY = Math.abs(hitNormal.y);
        const absZ = Math.abs(hitNormal.z);
        if (absY > absX && absY > absZ) {
          hitNormal.set(0, Math.sign(hitNormal.y), 0);
        } else if (absX > absZ) {
          hitNormal.set(Math.sign(hitNormal.x), 0, 0);
        } else {
          hitNormal.set(0, 0, Math.sign(hitNormal.z));
        }

        return {
          hit: true,
          hitPoint: hitPoint.clone(),
          hitNormal,
          rayOrigin: rayOrigin.clone(),
          rayDirection: shootRayDirection.current.clone(),
        };
      }
    }
  }

  return { hit: false, rayOrigin: rayOrigin.clone(), rayDirection: shootRayDirection.current.clone() };
}
