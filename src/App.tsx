// ============================================================
// App.tsx — 主应用入口
// ============================================================

import React, { Suspense, useState, useCallback } from 'react';
import { KeyboardControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Player } from './components/Player';
import type { PlayerHUDState } from './components/Player';
import { Environment } from './components/Environment';
import { Crosshair } from './components/Crosshair';
import { HUD } from './components/HUD';
import { Stance, FireMode } from './modules/player/constants';

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

function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
        color: 'white',
        fontFamily: 'sans-serif',
        fontSize: 18,
        zIndex: 9999,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎮</div>
        <div>加载游戏资源中...</div>
        <div style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>首次加载可能需要几秒钟</div>
      </div>
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
  return (
    <Physics gravity={[0, -20, 0]} interpolate={true} timeStep="vary">
      <Environment />
      <Player position={[0, 2, 5]} onStateUpdate={onStateUpdate} />
    </Physics>
  );
}

export default function App() {
  const [hudState, setHudState] = useState<PlayerHUDState>(defaultHUDState);

  // Throttle HUD updates to ~30fps to avoid React re-render overhead
  const lastUpdateRef = React.useRef(0);
  const onStateUpdate = useCallback((state: PlayerHUDState) => {
    const now = performance.now();
    if (now - lastUpdateRef.current > 33) { // ~30fps
      lastUpdateRef.current = now;
      setHudState(state);
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden', background: '#000' }}>
      {/* HUD overlays — dynamic */}
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

      <KeyboardControls map={keyMap}>
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ fov: 75, near: 0.1, far: 1000 }}
          shadows
        >
          <ambientLight intensity={0.3} />
          <directionalLight
            color="#ffeedd"
            position={[10, 15, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
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
