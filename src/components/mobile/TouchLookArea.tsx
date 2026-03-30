// ============================================================
// TouchLookArea.tsx — 右半区触摸视角控制
// ============================================================

import React, { useRef, useCallback } from 'react';
import { touchInput } from '../../stores/touchStore';
import { TOUCH_SENSITIVITY, TOUCH_ADS_SENSITIVITY_MULTIPLIER } from '../../modules/player/constants';

/**
 * 右半区视角滑动控制
 * 覆盖屏幕右半区，touchmove 的 dx/dy 累积到 touchInput.lookDeltaX/Y
 * Player.tsx 的 useFrame 每帧读取并清零
 */
export const TouchLookArea: React.FC = React.memo(() => {
  const touchIdRef = useRef<number | null>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // 不阻止默认 — 允许按钮在此区域上层工作
    // 但阻止此事件继续向下传播到 canvas
    if (touchIdRef.current !== null) return; // 已有触点在追踪

    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    lastPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - lastPosRef.current.x;
        const dy = touch.clientY - lastPosRef.current.y;
        lastPosRef.current = { x: touch.clientX, y: touch.clientY };

        // 累积增量到全局触控输入
        const sens = TOUCH_SENSITIVITY * (touchInput.aim ? TOUCH_ADS_SENSITIVITY_MULTIPLIER : 1);
        touchInput.lookDeltaX += dx * sens;
        touchInput.lookDeltaY += dy * sens;
        break;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        break;
      }
    }
  }, []);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'absolute',
        // 覆盖屏幕右半区（但不要覆盖按钮层的 z-index）
        left: '40%',
        top: 0,
        width: '60%',
        height: '100%',
        pointerEvents: 'auto',
        touchAction: 'none',
        // 视觉上透明，仅用于捕获触摸
        zIndex: 1,
      }}
    />
  );
});

TouchLookArea.displayName = 'TouchLookArea';
