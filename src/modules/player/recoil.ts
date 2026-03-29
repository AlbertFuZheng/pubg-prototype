// ============================================================
// recoil.ts — 骨骼视觉后坐力（手部抖动效果）
// ============================================================

import * as THREE from 'three';
import { RECOIL_DURATION, RECOIL_STRENGTH } from './constants';

export function handleRecoil(params: {
  recoilActive: React.MutableRefObject<boolean>;
  recoilStartTime: React.MutableRefObject<number>;
  leftHandBone: React.MutableRefObject<THREE.Bone | null>;
  rightHandBone: React.MutableRefObject<THREE.Bone | null>;
  leftHandOrigRot: React.MutableRefObject<THREE.Euler>;
  rightHandOrigRot: React.MutableRefObject<THREE.Euler>;
}): void {
  const { recoilActive, recoilStartTime, leftHandBone, rightHandBone, leftHandOrigRot, rightHandOrigRot } = params;

  if (!recoilActive.current || !leftHandBone.current || !rightHandBone.current) return;

  const elapsed = Date.now() - recoilStartTime.current;
  const progress = Math.min(elapsed / RECOIL_DURATION, 1);

  if (progress < 1) {
    const intensity = Math.sin(progress * Math.PI) * RECOIL_STRENGTH;
    leftHandBone.current.rotation.copy(leftHandOrigRot.current);
    rightHandBone.current.rotation.copy(rightHandOrigRot.current);
    leftHandBone.current.rotation.z += intensity * 0.05;
    rightHandBone.current.rotation.z -= intensity * 0.05;
  } else {
    leftHandBone.current.rotation.copy(leftHandOrigRot.current);
    rightHandBone.current.rotation.copy(rightHandOrigRot.current);
    recoilActive.current = false;
  }
}
