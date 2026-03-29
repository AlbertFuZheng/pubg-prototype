import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

export function GameWorld() {
  return (
    <>
      {/* Ground */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[200, 1, 200]} />
          <meshStandardMaterial color="#5a7a4a" />
        </mesh>
      </RigidBody>

      {/* Grid overlay on ground */}
      <gridHelper args={[200, 100, '#4a6a3a', '#4a6a3a']} position={[0, 0.01, 0]} />

      {/* Walls / Cover objects */}
      {/* Long wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[5, 1, -8]}>
          <boxGeometry args={[8, 2, 0.3]} />
          <meshStandardMaterial color="#8B8682" />
        </mesh>
      </RigidBody>

      {/* Short cover */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[-3, 0.5, -5]}>
          <boxGeometry args={[2, 1, 2]} />
          <meshStandardMaterial color="#7B7B7B" />
        </mesh>
      </RigidBody>

      {/* Tall pillar */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[8, 2, 3]}>
          <boxGeometry args={[1, 4, 1]} />
          <meshStandardMaterial color="#6B6B6B" />
        </mesh>
      </RigidBody>

      {/* Building structure */}
      <Building position={[15, 0, -15]} />
      <Building position={[-15, 0, 10]} />

      {/* Crates cluster */}
      <CrateCluster position={[-8, 0, -12]} />
      <CrateCluster position={[10, 0, 8]} />

      {/* Barrels */}
      <Barrel position={[3, 0, 5]} />
      <Barrel position={[3.8, 0, 5.5]} />
      <Barrel position={[-6, 0, 2]} />

      {/* Sandbag walls */}
      <SandbagWall position={[0, 0, -15]} rotation={0} />
      <SandbagWall position={[-10, 0, -3]} rotation={Math.PI / 2} />

      {/* Trees (simple cylinders + spheres) */}
      <Tree position={[20, 0, 5]} />
      <Tree position={[-18, 0, -8]} />
      <Tree position={[12, 0, 18]} />
      <Tree position={[-5, 0, 20]} />
      <Tree position={[25, 0, -20]} />
    </>
  )
}

function Building({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[8, 0.2, 8]} />
          <meshStandardMaterial color="#9B9B9B" />
        </mesh>
      </RigidBody>

      {/* Walls */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[-3.9, 1.5, 0]}>
          <boxGeometry args={[0.2, 3, 8]} />
          <meshStandardMaterial color="#A0A0A0" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[3.9, 1.5, 0]}>
          <boxGeometry args={[0.2, 3, 8]} />
          <meshStandardMaterial color="#A0A0A0" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 1.5, -3.9]}>
          <boxGeometry args={[8, 3, 0.2]} />
          <meshStandardMaterial color="#A0A0A0" />
        </mesh>
      </RigidBody>
      {/* Front wall with gap (door) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[-2.5, 1.5, 3.9]}>
          <boxGeometry args={[3, 3, 0.2]} />
          <meshStandardMaterial color="#A0A0A0" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[2.5, 1.5, 3.9]}>
          <boxGeometry args={[3, 3, 0.2]} />
          <meshStandardMaterial color="#A0A0A0" />
        </mesh>
      </RigidBody>

      {/* Second floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 3.1, 0]}>
          <boxGeometry args={[8, 0.2, 8]} />
          <meshStandardMaterial color="#9B9B9B" />
        </mesh>
      </RigidBody>
    </group>
  )
}

function CrateCluster({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#8B6914" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[1.1, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#9B7924" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0.5, 1.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#7B5904" />
        </mesh>
      </RigidBody>
    </group>
  )
}

function Barrel({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh castShadow receiveShadow position={[position[0], position[1] + 0.6, position[2]]}>
        <cylinderGeometry args={[0.35, 0.4, 1.2, 12]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
    </RigidBody>
  )
}

function SandbagWall({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[0, 0.35, 0.7].map((y, i) => (
        <RigidBody key={i} type="fixed" colliders="cuboid">
          <mesh castShadow receiveShadow position={[0, y + 0.2, 0]}>
            <boxGeometry args={[3, 0.35, 0.6]} />
            <meshStandardMaterial color={new THREE.Color().setHSL(0.1, 0.3, 0.35 + i * 0.03)} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  )
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 3, 8]} />
        <meshStandardMaterial color="#5C4033" />
      </mesh>
      {/* Foliage */}
      <mesh castShadow position={[0, 3.5, 0]}>
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshStandardMaterial color="#2D5A1E" />
      </mesh>
    </group>
  )
}
