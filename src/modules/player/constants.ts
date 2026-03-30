// ============================================================
// constants.ts — 和平精英操作参数配置（基于 PUBG 真实数据）
// ============================================================

// --- 移动速度 (单位/秒, 1 unit ≈ 1m) ---
export const MOVE_SPEED = 4.7; // 站立奔跑
export const SPRINT_SPEED = 6.3; // 冲刺
export const CROUCH_SPEED = 3.4; // 蹲行
export const PRONE_SPEED = 1.2; // 匍匐

// 方向速度修饰
export const BACKWARD_MULTIPLIER = 0.7;
export const STRAFE_MULTIPLIER = 0.85;
export const ADS_MOVE_MULTIPLIER = 0.6;

// --- 鼠标灵敏度 ---
export const MOUSE_SENSITIVITY = 0.002;
export const ADS_SENSITIVITY_MULTIPLIER = 0.6; // 开镜时降低灵敏度

// --- 移动端触控灵敏度 ---
export const TOUCH_SENSITIVITY = 0.008; // 触摸滑动视角灵敏度（PC鼠标的4倍）
export const TOUCH_ADS_SENSITIVITY_MULTIPLIER = 0.5; // 触摸开镜灵敏度倍率
export const JOYSTICK_SPRINT_THRESHOLD = 0.85; // 摇杆推到多远触发冲刺

// --- 摄像机参数 ---
export const CAMERA = {
  // 默认TPP视角（越肩，PUBG风格紧凑构图）
  defaultDistance: 1.8,
  defaultHeight: 1.8,
  defaultRightOffset: 0.35,
  defaultLookAtHeight: 1.3,
  defaultFov: 70,
  defaultLerpSpeed: 0.08,

  // ADS 视角
  adsDistance: 1.2,
  adsHeight: 1.65,
  adsRightOffset: 0.35,
  adsLookAtHeight: 1.6,
  adsFov: 50,
  adsLerpSpeed: 0.2,

  // 冲刺
  sprintFovBoost: 5,

  // 视角俯仰限制
  pitchMin: -Math.PI / 3, // -60deg
  pitchMax: (Math.PI * 5) / 12, // +75deg

  // 碰撞参数
  collisionMinDistance: 0.3,
  collisionBuffer: 0.2,
} as const;

// --- 姿态 ---
export enum Stance {
  Standing = 'standing',
  Crouching = 'crouching',
  Prone = 'prone',
}

export const STANCE_CONFIG = {
  [Stance.Standing]: {
    colliderHalfHeight: 0.5,
    colliderRadius: 0.3,
    colliderOffset: 0.8, // collider center Y
    cameraHeight: 1.8,
    speedMultiplier: 1.0,
    canSprint: true,
    canJump: true,
    recoilReduction: 0,
    transitionTime: 0,
  },
  [Stance.Crouching]: {
    colliderHalfHeight: 0.3,
    colliderRadius: 0.3,
    colliderOffset: 0.6,
    cameraHeight: 1.2,
    speedMultiplier: 0.72,
    canSprint: true,
    canJump: true,
    recoilReduction: 0.15,
    transitionTime: 0.3,
  },
  [Stance.Prone]: {
    colliderHalfHeight: 0.15,
    colliderRadius: 0.3,
    colliderOffset: 0.25,
    cameraHeight: 0.5,
    speedMultiplier: 0.25,
    canSprint: false,
    canJump: false,
    recoilReduction: 0.3,
    transitionTime: 0.5,
  },
} as const;

// --- 探头 ---
export const LEAN = {
  maxAngle: 30 * (Math.PI / 180), // 30 degrees (larger body lean)
  headOffset: 0.325, // horizontal offset (half of previous)
  cameraDownOffset: 0.06, // slight downward camera shift when leaning
  lerpSpeed: 8, // per second (delta-time based)
} as const;

// --- 跳跃 ---
export const JUMP_IMPULSE = 3.5; // Lower jump height (PUBG-style grounded feel)
export const JUMP_COOLDOWN = 0.5;

// --- 射击 ---
export const SHOOTING = {
  fireRate: 680, // rounds per minute (M416)
  fireCooldown: 60 / 680,

  hipFire: {
    baseSpread: 0.6,
    moveSpreadBonus: 0.3,
    maxSpread: 1.6,
    recoveryRate: 5.0,
  },

  ads: {
    baseSpread: 0.06,
    moveSpreadBonus: 0.16,
    maxSpread: 0.4,
    recoveryRate: 8.0,
  },

  recoil: {
    verticalBase: 0.24,          // upward kick per shot (degrees)
    verticalAccumulation: 0,     // no increase on sustained fire — each shot feels the same
    horizontalRange: 0.36,       // random left/right jitter (degrees)
    recoverySpeed: 4.0,          // fast recovery
    stanceMultiplier: {
      [Stance.Standing]: 1.0,
      [Stance.Crouching]: 0.85,
      [Stance.Prone]: 0.7,
    },
  },
} as const;

// --- 后坐力 (骨骼视觉) ---
export const RECOIL_STRENGTH = 0.1;
export const RECOIL_DURATION = 150;

// --- 枪口火焰 ---
export const MUZZLE_FLASH_DURATION = 50;
export const MUZZLE_FLASH_LIGHT_INTENSITY = 15;
export const MUZZLE_FLASH_LIGHT_DISTANCE = 8;

// --- 自由视角 ---
export const FREE_LOOK = {
  maxYawOffset: (100 * Math.PI) / 180,
  returnLerpSpeed: 8, // per second
} as const;

// --- 射击模式 ---
export enum FireMode {
  Auto = 'auto',
  Single = 'single',
}

// --- 武器配置 ---
export interface WeaponConfig {
  name: string;
  fireRate: number;         // rounds per minute
  fireCooldown: number;     // seconds between shots
  magSize: number;          // magazine capacity
  reserveAmmo: number;      // starting reserve
  reloadTime: number;       // seconds to reload
  damage: number;
  recoilVertical: number;   // degrees per shot
  recoilHorizontal: number; // max random horizontal range (degrees)
  availableModes: FireMode[];
  sfx: string;              // sound effect file path (relative to public/)
}

export const WEAPONS: WeaponConfig[] = [
  {
    name: 'AKM',
    fireRate: 600,
    fireCooldown: 60 / 600,
    magSize: 30,
    reserveAmmo: 90,
    reloadTime: 2.4,
    damage: 36,
    recoilVertical: 0.30,
    recoilHorizontal: 0.45,
    availableModes: [FireMode.Auto, FireMode.Single],
    sfx: 'sfx/ak47-shot.mp3',
  },
  {
    name: 'M416',
    fireRate: 680,
    fireCooldown: 60 / 680,
    magSize: 30,
    reserveAmmo: 90,
    reloadTime: 2.1,
    damage: 31,
    recoilVertical: 0.24,
    recoilHorizontal: 0.36,
    availableModes: [FireMode.Auto, FireMode.Single],
    sfx: 'sfx/m416-shot.mp3',
  },

];

// --- 动画索引映射（Pro Rifle Pack 19 clips）---
export const ANIM = {
  // Standing (0-7)
  IDLE: 0,
  WALK_FORWARD: 1,
  WALK_BACKWARD: 2,
  STRAFE_LEFT: 3,
  STRAFE_RIGHT: 4,
  RUN_FORWARD: 5,
  RUN_BACKWARD: 6,
  SPRINT_FORWARD: 7,

  // Crouching (8-12)
  CROUCH_IDLE: 8,
  CROUCH_WALK_FORWARD: 9,
  CROUCH_WALK_BACKWARD: 10,
  CROUCH_STRAFE_LEFT: 11,
  CROUCH_STRAFE_RIGHT: 12,

  // Prone (13-15)
  PRONE_IDLE: 13,
  PRONE_FORWARD: 14,
  PRONE_BACKWARD: 15,

  // Jump (16-18)
  JUMP_UP: 16,
  JUMP_LOOP: 17,
  JUMP_DOWN: 18,
} as const;
