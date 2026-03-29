// ============================================================
// camera.ts — 和平精英风格越肩摄像机 + ADS + 碰撞检测
// ============================================================

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { CAMERA, Stance, STANCE_CONFIG, LEAN } from './constants';
import type { PlayerState } from './types';

// ---- Camera collision (multi-ray cone) ----
function checkCameraCollision(
  headPos: THREE.Vector3,
  cameraPos: THREE.Vector3,
  world: any,
  minDistance: number,
): { position: THREE.Vector3; hasCollision: boolean } {
  if (!world) return { position: cameraPos, hasCollision: false };

  const dir = new THREE.Vector3().subVectors(cameraPos, headPos).normalize();
  const fullDist = headPos.distanceTo(cameraPos);

  const mainRay = new RAPIER.Ray(
    { x: headPos.x, y: headPos.y, z: headPos.z },
    { x: dir.x, y: dir.y, z: dir.z },
  );

  let closestHit = world.castRay(mainRay, fullDist, true);
  let shortest = closestHit ? closestHit.timeOfImpact : fullDist;

  // Cone offsets for volume detection
  const offsets = [
    { x: 0.05, y: 0.05, z: 0 },
    { x: -0.05, y: 0.05, z: 0 },
    { x: 0.05, y: -0.05, z: 0 },
    { x: -0.05, y: -0.05, z: 0 },
    { x: 0, y: 0.08, z: 0 },
    { x: 0, y: -0.08, z: 0 },
    { x: 0.08, y: 0, z: 0 },
    { x: -0.08, y: 0, z: 0 },
  ];

  for (const off of offsets) {
    const offDir = new THREE.Vector3(dir.x + off.x, dir.y + off.y, dir.z + off.z).normalize();
    const ray = new RAPIER.Ray(
      { x: headPos.x, y: headPos.y, z: headPos.z },
      { x: offDir.x, y: offDir.y, z: offDir.z },
    );
    const hit = world.castRay(ray, fullDist, true);
    if (hit && hit.timeOfImpact < shortest) {
      shortest = hit.timeOfImpact;
      closestHit = hit;
    }
  }

  if (closestHit && shortest < fullDist - 0.3) {
    const safeDist = Math.max(shortest - 0.2, minDistance);
    const adjusted = new THREE.Vector3().copy(headPos).add(dir.multiplyScalar(safeDist));
    return { position: adjusted, hasCollision: true };
  }

  return { position: cameraPos, hasCollision: false };
}

// ---- Main camera update ----
export function updateCamera(params: {
  state: PlayerState;
  smoothedPlayerPosition: React.MutableRefObject<THREE.Vector3>;
  smoothedCameraPosition: React.MutableRefObject<THREE.Vector3>;
  playerYRotation: THREE.Quaternion;
  pitch: number;
  yaw: number;
  camera: THREE.Camera;
  world: any;
  delta: number;
}): void {
  const { state, smoothedPlayerPosition, smoothedCameraPosition, playerYRotation, pitch, yaw, camera, world, delta } = params;

  const isADS = state.isAiming;
  const isSprint = state.isSprinting;
  const stanceCfg = STANCE_CONFIG[state.stance];

  // Target camera height (lerps during stance change)
  const targetCamH = stanceCfg.cameraHeight;
  state.cameraHeight += (targetCamH - state.cameraHeight) * Math.min(1, delta * 8);

  // Camera distance & offsets based on mode
  const distance = isADS ? CAMERA.adsDistance : CAMERA.defaultDistance;
  const rightOffset = isADS ? CAMERA.adsRightOffset : CAMERA.defaultRightOffset;
  const baseFov = isADS ? CAMERA.adsFov : CAMERA.defaultFov + (isSprint ? CAMERA.sprintFovBoost : 0);
  const lerpSpeed = isADS ? CAMERA.adsLerpSpeed : CAMERA.defaultLerpSpeed;

  // Lean camera offset
  const leanOffset = state.lean * LEAN.headOffset;
  const totalRightOffset = rightOffset + leanOffset;

  // Orbital position based on pitch
  const orbitAngle = pitch;
  const cameraOffset = new THREE.Vector3(
    -totalRightOffset,
    Math.sin(orbitAngle) * distance + state.cameraHeight,
    -Math.cos(orbitAngle) * distance,
  );

  cameraOffset.applyQuaternion(playerYRotation);

  // Player base position (feet-level from physics body, add smoothed camera height)
  const playerBase = smoothedPlayerPosition.current;
  const targetCameraPos = new THREE.Vector3(
    playerBase.x + cameraOffset.x,
    playerBase.y + cameraOffset.y - stanceCfg.cameraHeight, // subtract since cameraHeight is already in offset
    playerBase.z + cameraOffset.z,
  );

  // Collision detection
  const headPos = playerBase.clone();
  let finalCameraPos = targetCameraPos;

  if (world) {
    const collisionResult = checkCameraCollision(
      headPos,
      targetCameraPos,
      world,
      CAMERA.collisionMinDistance,
    );
    if (collisionResult.hasCollision) {
      const collDist = collisionResult.position.distanceTo(headPos);
      const naturalDist = targetCameraPos.distanceTo(headPos);
      if (collDist < naturalDist - 0.1) {
        finalCameraPos = collisionResult.position;
      }
    }
  }

  // Smooth camera position
  smoothedCameraPosition.current.lerp(finalCameraPos, Math.min(1, lerpSpeed + delta * 2));
  camera.position.copy(smoothedCameraPosition.current);

  // FOV transition
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.fov += (baseFov - camera.fov) * 0.15;
    camera.near = isADS ? 0.01 : 0.1;
    camera.updateProjectionMatrix();
  }

  // Fix rotation order: YXZ prevents parasitic roll from lookAt decomposition
  camera.rotation.order = 'YXZ';

  // Camera lookAt
  if (isADS) {
    // ADS: look along aim direction
    const aimOrigin = smoothedPlayerPosition.current.clone().add(new THREE.Vector3(0, state.cameraHeight - 0.2, 0));
    const aimQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-pitch, yaw + Math.PI, 0, 'YXZ'));
    const aimDir = new THREE.Vector3(0, 0, -1).applyQuaternion(aimQuat);
    const aimTarget = aimOrigin.clone().add(aimDir.multiplyScalar(15));
    camera.lookAt(aimTarget);
  } else {
    // Default TPP: look at character chest
    const lookTarget = smoothedPlayerPosition.current.clone().add(new THREE.Vector3(0, state.cameraHeight * 0.55, 0));
    camera.lookAt(lookTarget);
  }

  // Apply lean roll AFTER lookAt (state.lean is already smoothed in lean.ts)
  camera.rotation.z = -state.lean * LEAN.maxAngle * LEAN.cameraRollMultiplier;
}
