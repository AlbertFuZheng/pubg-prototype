// ============================================================
// MobileControls.tsx — 移动端触控 UI 总容器
// ============================================================
// 组合：虚拟摇杆 + 视角滑动区 + 操作按钮
// 作为 fixed 定位全屏覆盖层

import React from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import { TouchLookArea } from './TouchLookArea';
import { ActionButtons } from './ActionButtons';

export const MobileControls: React.FC = React.memo(() => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'none', // 容器不拦截，子组件各自 pointerEvents: auto
        overflow: 'hidden',
      }}
    >
      {/* 右半区视角滑动（最底层，z-index 最低）*/}
      <TouchLookArea />

      {/* 虚拟摇杆 */}
      <VirtualJoystick />

      {/* 所有操作按钮 */}
      <ActionButtons />
    </div>
  );
});

MobileControls.displayName = 'MobileControls';
