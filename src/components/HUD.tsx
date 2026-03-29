// ============================================================
// HUD.tsx — 游戏状态 HUD（姿态、弹药等）
// ============================================================

import React from 'react';
import type { Stance } from '../modules/player/constants';

interface HUDProps {
  stance: Stance;
  isAiming: boolean;
  isSprinting: boolean;
}

const stanceLabels: Record<string, string> = {
  standing: '站立',
  crouching: '蹲下',
  prone: '趴下',
};

export const HUD: React.FC<HUDProps> = ({ stance, isAiming, isSprinting }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: 14,
        pointerEvents: 'none',
        zIndex: 1000,
        textShadow: '0 0 4px rgba(0,0,0,0.8)',
        lineHeight: 1.6,
        textAlign: 'right',
      }}
    >
      <div>姿态: {stanceLabels[stance] ?? stance}</div>
      {isAiming && <div style={{ color: '#ff4444' }}>● 瞄准中</div>}
      {isSprinting && <div style={{ color: '#44ff44' }}>● 冲刺中</div>}
    </div>
  );
};
