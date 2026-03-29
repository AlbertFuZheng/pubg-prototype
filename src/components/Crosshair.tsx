// ============================================================
// Crosshair.tsx — 和平精英风格动态准星 HUD
// ============================================================

import React from 'react';

interface CrosshairProps {
  spread: number; // 0-8 degrees
  isAiming: boolean;
}

export const Crosshair: React.FC<CrosshairProps> = ({ spread, isAiming }) => {
  // Map spread (degrees) to pixel offset
  const baseOffset = isAiming ? 4 : 12;
  const spreadPx = baseOffset + spread * 3;

  const lineLen = isAiming ? 8 : 12;
  const lineThick = 2;
  const color = 'rgba(255, 255, 255, 0.9)';
  const shadow = '0 0 2px rgba(0,0,0,0.8)';

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 1000,
  };

  // Center dot
  const dotStyle: React.CSSProperties = {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: '50%',
    backgroundColor: color,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    boxShadow: shadow,
  };

  // Common line style
  const lineBase: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: color,
    boxShadow: shadow,
  };

  // Top line
  const topStyle: React.CSSProperties = {
    ...lineBase,
    width: lineThick,
    height: lineLen,
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: `calc(50% + ${spreadPx}px)`,
  };

  // Bottom line
  const bottomStyle: React.CSSProperties = {
    ...lineBase,
    width: lineThick,
    height: lineLen,
    left: '50%',
    transform: 'translateX(-50%)',
    top: `calc(50% + ${spreadPx}px)`,
  };

  // Left line
  const leftStyle: React.CSSProperties = {
    ...lineBase,
    width: lineLen,
    height: lineThick,
    top: '50%',
    transform: 'translateY(-50%)',
    right: `calc(50% + ${spreadPx}px)`,
  };

  // Right line
  const rightStyle: React.CSSProperties = {
    ...lineBase,
    width: lineLen,
    height: lineThick,
    top: '50%',
    transform: 'translateY(-50%)',
    left: `calc(50% + ${spreadPx}px)`,
  };

  return (
    <div style={containerStyle}>
      <div style={dotStyle} />
      <div style={topStyle} />
      <div style={bottomStyle} />
      <div style={leftStyle} />
      <div style={rightStyle} />
    </div>
  );
};
