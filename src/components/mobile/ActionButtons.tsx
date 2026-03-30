// ============================================================
// ActionButtons.tsx — 和平精英风格操作按钮组
// ============================================================
// 布局参考和平精英默认设置：
// - 右下角：大射击按钮 + 开镜按钮
// - 右侧中间：跳跃、蹲下、趴下（纵向排列）
// - 左半区摇杆右上方：左侧射击按钮
// - 底部中间偏右：换弹按钮
// - 右上角：武器切换按钮

import React, { useCallback, useRef } from 'react';
import { touchInput } from '../../stores/touchStore';

// ---- 通用触摸按钮 Hook ----
function useTouchButton(
  onDown: () => void,
  onUp: () => void,
) {
  const touchIdRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (touchIdRef.current !== null) return;
    touchIdRef.current = e.changedTouches[0].identifier;
    onDown();
  }, [onDown]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        onUp();
        break;
      }
    }
  }, [onUp]);

  return { handleTouchStart, handleTouchEnd };
}

// ---- 通用圆形按钮样式 ----
const circleButton = (
  size: number,
  bg: string = 'rgba(255,255,255,0.12)',
  border: string = 'rgba(255,255,255,0.25)',
): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: '50%',
  background: bg,
  border: `2px solid ${border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255,255,255,0.8)',
  fontSize: size > 50 ? 14 : 11,
  fontWeight: 600,
  fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
  pointerEvents: 'auto',
  touchAction: 'none',
  WebkitTapHighlightColor: 'transparent',
  userSelect: 'none',
  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  transition: 'background 0.1s',
});

// ---- 射击按钮（右下角大按钮）----
const FireButtonRight: React.FC = React.memo(() => {
  const { handleTouchStart, handleTouchEnd } = useTouchButton(
    () => { touchInput.fire = true; },
    () => { touchInput.fire = false; },
  );

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        ...circleButton(72, 'rgba(255, 60, 60, 0.25)', 'rgba(255, 80, 80, 0.5)'),
        position: 'absolute',
        right: 30,
        bottom: 80,
        zIndex: 20,
        boxShadow: '0 0 15px rgba(255, 60, 60, 0.2)',
      }}
    >
      <div style={{ fontSize: 22, lineHeight: 1 }}>🔫</div>
    </div>
  );
});
FireButtonRight.displayName = 'FireButtonRight';

// ---- 射击按钮（左侧，摇杆右上方）----
const FireButtonLeft: React.FC = React.memo(() => {
  const { handleTouchStart, handleTouchEnd } = useTouchButton(
    () => { touchInput.fire = true; },
    () => { touchInput.fire = false; },
  );

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        ...circleButton(60, 'rgba(255, 60, 60, 0.2)', 'rgba(255, 80, 80, 0.4)'),
        position: 'absolute',
        left: 170,
        bottom: 110,
        zIndex: 20,
      }}
    >
      <div style={{ fontSize: 18, lineHeight: 1 }}>🔫</div>
    </div>
  );
});
FireButtonLeft.displayName = 'FireButtonLeft';

// ---- 开镜按钮 ----
const AimButton: React.FC = React.memo(() => {
  const { handleTouchStart, handleTouchEnd } = useTouchButton(
    () => { touchInput.aim = true; },
    () => { touchInput.aim = false; },
  );

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        ...circleButton(56, 'rgba(100, 180, 255, 0.2)', 'rgba(100, 180, 255, 0.4)'),
        position: 'absolute',
        right: 110,
        bottom: 80,
        zIndex: 20,
      }}
    >
      <div style={{ fontSize: 12 }}>开镜</div>
    </div>
  );
});
AimButton.displayName = 'AimButton';

// ---- 跳跃按钮 ----
const JumpButton: React.FC = React.memo(() => {
  const { handleTouchStart, handleTouchEnd } = useTouchButton(
    () => { touchInput.jump = true; },
    () => { touchInput.jump = false; },
  );

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        ...circleButton(48, 'rgba(255, 220, 100, 0.15)', 'rgba(255, 220, 100, 0.3)'),
        position: 'absolute',
        right: 25,
        bottom: 175,
        zIndex: 20,
      }}
    >
      <div style={{ fontSize: 11 }}>跳</div>
    </div>
  );
});
JumpButton.displayName = 'JumpButton';

// ---- 蹲下按钮 ----
const CrouchButton: React.FC = React.memo(() => {
  // 蹲下是 toggle，按一下触发，松开不还原
  const handleDown = useCallback(() => {
    touchInput.crouch = true;
    // 100ms 后自动释放（Player.tsx 的 edge detect 会读到一次 true→false）
    setTimeout(() => { touchInput.crouch = false; }, 100);
  }, []);
  const handleUp = useCallback(() => {}, []);
  const { handleTouchStart, handleTouchEnd } = useTouchButton(handleDown, handleUp);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        ...circleButton(48, 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)'),
        position: 'absolute',
        right: 25,
        bottom: 235,
        zIndex: 20,
      }}
    >
      <div style={{ fontSize: 11 }}>蹲</div>
    </div>
  );
});
CrouchButton.displayName = 'CrouchButton';

// ---- 趴下按钮 ----
const ProneButton: React.FC = React.memo(() => {
  const handleDown = useCallback(() => {
    touchInput.prone = true;
    setTimeout(() => { touchInput.prone = false; }, 100);
  }, []);
  const handleUp = useCallback(() => {}, []);
  const { handleTouchStart, handleTouchEnd } = useTouchButton(handleDown, handleUp);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        ...circleButton(48, 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)'),
        position: 'absolute',
        right: 25,
        bottom: 295,
        zIndex: 20,
      }}
    >
      <div style={{ fontSize: 11 }}>趴</div>
    </div>
  );
});
ProneButton.displayName = 'ProneButton';

// ---- 换弹按钮 ----
const ReloadButton: React.FC = React.memo(() => {
  const handleDown = useCallback(() => {
    touchInput.reload = true;
    setTimeout(() => { touchInput.reload = false; }, 100);
  }, []);
  const handleUp = useCallback(() => {}, []);
  const { handleTouchStart, handleTouchEnd } = useTouchButton(handleDown, handleUp);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        ...circleButton(44, 'rgba(100, 255, 100, 0.15)', 'rgba(100, 255, 100, 0.3)'),
        position: 'absolute',
        right: 185,
        bottom: 30,
        zIndex: 20,
      }}
    >
      <div style={{ fontSize: 10 }}>换弹</div>
    </div>
  );
});
ReloadButton.displayName = 'ReloadButton';

// ---- 武器切换按钮组 ----
const WeaponSwitchButtons: React.FC = React.memo(() => {
  const switchTo = useCallback((slot: number) => {
    touchInput.weaponSlot = slot;
  }, []);

  return (
    <div style={{
      position: 'absolute',
      right: 15,
      top: 15,
      display: 'flex',
      gap: 8,
      zIndex: 20,
      pointerEvents: 'auto',
    }}>
      {['AKM', 'M416'].map((name, i) => (
        <div
          key={name}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            switchTo(i);
          }}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'auto',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
          }}
        >
          {i + 1}. {name}
        </div>
      ))}
    </div>
  );
});
WeaponSwitchButtons.displayName = 'WeaponSwitchButtons';

// ---- 射击模式切换按钮 ----
const FireModeButton: React.FC = React.memo(() => {
  const handleDown = useCallback(() => {
    touchInput.fireModeToggle = true;
  }, []);
  const handleUp = useCallback(() => {}, []);
  const { handleTouchStart, handleTouchEnd } = useTouchButton(handleDown, handleUp);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        ...circleButton(40, 'rgba(255, 180, 50, 0.15)', 'rgba(255, 180, 50, 0.3)'),
        position: 'absolute',
        right: 120,
        bottom: 30,
        zIndex: 20,
      }}
    >
      <div style={{ fontSize: 9 }}>模式</div>
    </div>
  );
});
FireModeButton.displayName = 'FireModeButton';

// ---- 总按钮组容器 ----
export const ActionButtons: React.FC = React.memo(() => {
  return (
    <>
      <FireButtonRight />
      <FireButtonLeft />
      <AimButton />
      <JumpButton />
      <CrouchButton />
      <ProneButton />
      <ReloadButton />
      <WeaponSwitchButtons />
      <FireModeButton />
    </>
  );
});

ActionButtons.displayName = 'ActionButtons';
