// ============================================================
// VirtualJoystick.tsx — 和平精英风格虚拟摇杆
// ============================================================

import React, { useRef, useCallback } from 'react';
import { touchInput } from '../../stores/touchStore';
import { JOYSTICK_SPRINT_THRESHOLD } from '../../modules/player/constants';

const JOYSTICK_SIZE = 130; // 底座直径
const THUMB_SIZE = 56; // 拇指球直径
const MAX_DISTANCE = (JOYSTICK_SIZE - THUMB_SIZE) / 2; // 拇指球最大偏移

export const VirtualJoystick: React.FC = React.memo(() => {
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const thumbRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(distance, MAX_DISTANCE);
    const angle = Math.atan2(dy, dx);

    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    // 更新拇指球位置（用 transform，GPU 加速）
    if (thumbRef.current) {
      thumbRef.current.style.transform = `translate(${thumbX}px, ${thumbY}px)`;
    }

    // 归一化 -1~1
    const normalizedDist = clampedDist / MAX_DISTANCE;
    const nx = Math.cos(angle) * normalizedDist;
    const ny = Math.sin(angle) * normalizedDist;

    // 写入全局触控输入
    // 注意：摇杆 Y 轴向下为正，游戏中向前 = 摇杆向上 = ny 为负
    touchInput.joystickX = nx;
    touchInput.joystickY = -ny; // 翻转 Y 轴

    // 大幅推动摇杆触发冲刺
    touchInput.sprint = normalizedDist >= JOYSTICK_SPRINT_THRESHOLD;
  }, []);

  const resetJoystick = useCallback(() => {
    if (thumbRef.current) {
      thumbRef.current.style.transform = 'translate(0px, 0px)';
    }
    touchInput.joystickX = 0;
    touchInput.joystickY = 0;
    touchInput.sprint = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (touchIdRef.current !== null) return; // 已有触点

    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    // 以底座中心为参考
    if (baseRef.current) {
      const rect = baseRef.current.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    updateJoystick(touch.clientX, touch.clientY);
  }, [updateJoystick]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  }, [updateJoystick]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        resetJoystick();
        break;
      }
    }
  }, [resetJoystick]);

  return (
    <div
      ref={baseRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'absolute',
        left: 30,
        bottom: 30,
        width: JOYSTICK_SIZE,
        height: JOYSTICK_SIZE,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
        border: '2px solid rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        touchAction: 'none',
        zIndex: 10,
      }}
    >
      {/* 方向指示线 */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        pointerEvents: 'none',
      }}>
        {/* 上 */}
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '6px solid rgba(255,255,255,0.15)' }} />
        {/* 下 */}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '6px solid rgba(255,255,255,0.15)' }} />
        {/* 左 */}
        <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '6px solid rgba(255,255,255,0.15)' }} />
        {/* 右 */}
        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '6px solid rgba(255,255,255,0.15)' }} />
      </div>

      {/* 拇指球 */}
      <div
        ref={thumbRef}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.35), rgba(255,255,255,0.12))',
          border: '2px solid rgba(255,255,255,0.3)',
          willChange: 'transform',
          pointerEvents: 'none',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
});

VirtualJoystick.displayName = 'VirtualJoystick';
