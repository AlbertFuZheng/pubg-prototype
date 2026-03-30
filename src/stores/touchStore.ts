// ============================================================
// touchStore.ts — 移动端触控输入 store（桥接触控 UI → Player.tsx）
// ============================================================

import { create } from 'zustand';

/**
 * 触控输入数据（通过 ref 传递，不触发 re-render）
 */
export interface TouchInputData {
  // 虚拟摇杆 (归一化 -1~1)
  joystickX: number;
  joystickY: number;
  // 视角增量 (每帧累积的像素增量，useFrame 中读取后清零)
  lookDeltaX: number;
  lookDeltaY: number;
  // 按钮持续状态
  fire: boolean;
  aim: boolean;
  jump: boolean;
  crouch: boolean;
  prone: boolean;
  reload: boolean;
  sprint: boolean;
  // 武器切换 (-1=无操作, 0/1=切武器)
  weaponSlot: number;
  // 射击模式切换 (单次触发)
  fireModeToggle: boolean;
}

/** 创建默认触控输入数据 */
function createDefaultTouchInput(): TouchInputData {
  return {
    joystickX: 0,
    joystickY: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    fire: false,
    aim: false,
    jump: false,
    crouch: false,
    prone: false,
    reload: false,
    sprint: false,
    weaponSlot: -1,
    fireModeToggle: false,
  };
}

/**
 * 全局触控输入 ref（不走 Zustand 响应式，直接读写，零开销）
 */
export const touchInput: TouchInputData = createDefaultTouchInput();

/**
 * 消费视角增量（Player.tsx 每帧调用）
 * 返回当前积累的增量并清零
 */
export function consumeLookDelta(): { dx: number; dy: number } {
  const dx = touchInput.lookDeltaX;
  const dy = touchInput.lookDeltaY;
  touchInput.lookDeltaX = 0;
  touchInput.lookDeltaY = 0;
  return { dx, dy };
}

/**
 * 消费武器切换（Player.tsx 每帧调用）
 */
export function consumeWeaponSlot(): number {
  const slot = touchInput.weaponSlot;
  touchInput.weaponSlot = -1;
  return slot;
}

/**
 * 消费射击模式切换
 */
export function consumeFireModeToggle(): boolean {
  const toggle = touchInput.fireModeToggle;
  touchInput.fireModeToggle = false;
  return toggle;
}

/**
 * 触控 store（响应式部分：设备检测、UI 状态）
 */
interface TouchStoreState {
  isMobile: boolean;
  setIsMobile: (v: boolean) => void;
}

export const useTouchStore = create<TouchStoreState>((set) => ({
  isMobile: false,
  setIsMobile: (v) => set({ isMobile: v }),
}));

/**
 * 检测是否为移动触屏设备（排除触屏笔记本/PC）
 */
export function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 首先检查 UA 中是否有明确的移动端标识
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // iPad 的 Safari 在新版本中 UA 伪装成 Mac，需要特殊检测
  const isIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  
  // 有触摸能力且 UA 是移动设备，或者是 iPad
  const hasTouchCapability = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // 最终判断：必须有 UA 标识 或 iPad 才算移动端
  // 不能单靠 ontouchstart，因为触屏笔记本也有这个
  return (mobileUA || isIPad) && hasTouchCapability;
}
