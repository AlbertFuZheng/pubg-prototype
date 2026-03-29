// ============================================================
// types.ts — TypeScript 类型定义
// ============================================================

import type * as THREE from 'three';
import type { GLTF } from 'three-stdlib';
import type { RapierRigidBody } from '@react-three/rapier';
import type { Stance } from './constants';

// --- GLTF Model ---
export type GLTFResult = GLTF & {
  nodes: {
    Alpha_Joints: THREE.SkinnedMesh;
    Alpha_Surface: THREE.SkinnedMesh;
    mixamorigHips: THREE.Bone;
  };
  materials: {
    Alpha_Joints_MAT: THREE.MeshStandardMaterial;
    Alpha_Body_MAT: THREE.MeshStandardMaterial;
  };
};

// --- Player input state (read every frame) ---
export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  crouch: boolean; // C - toggle
  prone: boolean; // Z - toggle
  leanLeft: boolean; // Q - hold
  leanRight: boolean; // E - hold
  freeLook: boolean; // Alt - hold
  shoot: boolean; // LMB
  aim: boolean; // RMB - hold
  reload: boolean; // R
}

// --- Refs bundle passed to modules ---
export interface PlayerRefs {
  group: React.RefObject<THREE.Group | null>;
  controls: React.RefObject<RapierRigidBody | null>;
  smoothedPlayerPosition: React.MutableRefObject<THREE.Vector3>;
  smoothedCameraPosition: React.MutableRefObject<THREE.Vector3>;
  mouseRotation: React.MutableRefObject<{ x: number; y: number }>;
  shootRayDirection: React.MutableRefObject<THREE.Vector3>;
}

// --- Player state (persisted across frames) ---
export interface PlayerState {
  stance: Stance;
  isJumping: boolean;
  isSprinting: boolean;
  isAiming: boolean;
  isFreeLooking: boolean;
  lean: number; // -1 (left) to 0 (center) to 1 (right)
  freeLookYawOffset: number;
  currentSpread: number; // shooting spread in degrees
  recoilPitch: number; // accumulated vertical recoil
  recoilYaw: number; // accumulated horizontal recoil
  cameraHeight: number; // lerped camera height for stance transitions
  lastFireTime: number;
  lastJumpTime: number;
  consecutiveShots: number;
  _collisionRatio?: number; // internal: tracks collision recovery progress
}
