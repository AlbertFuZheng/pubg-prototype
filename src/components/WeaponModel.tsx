import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'

interface WeaponModelProps {
  isAiming: boolean
}

export function WeaponModel({ isAiming: _isAiming }: WeaponModelProps) {
  const meshRef = useRef<THREE.Group>(null)
  const recoilRef = useRef(0)
  const reloadAnimRef = useRef(0)

  useFrame((_state, delta) => {
    if (!meshRef.current) return

    const store = useGameStore.getState()

    // Recoil animation
    if (store.isFiring) {
      recoilRef.current = 0.15
    }
    recoilRef.current *= 0.85

    // Reload animation
    if (store.isReloading) {
      reloadAnimRef.current = Math.min(1, reloadAnimRef.current + delta * 2)
    } else {
      reloadAnimRef.current *= 0.9
    }

    // Weapon position: right side, slightly down and forward
    const aimLerp = store.isAiming ? 0.0 : 1.0

    meshRef.current.position.set(
      0.25 * aimLerp + 0.05,
      -0.15 - recoilRef.current * 0.5 - reloadAnimRef.current * 0.3,
      -0.5 + recoilRef.current
    )
    meshRef.current.rotation.set(
      -recoilRef.current * 0.3 + reloadAnimRef.current * 0.5,
      reloadAnimRef.current * 0.8,
      0
    )
  })

  const store = useGameStore.getState()
  const weaponLengths = [0.8, 0.75, 1.1]
  const weaponColors = ['#8B7355', '#5C5C5C', '#2F4F2F']
  const idx = store.currentWeapon

  return (
    <group ref={meshRef}>
      {/* Gun body */}
      <mesh castShadow position={[0, 0, -0.2]}>
        <boxGeometry args={[0.06, 0.08, weaponLengths[idx]]} />
        <meshStandardMaterial color={weaponColors[idx]} />
      </mesh>
      {/* Barrel */}
      <mesh castShadow position={[0, 0.01, -0.2 - weaponLengths[idx] / 2 - 0.15]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* Stock */}
      <mesh castShadow position={[0, -0.02, 0.2]}>
        <boxGeometry args={[0.04, 0.1, 0.25]} />
        <meshStandardMaterial color={weaponColors[idx]} />
      </mesh>
      {/* Magazine */}
      <mesh castShadow position={[0, -0.1, -0.1]}>
        <boxGeometry args={[0.04, 0.12, 0.06]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      {/* Sight */}
      <mesh castShadow position={[0, 0.06, -0.15]}>
        <boxGeometry args={[0.03, 0.03, 0.08]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
    </group>
  )
}
