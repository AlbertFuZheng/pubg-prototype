import { useState, Suspense, Component, type ReactNode, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { HUD } from './components/HUD'
import { StartScreen } from './components/StartScreen'

// Error boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#1a1a1a', color: '#ff6b6b', fontFamily: 'monospace', padding: 40,
          zIndex: 9999,
        }}>
          <h2>⚠️ Runtime Error</h2>
          <pre style={{ color: '#ccc', maxWidth: '80%', overflow: 'auto', whiteSpace: 'pre-wrap' }}>{this.state.error}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '8px 24px', cursor: 'pointer' }}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

// Lazy load the physics scene
const PhysicsScene = lazy(() => import('./components/PhysicsScene'))

function LoadingScene() {
  return (
    <>
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[200, 1, 200]} />
        <meshStandardMaterial color="#5a7a4a" />
      </mesh>
      <gridHelper args={[200, 100, '#4a6a3a', '#4a6a3a']} position={[0, 0.01, 0]} />
    </>
  )
}

function App() {
  const [started, setStarted] = useState(false)

  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        {!started && <StartScreen onStart={() => setStarted(true)} />}
        {started && <HUD />}

        <Canvas
          shadows
          camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 5, 10] }}
          style={{ background: '#87CEEB' }}
          onPointerDown={(e) => {
            if (started) {
              (e.target as HTMLCanvasElement).requestPointerLock()
            }
          }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight
            castShadow
            position={[50, 50, 25]}
            intensity={1.5}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={100}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />

          <Sky sunPosition={[100, 50, 50]} />
          <fog attach="fog" args={['#87CEEB', 50, 200]} />

          <Suspense fallback={<LoadingScene />}>
            <PhysicsScene started={started} />
          </Suspense>
        </Canvas>
      </div>
    </ErrorBoundary>
  )
}

export default App
