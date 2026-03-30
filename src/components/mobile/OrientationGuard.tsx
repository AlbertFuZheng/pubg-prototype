// ============================================================
// OrientationGuard.tsx — 竖屏旋转提示 + 全屏入口
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';

/**
 * 竖屏时显示旋转提示遮罩
 * 首次进入提供全屏触发按钮
 */
export const OrientationGuard: React.FC = React.memo(() => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [showEnterBtn, setShowEnterBtn] = useState(true);

  // 检测屏幕方向
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // 进入全屏 + 锁定横屏
  const enterFullscreen = useCallback(async () => {
    try {
      // 请求全屏
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      }

      // 尝试锁定横屏
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape');
        }
      } catch (e) {
        // 很多浏览器不支持 orientation.lock，忽略
        console.log('Orientation lock not supported:', e);
      }
    } catch (e) {
      console.log('Fullscreen not supported:', e);
    }

    setShowEnterBtn(false);
  }, []);

  // 竖屏提示
  if (isPortrait) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
        }}
      >
        {/* 旋转手机图标 */}
        <div
          style={{
            fontSize: 60,
            marginBottom: 20,
            animation: 'rotate-phone 2s ease-in-out infinite',
          }}
        >
          📱
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          请旋转手机至横屏
        </div>
        <div style={{ fontSize: 13, opacity: 0.5 }}>
          本游戏仅支持横屏操作
        </div>

        <style>{`
          @keyframes rotate-phone {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-90deg); }
            75% { transform: rotate(-90deg); }
          }
        `}</style>
      </div>
    );
  }

  // 全屏入口按钮（首次进入时显示）
  if (showEnterBtn) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99998,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
        }}
      >
        <div
          onClick={enterFullscreen}
          onTouchEnd={(e) => {
            e.preventDefault();
            enterFullscreen();
          }}
          style={{
            padding: '14px 36px',
            fontSize: 18,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
            borderRadius: 12,
            color: '#000',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(74, 222, 128, 0.3)',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          ▶ 点击进入游戏
        </div>
        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.4 }}>
          将以全屏横屏模式运行
        </div>
      </div>
    );
  }

  return null;
});

OrientationGuard.displayName = 'OrientationGuard';
