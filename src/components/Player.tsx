import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useInput, consumeMouse } from '../hooks/useInput'
import { useGameStore } from '../stores/gameStore'
import { WeaponModel } from './WeaponModel'

const MOVE_SPEED = 5
const SPRINT_SPEED = 8
const CROUCH_SPEED = 2.5
const JUMP_FORCE = 5
const MOUSE_SENSITIVITY = 0.002
const LEAN_ANGLE = 15 * (Math.PI / 180)
const LEAN_OFFSET = 0.4

// Camera settings
const CAM_DIST_NORMAL = 3.5
const CAM_DIST_AIM = 1.5
const CAM_SHOULDER_NORMAL = 0.8
const CAM_SHOULDER_AIM = 0.4

export function Player() {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const playerMeshRef = useRef<THREE.Group>(null)
  const weaponGroupRef = useRef<THREE.Group>(null)
  const input = useInput()
  const { camera } = useThree()

  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const leanRef = useRef(0)
  const isGroundedRef = useRef(true)
  const stanceHeightRef = useRef(1.7)
  const camDistRef = useRef(CAM_DIST_NORMAL)
  const camShoulderRef = useRef(CAM_SHOULDER_NORMAL)

  // Temp vectors
  const moveDir = useMemo(() => new THREE.Vector3(), [])
  const frontVec = useMemo(() => new THREE.Vector3(), [])
  const sideVec = useMemo(() => new THREE.Vector3(), [])
  const camOffset = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])

  useFrame((_state, delta) => {
    if (!rigidBodyRef.current || !playerMeshRef.current) return

    const inp = input.current!
    const store = useGameStore.getState()

    // --- Mouse Look ---
    const mouse = consumeMouse(input)
    if (inp.isPointerLocked) {
      yawRef.current -= mouse.x * MOUSE_SENSITIVITY
      pitchRef.current -= mouse.y * MOUSE_SENSITIVITY
      pitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitchRef.current))
    }

    // --- Stance (toggle) ---
    if (inp.crouch) {
      inp.crouch = false
      store.setStance(store.stance === 'crouch' ? 'stand' : 'crouch')
    }
    if (inp.prone) {
      inp.prone = false
      store.setStance(store.stance === 'prone' ? 'stand' : 'prone')
    }

    const currentStance = useGameStore.getState().stance
    const targetHeight = currentStance === 'stand' ? 1.7 : currentStance === 'crouch' ? 1.0 : 0.4
    stanceHeightRef.current += (targetHeight - stanceHeightRef.current) * 10 * delta

    // --- Sprint ---
    if (inp.sprint && inp.forward && currentStance === 'stand') {
      store.setSprinting(true)
    } else {
      store.setSprinting(false)
    }

    // --- Leaning ---
    let targetLean = 0
    if (inp.leanLeft && !inp.leanRight) {
      targetLean = -1
      store.setLeaning('left')
    } else if (inp.leanRight && !inp.leanLeft) {
      targetLean = 1
      store.setLeaning('right')
    } else {
      store.setLeaning('none')
    }
    leanRef.current += (targetLean - leanRef.current) * 10 * delta

    // --- Aiming ---
    store.setAiming(inp.aim)
    const currentAiming = inp.aim

    // --- Movement ---
    const currentSprinting = useGameStore.getState().isSprinting
    const speed = currentSprinting ? SPRINT_SPEED : currentStance === 'crouch' ? CROUCH_SPEED : currentStance === 'prone' ? 1.5 : MOVE_SPEED

    frontVec.set(0, 0, -(inp.forward ? 1 : 0) + (inp.backward ? 1 : 0))
    sideVec.set((inp.right ? 1 : 0) - (inp.left ? 1 : 0), 0, 0)

    moveDir
      .subVectors(frontVec, sideVec)
      .normalize()
      .multiplyScalar(speed)
      .applyEuler(new THREE.Euler(0, yawRef.current, 0))

    const currentVel = rigidBodyRef.current.linvel()
    rigidBodyRef.current.setLinvel(
      { x: moveDir.x, y: currentVel.y, z: moveDir.z },
      true
    )

    // --- Jump ---
    const pos = rigidBodyRef.current.translation()
    isGroundedRef.current = pos.y < 1.05

    if (inp.jump && isGroundedRef.current && currentStance === 'stand') {
      inp.jump = false
      rigidBodyRef.current.setLinvel(
        { x: currentVel.x, y: JUMP_FORCE, z: currentVel.z },
        true
      )
      store.setJumping(true)
      setTimeout(() => useGameStore.getState().setJumping(false), 500)
    }

    // --- Weapon Switch ---
    if (inp.weapon1) { inp.weapon1 = false; store.switchWeapon(0) }
    if (inp.weapon2) { inp.weapon2 = false; store.switchWeapon(1) }
    if (inp.weapon3) { inp.weapon3 = false; store.switchWeapon(2) }

    // --- Reload ---
    if (inp.reload) { inp.reload = false; store.reload() }

    // --- Fire ---
    if (inp.fire && !useGameStore.getState().isReloading) {
      store.fire()
    }

    // --- Update visual position ---
    const translation = rigidBodyRef.current.translation()
    playerMeshRef.current.position.set(translation.x, translation.y - 0.9, translation.z)
    playerMeshRef.current.rotation.y = yawRef.current

    // --- Camera ---
    const targetDist = currentAiming ? CAM_DIST_AIM : CAM_DIST_NORMAL
    const targetShoulder = currentAiming ? CAM_SHOULDER_AIM : CAM_SHOULDER_NORMAL
    camDistRef.current += (targetDist - camDistRef.current) * 8 * delta
    camShoulderRef.current += (targetShoulder - camShoulderRef.current) * 8 * delta

    const playerX = translation.x
    const playerY = translation.y - 0.9 + stanceHeightRef.current
    const playerZ = translation.z

    // Lean offset along the player's right axis
    const leanOffsetX = leanRef.current * LEAN_OFFSET

    // Camera position: behind + above + to the right shoulder of player
    const dist = camDistRef.current
    const shoulder = camShoulderRef.current
    const pitch = pitchRef.current
    const yaw = yawRef.current

    // Calculate camera offset relative to player facing direction
    camOffset.set(
      shoulder + leanOffsetX,
      Math.sin(pitch) * dist * 0.5 + 0.3,
      dist * Math.cos(pitch)
    )
    // Rotate offset by yaw
    const cosYaw = Math.cos(yaw)
    const sinYaw = Math.sin(yaw)
    const ox = camOffset.x * cosYaw + camOffset.z * sinYaw
    const oz = -camOffset.x * sinYaw + camOffset.z * cosYaw

    camera.position.set(
      playerX + ox,
      playerY + camOffset.y,
      playerZ + oz,
    )

    // Look target: a point well in front of the player
    lookTarget.set(
      playerX - Math.sin(yaw) * 10 + leanOffsetX * 0.3 * cosYaw,
      playerY + Math.sin(pitch) * 3,
      playerZ - Math.cos(yaw) * 10 - leanOffsetX * 0.3 * sinYaw,
    )
    camera.lookAt(lookTarget)

    // --- Weapon group follows camera ---
    if (weaponGroupRef.current) {
      weaponGroupRef.current.position.copy(camera.position)
      weaponGroupRef.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 2, 0]}
        enabledRotations={[false, false, false]}
        linearDamping={0.5}
      >
        <CapsuleCollider args={[0.4, 0.4]} position={[0, 0.8, 0]} />
      </RigidBody>

      {/* Player visual mesh */}
      <group ref={playerMeshRef}>
        {/* Body */}
        <mesh castShadow position={[0, 0.9, 0]}>
          <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
          <meshStandardMaterial color="#4a6741" />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
        {/* Helmet */}
        <mesh castShadow position={[0, 1.65, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#3a5a3a" />
        </mesh>
      </group>

      {/* Weapon attached to camera */}
      <group ref={weaponGroupRef}>
        <WeaponModel isAiming={useGameStore.getState().isAiming} />
      </group>
    </>
  )
}
