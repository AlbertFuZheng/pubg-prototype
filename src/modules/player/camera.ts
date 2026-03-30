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
  isMobile?: boolean;
}): void {
  const { state, smoothedPlayerPosition, smoothedCameraPosition, playerYRotation, pitch, yaw, camera, world, delta, isMobile } = params;

  const isADS = state.isAiming;
  const isSprint = state.isSprinting;
  const stanceCfg = STANCE_CONFIG[state.stance];

  // Target camera height (lerps during stance change)
  const targetCamH = stanceCfg.cameraHeight;
  state.cameraHeight += (targetCamH - state.cameraHeight) * Math.min(1, delta * 8);

  // Camera distance & offsets based on mode
  const distance = isADS ? CAMERA.adsDistance : CAMERA.defaultDistance;
  const rightOffset = isADS ? CAMERA.adsRightOffset : CAMERA.defaultRightOffset;
  const baseFov = isADS
    ? (isMobile ? 40 : CAMERA.adsFov)
    : (isMobile ? 55 : CAMERA.defaultFov);
  const lerpSpeed = isADS ? CAMERA.adsLerpSpeed : CAMERA.defaultLerpSpeed;

  // Lean camera offset (horizontal + slight downward)
  const leanOffset = state.lean * LEAN.headOffset;
  const totalRightOffset = rightOffset + leanOffset;
  const leanDownOffset = Math.abs(state.lean) * LEAN.cameraDownOffset;

  // Orbital position based on pitch — use fixed standing height for orbit,
  // stance changes only apply as pure Y offset (no forward/backward shift)
  const standingHeight = STANCE_CONFIG[Stance.Standing].cameraHeight;
  const stanceDropOffset = standingHeight - state.cameraHeight; // positive when crouching/prone
  const orbitAngle = pitch;
  const cameraOffset = new THREE.Vector3(
    totalRightOffset,
    Math.sin(orbitAngle) * distance + standingHeight - leanDownOffset,
    -Math.cos(orbitAngle) * distance,
  );

  cameraOffset.applyQuaternion(playerYRotation);

  // Player base position (feet-level from physics body)
  const playerBase = smoothedPlayerPosition.current;
  const targetCameraPos = new THREE.Vector3(
    playerBase.x + cameraOffset.x,
    playerBase.y + cameraOffset.y - standingHeight - stanceDropOffset,
    playerBase.z + cameraOffset.z,
  );

  // Collision detection
  const headPos = playerBase.clone();
  let hasCollision = false;

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
        hasCollision = true;
        // Track the collision distance ratio for smooth recovery
        state._collisionRatio = collDist / naturalDist;
        smoothedCameraPosition.current.copy(collisionResult.position);
      }
    }
  }

  if (hasCollision) {
    // Collision: use the pushed-in position
    camera.position.copy(smoothedCameraPosition.current);
  } else if (state._collisionRatio !== undefined && state._collisionRatio < 0.95) {
    // Recovering from collision: lerp the ratio back to 1.0
    state._collisionRatio += (1.0 - state._collisionRatio) * Math.min(1, delta * 6);
    if (state._collisionRatio > 0.95) {
      state._collisionRatio = undefined; // recovery complete
      smoothedCameraPosition.current.copy(targetCameraPos);
      camera.position.copy(targetCameraPos);
    } else {
      // Interpolate between head and target at current ratio
      smoothedCameraPosition.current.copy(headPos).lerp(targetCameraPos, state._collisionRatio);
      camera.position.copy(smoothedCameraPosition.current);
    }
  } else {
    // No collision, no recovery: set directly (rigid follow)
    state._collisionRatio = undefined;
    smoothedCameraPosition.current.copy(targetCameraPos);
    camera.position.copy(targetCameraPos);
  }

  // FOV transition
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.fov += (baseFov - camera.fov) * 0.15;
    camera.near = isADS ? 0.01 : 0.1;
    camera.updateProjectionMatrix();
  }

  // Fix rotation order: YXZ prevents parasitic roll from lookAt decomposition
  camera.rotation.order = 'YXZ';

  // Camera orientation: use fixed aim direction (no lookAt) to prevent
  // orientation changes during jump/crouch/prone stance transitions.
  // This matches PUBG behavior where camera direction stays stable.
  const aimQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-pitch, yaw + Math.PI, 0, 'YXZ'));
  const aimDir = new THREE.Vector3(0, 0, -1).applyQuaternion(aimQuat);
  const lookTarget = camera.position.clone().add(aimDir.multiplyScalar(15));
  camera.lookAt(lookTarget);

  // Lean: position offset only, no roll rotation (matches PUBG Mobile/PC behavior)
}
