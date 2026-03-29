// ============================================================
// HUD.tsx — 游戏状态 HUD（武器、弹药、姿态、射击模式）
// ============================================================

import React from 'react';
import { Stance, FireMode } from '../modules/player/constants';

export interface HUDProps {
  stance: Stance;
  isAiming: boolean;
  isSprinting: boolean;
  weaponName: string;
  ammo: number;
  magSize: number;
  reserveAmmo: number;
  isReloading: boolean;
  fireMode: FireMode;
}

const stanceLabels: Record<string, string> = {
  standing: '站立',
  crouching: '蹲下',
  prone: '趴下',
};

const fireModeLabels: Record<string, string> = {
  auto: '全自动',
  single: '单发',
};

export const HUD: React.FC<HUDProps> = ({
  stance,
  isAiming,
  isSprinting,
  weaponName,
  ammo,
  magSize,
  reserveAmmo,
  isReloading,
  fireMode,
}) => {
  const ammoLow = ammo <= Math.ceil(magSize * 0.2);
  const ammoEmpty = ammo <= 0;

  return (
    <>
      {/* Bottom-right: Weapon & Ammo */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          pointerEvents: 'none',
          zIndex: 1000,
          textAlign: 'right',
          fontFamily: '"Courier New", monospace',
        }}
      >
        {/* Weapon name + fire mode */}
        <div style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 13,
          marginBottom: 4,
          letterSpacing: 1,
        }}>
          {weaponName} | {fireModeLabels[fireMode] ?? fireMode}
        </div>

        {/* Ammo counter */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'flex-end',
          gap: 4,
        }}>
          <span style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: ammoEmpty ? '#ff3333' : ammoLow ? '#ffaa33' : 'white',
            textShadow: '0 0 8px rgba(0,0,0,0.8)',
            lineHeight: 1,
          }}>
            {ammo}
          </span>
          <span style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.5)',
          }}>
            / {reserveAmmo}
          </span>
        </div>

        {/* Reload indicator */}
        {isReloading && (
          <div style={{
            color: '#ffcc00',
            fontSize: 14,
            marginTop: 4,
            animation: 'pulse 0.8s infinite',
          }}>
            换弹中...
          </div>
        )}

        {/* Weapon slots */}
        <div style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'flex-end',
          marginTop: 8,
        }}>
          {['AKM', 'M416', 'AWM'].map((name, i) => (
            <div
              key={name}
              style={{
                padding: '2px 8px',
                fontSize: 11,
                border: name === weaponName ? '1px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: 3,
                color: name === weaponName ? 'white' : 'rgba(255,255,255,0.4)',
                background: name === weaponName ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
            >
              {i + 1}. {name}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom-left: Stance & status */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          color: 'white',
          fontFamily: 'monospace',
          fontSize: 13,
          pointerEvents: 'none',
          zIndex: 1000,
          textShadow: '0 0 4px rgba(0,0,0,0.8)',
          lineHeight: 1.6,
        }}
      >
        <div style={{ opacity: 0.7 }}>{stanceLabels[stance] ?? stance}</div>
        {isAiming && <div style={{ color: '#ff6666' }}>● 瞄准</div>}
        {isSprinting && <div style={{ color: '#66ff66' }}>● 冲刺</div>}
      </div>

      {/* Pulse animation for reload */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
};
