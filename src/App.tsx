// ============================================================
// App.tsx — 主应用入口
// ============================================================

import React, { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { KeyboardControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Player } from './components/Player';
import type { PlayerHUDState } from './components/Player';
import { Environment } from './components/Environment';
import { Crosshair } from './components/Crosshair';
import { HUD } from './components/HUD';
import { BulletEffects } from './components/BulletEffects';
import type { BulletEffectsAPI } from './components/BulletEffects';
import { Stance, FireMode } from './modules/player/constants';
import { MobileControls } from './components/mobile/MobileControls';
import { OrientationGuard } from './components/mobile/OrientationGuard';
import { detectMobile, useTouchStore } from './stores/touchStore';

// Keyboard mapping (和平精英 PC端 默认按键)
const keyMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'sprint', keys: ['ShiftLeft', 'ShiftRight'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'crouch', keys: ['KeyC'] },
  { name: 'prone', keys: ['KeyZ'] },
  { name: 'leanLeft', keys: ['KeyQ'] },
  { name: 'leanRight', keys: ['KeyE'] },
  { name: 'freeLook', keys: ['AltLeft', 'AltRight'] },
  { name: 'reload', keys: ['KeyR'] },
];

// ---- Loading screen with progress bar ----
function LoadingScreen({ onReady }: { onReady: () => void }) {
  const [progress, setProgress] = useState(0);
  const [item, setItem] = useState('');
  const [fadeOut, setFadeOut] = useState(false);
  const readyFired = useRef(false);

  useEffect(() => {
    const mgr = THREE.DefaultLoadingManager;

    mgr.onProgress = (_url, loaded, total) => {
      const pct = total > 0 ? (loaded / total) * 100 : 0;
      setProgress(pct);
      // Show friendly filename
      const name = _url.split('/').pop() ?? _url;
      setItem(name);
    };

    mgr.onLoad = () => {
      setProgress(100);
      setItem('');
      // Short delay then fade out
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          if (!readyFired.current) {
            readyFired.current = true;
            onReady();
          }
        }, 600); // match CSS transition
      }, 300);
    };

    // Fallback: if nothing to load (all cached), auto-complete after 1.5s
    const fallbackTimer = setTimeout(() => {
      if (!readyFired.current) {
        setProgress(100);
        setFadeOut(true);
        setTimeout(() => {
          if (!readyFired.current) {
            readyFired.current = true;
            onReady();
          }
        }, 600);
      }
    }, 8000);

    return () => {
      clearTimeout(fallbackTimer);
      mgr.onProgress = () => {};
      mgr.onLoad = () => {};
    };
  }, [onReady]);

  const displayPct = Math.round(progress);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
        color: 'white',
        fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Title */}
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, letterSpacing: 2 }}>
        PUBG PROTOTYPE
      </div>
      <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 40 }}>
        和平精英操作手感复刻
      </div>

      {/* Progress bar container */}
      <div
        style={{
          width: 320,
          height: 6,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Filled bar */}
        <div
          style={{
            width: `${displayPct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4ade80, #22d3ee)',
            borderRadius: 3,
            transition: 'width 0.3s ease-out',
          }}
        />
        {/* Shimmer effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      </div>

      {/* Percentage */}
      <div style={{ marginTop: 14, fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {displayPct}%
      </div>

      {/* Current loading item */}
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          opacity: 0.4,
          height: 16,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 300,
        }}
      >
        {item ? `加载 ${item}` : displayPct >= 100 ? '准备就绪' : '加载游戏资源中...'}
      </div>

      {/* Hint */}
      <div style={{ marginTop: 24, fontSize: 11, opacity: 0.3 }}>
        首次访问可能需要几秒钟
      </div>

      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

const defaultHUDState: PlayerHUDState = {
  stance: Stance.Standing,
  isAiming: false,
  isSprinting: false,
  weaponName: 'M416',
  ammo: 30,
  magSize: 30,
  reserveAmmo: 90,
  isReloading: false,
  fireMode: FireMode.Auto,
  spread: 3,
};

function PhysicsScene({ onStateUpdate }: { onStateUpdate: (s: PlayerHUDState) => void }) {
  const bulletEffectsRef = useRef<BulletEffectsAPI>(null);

  return (
    <Physics gravity={[0, -20, 0]} interpolate={true} timeStep="vary">
      <Environment />
      <Player position={[0, 2, 5]} onStateUpdate={onStateUpdate} bulletEffectsRef={bulletEffectsRef} />
      <BulletEffects ref={bulletEffectsRef} />
    </Physics>
  );
}

export default function App() {
  const [hudState, setHudState] = useState<PlayerHUDState>(defaultHUDState);
  const [loading, setLoading] = useState(true);
  const isMobile = useTouchStore((s) => s.isMobile);
  const setIsMobile = useTouchStore((s) => s.setIsMobile);

  // 设备检测（初始化一次）
  useEffect(() => {
    setIsMobile(detectMobile());
  }, [setIsMobile]);

  // Throttle HUD updates to ~30fps to avoid React re-render overhead
  const lastUpdateRef = React.useRef(0);
  const onStateUpdate = useCallback((state: PlayerHUDState) => {
    const now = performance.now();
    if (now - lastUpdateRef.current > 33) { // ~30fps
      lastUpdateRef.current = now;
      setHudState(state);
    }
  }, []);

  const handleLoadingReady = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden', background: '#000' }}>
      {/* Loading overlay */}
      {loading && <LoadingScreen onReady={handleLoadingReady} />}

      {/* 移动端：横屏守卫 + 全屏入口 */}
      {isMobile && !loading && <OrientationGuard />}

      {/* 移动端：触控 UI */}
      {isMobile && !loading && <MobileControls />}

      {/* PC 端 HUD — 只在非移动端且加载完成后显示 */}
      {!loading && !isMobile && (
        <>
          <Crosshair spread={hudState.spread} isAiming={hudState.isAiming} />
          <HUD
            stance={hudState.stance}
            isAiming={hudState.isAiming}
            isSprinting={hudState.isSprinting}
            weaponName={hudState.weaponName}
            ammo={hudState.ammo}
            magSize={hudState.magSize}
            reserveAmmo={hudState.reserveAmmo}
            isReloading={hudState.isReloading}
            fireMode={hudState.fireMode}
          />

          {/* Controls help (top-left) */}
          <div
            style={{
              position: 'fixed',
              top: 10,
              left: 10,
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'monospace',
              fontSize: 11,
              lineHeight: 1.5,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            点击画面锁定鼠标 | ESC 解锁
          </div>
        </>
      )}

      {/* 移动端：简化 HUD（武器信息+准星）*/}
      {!loading && isMobile && (
        <>
          <Crosshair spread={hudState.spread} isAiming={hudState.isAiming} />
          {/* 移动端顶部武器信息条 */}
          <div
            style={{
              position: 'fixed',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 90,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: "'PingFang SC', 'Microsoft YaHei', monospace",
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}
          >
            <span style={{ fontWeight: 600 }}>{hudState.weaponName}</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>{hudState.fireMode === FireMode.Auto ? '全自动' : '单发'}</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>∞</span>
          </div>
        </>
      )}

      <KeyboardControls map={keyMap}>
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ fov: isMobile ? 55 : 75, near: 0.1, far: 1000 }}
          shadows={isMobile ? { type: THREE.BasicShadowMap } : true}
        >
          <ambientLight intensity={0.3} />
          <directionalLight
            color="#ffeedd"
            position={[10, 15, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={isMobile ? 1024 : 2048}
            shadow-mapSize-height={isMobile ? 1024 : 2048}
            shadow-camera-far={60}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-bias={-0.0001}
          />
          <directionalLight color="#aaccff" position={[-5, 8, -10]} intensity={0.3} />
          <fog attach="fog" args={['#87CEEB', 40, 80]} />

          {/* Sky color */}
          <color attach="background" args={['#87CEEB']} />

          <Suspense fallback={null}>
            <PhysicsScene onStateUpdate={onStateUpdate} />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
