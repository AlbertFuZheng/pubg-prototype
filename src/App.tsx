import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Sky } from '@react-three/drei'
import { Player } from './components/Player'
import { GameWorld } from './components/GameWorld'
import { HUD } from './components/HUD'
import { StartScreen } from './components/StartScreen'

function App() {
  const [started, setStarted] = useState(false)

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {!started && <StartScreen onStart={() => setStarted(true)} />}
      {started && <HUD />}

      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        style={{ background: '#87CEEB' }}
        onPointerDown={(e) => {
          if (started) {
            (e.target as HTMLCanvasElement).requestPointerLock()
          }
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          castShadow
          position={[50, 50, 25]}
          intensity={1.5}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />

        {/* Sky */}
        <Sky sunPosition={[100, 50, 50]} />
        <fog attach="fog" args={['#87CEEB', 50, 200]} />

        <Suspense fallback={null}>
          <Physics gravity={[0, -15, 0]}>
            {started && <Player />}
            <GameWorld />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  )
}

export default App
