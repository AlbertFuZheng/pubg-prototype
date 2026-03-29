// ============================================================
// muzzleFlash.ts — 枪口火焰视觉效果
// ============================================================

import * as THREE from 'three';
import { MUZZLE_FLASH_DURATION, MUZZLE_FLASH_LIGHT_INTENSITY } from './constants';

export function handleMuzzleFlash(params: {
  active: React.MutableRefObject<boolean>;
  startTime: React.MutableRefObject<number>;
  meshRef: React.RefObject<THREE.Mesh | null>;
  lightRef: React.RefObject<THREE.PointLight | null>;
  gunBarrelPos: React.MutableRefObject<THREE.Vector3>;
  group: React.RefObject<THREE.Group | null>;
  bones: THREE.Bone[];
  pitch: number;
  yaw: number;
  camera: THREE.Camera;
}): void {
  const { active, startTime, meshRef, lightRef, gunBarrelPos, group, bones, pitch, yaw, camera } = params;

  if (!active.current) return;

  const elapsed = Date.now() - startTime.current;
  const progress = Math.min(elapsed / MUZZLE_FLASH_DURATION, 1);

  if (progress < 1) {
    if (group.current && bones.length > 3) {
      const handPos = new THREE.Vector3();
      bones[3].getWorldPosition(handPos);
      const gunOffset = new THREE.Vector3(0, 0.2, 1);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
      gunOffset.applyQuaternion(q);
      gunBarrelPos.current.copy(handPos).add(gunOffset);
    }

    const flashIntensity = 1 - progress * progress;

    if (meshRef.current) {
      meshRef.current.position.copy(gunBarrelPos.current);
      meshRef.current.lookAt(camera.position);
      meshRef.current.visible = true;
      const scale = 0.3 + Math.random() * 0.2;
      meshRef.current.scale.setScalar(scale * flashIntensity);
      meshRef.current.rotation.z = Math.random() * Math.PI * 2;
    }

    if (lightRef.current) {
      lightRef.current.position.copy(gunBarrelPos.current);
      lightRef.current.intensity = MUZZLE_FLASH_LIGHT_INTENSITY * flashIntensity;
      lightRef.current.visible = true;
    }
  } else {
    if (meshRef.current) meshRef.current.visible = false;
    if (lightRef.current) lightRef.current.visible = false;
    active.current = false;
  }
}

// Procedural muzzle flash texture
export function createMuzzleFlashTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,200,100,0.8)');
  gradient.addColorStop(0.6, 'rgba(255,100,0,0.4)');
  gradient.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const imgData = ctx.getImageData(0, 0, 128, 128);
  for (let i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i + 3] *= 0.8 + Math.random() * 0.4;
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
