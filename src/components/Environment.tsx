// ============================================================
// Environment.tsx — 训练场地图
// ============================================================

import { RigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

// Moving target
function MovingTarget({ position, color = '#e53e3e' }: { position: [number, number, number]; color?: string }) {
  const ref = useRef<any>();
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    if (ref.current) {
      const x = position[0] + Math.sin(t.current * 1.5) * 3;
      ref.current.setNextKinematicTranslation({ x, y: position[1], z: position[2] });
    }
  });

  return (
    <RigidBody ref={ref} position={position} type="kinematicPosition" colliders="cuboid">
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 2, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0, 0, 0.16]} fontSize={0.25} color="white" anchorX="center" anchorY="middle">
        TARGET
      </Text>
    </RigidBody>
  );
}

export function Environment() {
  return (
    <>
      {/* Ground */}
      <RigidBody position={[0, 0, 0]} type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#5a6e3a" />
        </mesh>
      </RigidBody>

      {/* --- Cover walls --- */}
      {/* Low wall (chest height cover) */}
      <RigidBody position={[8, 0.6, -8]} type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[6, 1.2, 0.5]} />
          <meshStandardMaterial color="#8b7355" />
        </mesh>
      </RigidBody>

      {/* Tall wall (full cover) */}
      <RigidBody position={[-8, 1.2, -8]} type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 2.4, 6]} />
          <meshStandardMaterial color="#6b6b6b" />
        </mesh>
      </RigidBody>

      {/* Crouch-only cover */}
      <RigidBody position={[0, 0.4, -15]} type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[8, 0.8, 0.5]} />
          <meshStandardMaterial color="#8b7355" />
        </mesh>
      </RigidBody>

      {/* --- Crates (dynamic, shootable) --- */}
      <RigidBody position={[5, 0.5, 3]} type="dynamic" friction={0.8} colliders="cuboid" mass={2}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#b8860b" />
        </mesh>
      </RigidBody>

      <RigidBody position={[6, 0.5, 3.5]} type="dynamic" friction={0.8} colliders="cuboid" mass={2}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#b8860b" />
        </mesh>
      </RigidBody>

      <RigidBody position={[5.5, 1.5, 3.2]} type="dynamic" friction={0.8} colliders="cuboid" mass={1}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#cd853f" />
        </mesh>
      </RigidBody>

      {/* --- Platforms for testing jump --- */}
      <RigidBody position={[15, 0.3, 0]} type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4, 0.3, 4]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
      </RigidBody>

      <RigidBody position={[15, 0.8, 5]} type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3, 0.3, 3]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
      </RigidBody>

      {/* --- Shooting range targets --- */}
      {/* Static targets */}
      <RigidBody position={[0, 1.5, -20]} type="dynamic" friction={0.3} colliders="cuboid" mass={0.1}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 2, 0.2]} />
          <meshStandardMaterial color="#ed8936" />
        </mesh>
        <Text position={[0, 0, 0.11]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
          10pt
        </Text>
      </RigidBody>

      <RigidBody position={[5, 1.5, -25]} type="dynamic" friction={0.3} colliders="cuboid" mass={0.1}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 2, 0.2]} />
          <meshStandardMaterial color="#ed8936" />
        </mesh>
        <Text position={[0, 0, 0.11]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
          25pt
        </Text>
      </RigidBody>

      <RigidBody position={[-5, 1.5, -25]} type="dynamic" friction={0.3} colliders="cuboid" mass={0.1}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 2, 0.2]} />
          <meshStandardMaterial color="#ed8936" />
        </mesh>
        <Text position={[0, 0, 0.11]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
          25pt
        </Text>
      </RigidBody>

      {/* Moving targets */}
      <MovingTarget position={[0, 1.5, -30]} />
      <MovingTarget position={[10, 1.5, -20]} color="#c53030" />

      {/* --- Building structure (simple room for camera collision testing) --- */}
      {/* Back wall */}
      <RigidBody position={[-15, 1.5, -5]} type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[8, 3, 0.3]} />
          <meshStandardMaterial color="#718096" />
        </mesh>
      </RigidBody>
      {/* Side walls */}
      <RigidBody position={[-19, 1.5, -1]} type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.3, 3, 8]} />
          <meshStandardMaterial color="#718096" />
        </mesh>
      </RigidBody>
      <RigidBody position={[-11, 1.5, -1]} type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.3, 3, 8]} />
          <meshStandardMaterial color="#718096" />
        </mesh>
      </RigidBody>
      {/* Roof */}
      <RigidBody position={[-15, 3, -1]} type="fixed" colliders="cuboid">
        <mesh receiveShadow>
          <boxGeometry args={[8.6, 0.3, 8.6]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
      </RigidBody>

      {/* --- Range distance markers --- */}
      {[10, 20, 30].map((d) => (
        <Text
          key={d}
          position={[0, 0.05, -d]}
          fontSize={1}
          color="#aaa"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {d}m
        </Text>
      ))}

      {/* --- Controls hint --- */}
      <Text
        position={[0, 0.05, 5]}
        fontSize={0.5}
        color="#888"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
        maxWidth={12}
      >
        {`WASD 移动 | Shift 冲刺 | Space 跳跃 | C 蹲 | Z 趴\nQ/E 探头 | 右键 瞄准 | 左键 射击 | Alt 自由视角`}
      </Text>
    </>
  );
}
