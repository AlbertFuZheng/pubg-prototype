// ============================================================
// Player.tsx — 主玩家组件（整合所有模块）
// ============================================================

import * as THREE from 'three';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useKeyboardControls, PositionalAudio } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { CapsuleCollider, RigidBody, useRapier } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';

import {
  MOUSE_SENSITIVITY,
  ADS_SENSITIVITY_MULTIPLIER,
  CAMERA,
  Stance,
  STANCE_CONFIG,
  SHOOTING,
  LEAN,
  MUZZLE_FLASH_LIGHT_DISTANCE,
} from '../modules/player/constants';
import type { GLTFResult, PlayerState, InputState } from '../modules/player/types';
import { useAnimationSetup } from '../modules/player/useAnimationSetup';
import { handleMovement } from '../modules/player/movement';
import { handleJump } from '../modules/player/jump';
import { handleRecoil } from '../modules/player/recoil';
import { handleMuzzleFlash, createMuzzleFlashTexture } from '../modules/player/muzzleFlash';
import { updateCamera } from '../modules/player/camera';
import { updateMovementPhysics } from '../modules/player/physics';
import { handleShooting, updateSpread, updateRecoil } from '../modules/player/shooting';
import { handleStanceChange } from '../modules/player/stance';
import { updateLean } from '../modules/player/lean';
import { updateFreeLook } from '../modules/player/freeLook';

const BASE = import.meta.env.BASE_URL || '/';
const getPath = (p: string) => BASE + p.replace(/^\//, '');

export function Player(props: { position?: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const mouseRotation = useRef({ x: 0, y: 0 });
  const pendingMouseX = useRef(0); // for free-look

  // Load model
  const { scene } = useGLTF(getPath('models/player.glb')) as unknown as GLTFResult;
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone) as unknown as GLTFResult;

  // Animations
  const { actions, mixer, clips } = useAnimationSetup(clone);

  // Game state
  const [playerState] = useState<PlayerState>(() => ({
    stance: Stance.Standing,
    isJumping: false,
    isSprinting: false,
    isAiming: false,
    isFreeLooking: false,
    lean: 0,
    freeLookYawOffset: 0,
    currentSpread: 3.0,
    recoilPitch: 0,
    recoilYaw: 0,
    cameraHeight: STANCE_CONFIG[Stance.Standing].cameraHeight,
    lastFireTime: 0,
    lastJumpTime: 0,
    consecutiveShots: 0,
  }));

  // Refs
  const controls = useRef<RapierRigidBody>(null);
  const smoothedPlayerPos = useRef(new THREE.Vector3());
  const smoothedCameraPos = useRef(new THREE.Vector3());
  const shootRayDir = useRef(new THREE.Vector3());

  // Shooting refs
  const shootRef = useRef(false);
  const aimRef = useRef(false);
  const shotSfxRef = useRef<THREE.PositionalAudio>(null);

  // Bone refs
  const leftHandBone = useRef<THREE.Bone | null>(null);
  const rightHandBone = useRef<THREE.Bone | null>(null);
  const recoilActive = useRef(false);
  const recoilStartTime = useRef(0);
  const leftHandOrigRot = useRef(new THREE.Euler());
  const rightHandOrigRot = useRef(new THREE.Euler());

  // Muzzle flash refs
  const muzzleFlashRef = useRef<THREE.Mesh>(null);
  const muzzleFlashLightRef = useRef<THREE.PointLight>(null);
  const muzzleFlashActive = useRef(false);
  const muzzleFlashStartTime = useRef(0);
  const gunBarrelPos = useRef(new THREE.Vector3());

  const muzzleFlashTexture = React.useMemo(() => createMuzzleFlashTexture(), []);

  // Jump state
  const [isJumping, setIsJumping] = useState(false);
  const [jumpWait, setJumpWait] = useState(false);
  const jumpPressedRef = useRef(false);

  // Stance toggle detection
  const crouchPressedRef = useRef(false);
  const pronePressedRef = useRef(false);

  // Keyboard controls
  const [, get] = useKeyboardControls();

  // Action setter with fade
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const setAction = useCallback((newAction: THREE.AnimationAction) => {
    if (currentActionRef.current === newAction) return;
    if (currentActionRef.current) {
      currentActionRef.current.fadeOut(0.1);
    }
    newAction.reset().fadeIn(0.1).play();
    currentActionRef.current = newAction;
  }, []);

  // Setup actions with mixer
  useEffect(() => {
    if (group.current && mixer && clips.length > 0) {
      for (let i = 0; i < clips.length; i++) {
        actions[i] = mixer.clipAction(clips[i], group.current);
      }
      actions[0]?.play();
      currentActionRef.current = actions[0];
    }
  }, [mixer, clips, actions]);

  // Setup bones
  const bones = nodes.Alpha_Joints?.skeleton?.bones ?? [];
  useEffect(() => {
    if (bones.length > 0) {
      leftHandBone.current = bones[8] ?? null;
      rightHandBone.current = bones[32] ?? null;
    }
  }, [bones]);

  // PointerLock + mouse + shooting input
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      const sens = MOUSE_SENSITIVITY * (aimRef.current ? ADS_SENSITIVITY_MULTIPLIER : 1);

      if (playerState.isFreeLooking) {
        pendingMouseX.current += e.movementX;
      } else {
        mouseRotation.current.x += e.movementX * sens;
      }
      mouseRotation.current.y += e.movementY * sens;
      mouseRotation.current.y = Math.max(CAMERA.pitchMin, Math.min(CAMERA.pitchMax, mouseRotation.current.y));
    };

    const onClick = () => {
      if (!document.pointerLockElement) {
        document.body.requestPointerLock();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left click = shoot
        const now = performance.now() / 1000;
        if (now - playerState.lastFireTime >= SHOOTING.fireCooldown) {
          shootRef.current = true;
          playerState.lastFireTime = now;
          playerState.consecutiveShots++;

          // Audio
          if (shotSfxRef.current) {
            shotSfxRef.current.stop();
            shotSfxRef.current.play();
          }

          // Visual recoil
          if (leftHandBone.current && rightHandBone.current) {
            leftHandOrigRot.current.copy(leftHandBone.current.rotation);
            rightHandOrigRot.current.copy(rightHandBone.current.rotation);
            recoilActive.current = true;
            recoilStartTime.current = Date.now();
          }

          // Muzzle flash
          muzzleFlashActive.current = true;
          muzzleFlashStartTime.current = Date.now();

          setTimeout(() => {
            shootRef.current = false;
          }, 50);
        }
      } else if (e.button === 2) {
        aimRef.current = true;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        aimRef.current = false;
      }
      if (e.button === 0) {
        playerState.consecutiveShots = 0;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    // Prevent context menu on right click
    const onContextMenu = (e: Event) => e.preventDefault();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('contextmenu', onContextMenu);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onClick);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [playerState]);

  const rapier = useRapier();

  // ---- Main game loop ----
  useFrame((threeState, delta) => {
    if (!controls.current) return;

    // When pointer lock is lost (e.g. tab switch), ignore all input
    // to prevent camera/character desync
    const hasPointerLock = !!document.pointerLockElement;

    const kb = get();
    const now = performance.now() / 1000;

    // Build input state — suppress when pointer not locked
    const input: InputState = {
      forward: hasPointerLock && kb.forward,
      backward: hasPointerLock && kb.backward,
      left: hasPointerLock && kb.left,
      right: hasPointerLock && kb.right,
      sprint: hasPointerLock && kb.sprint,
      jump: hasPointerLock && kb.jump,
      crouch: hasPointerLock && kb.crouch,
      prone: hasPointerLock && kb.prone,
      leanLeft: hasPointerLock && kb.leanLeft,
      leanRight: hasPointerLock && kb.leanRight,
      freeLook: hasPointerLock && kb.freeLook,
      shoot: hasPointerLock && shootRef.current,
      aim: aimRef.current,
      reload: kb.reload,
    };

    // ---- Stance ----
    const crouchJust = input.crouch && !crouchPressedRef.current;
    crouchPressedRef.current = input.crouch;
    const proneJust = input.prone && !pronePressedRef.current;
    pronePressedRef.current = input.prone;

    const newStance = handleStanceChange({
      crouchPressed: crouchJust,
      pronePressed: proneJust,
      state: playerState,
    });
    playerState.stance = newStance;

    // ---- Sprint ----
    const stanceCfg = STANCE_CONFIG[playerState.stance];
    playerState.isSprinting = input.sprint && input.forward && stanceCfg.canSprint && !playerState.isAiming;

    // ---- Aim ----
    playerState.isAiming = input.aim;

    // Cancel sprint while aiming
    if (playerState.isAiming) playerState.isSprinting = false;

    // ---- Free look ----
    playerState.isFreeLooking = input.freeLook;
    playerState.freeLookYawOffset = updateFreeLook(
      input.freeLook,
      playerState.freeLookYawOffset,
      pendingMouseX.current,
      MOUSE_SENSITIVITY,
      delta,
    );
    pendingMouseX.current = 0;

    // ---- Lean ----
    playerState.lean = updateLean(input.leanLeft, input.leanRight, playerState.lean, delta);

    // ---- Movement animation ----
    playerState.isJumping = isJumping;
    handleMovement({
      input,
      state: playerState,
      actions,
      setAction,
      isJumpWait: jumpWait,
    });

    // ---- Jump ----
    const jumpPressed = input.jump && !jumpPressedRef.current;
    jumpPressedRef.current = input.jump;

    handleJump({
      jumpPressed,
      state: playerState,
      actions,
      controls,
      world: rapier.world,
      now,
      setAction,
      setIsJumping,
      setJumpWait,
    });

    // ---- Animation update ----
    mixer?.update(delta);

    // ---- Visual recoil ----
    handleRecoil({
      recoilActive,
      recoilStartTime,
      leftHandBone,
      rightHandBone,
      leftHandOrigRot,
      rightHandOrigRot,
    });

    // ---- Player rotation ----
    const yaw = -mouseRotation.current.x;
    const pitch = mouseRotation.current.y;

    const playerYRotation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      yaw,
    );

    if (group.current) {
      // When no pointer lock, snap instantly to prevent desync after tab switch
      const slerpFactor = !hasPointerLock || playerState.isAiming ? 1 : 0.15;

      if (playerState.isSprinting) {
        // During sprint: face movement direction instead of camera direction
        let moveZ = 0, moveX = 0;
        if (input.forward) moveZ -= 1;
        if (input.backward) moveZ += 1;
        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;

        if (moveZ !== 0 || moveX !== 0) {
          const moveAngle = Math.atan2(moveX, moveZ);
          const sprintYaw = yaw + moveAngle + Math.PI;
          const sprintRotation = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            sprintYaw,
          );
          group.current.quaternion.slerp(sprintRotation, 0.15);
        }
      } else {
        group.current.quaternion.slerp(playerYRotation, slerpFactor);
      }
    }

    // ---- Physics movement ----
    updateMovementPhysics({
      input,
      state: playerState,
      playerYRotation,
      controls,
      smoothedPlayerPosition: smoothedPlayerPos,
      group,
      delta,
    });

    // ---- Muzzle flash ----
    if (muzzleFlashRef.current && muzzleFlashLightRef.current && group.current) {
      handleMuzzleFlash({
        active: muzzleFlashActive,
        startTime: muzzleFlashStartTime,
        meshRef: muzzleFlashRef,
        lightRef: muzzleFlashLightRef,
        gunBarrelPos,
        group,
        bones,
        pitch,
        yaw,
        camera: threeState.camera,
      });
    }

    // ---- Camera ----
    const cameraYaw = yaw + playerState.freeLookYawOffset;
    const cameraPitch = pitch + playerState.recoilPitch;

    const cameraPlayerYRot = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      cameraYaw,
    );

    updateCamera({
      state: playerState,
      smoothedPlayerPosition: smoothedPlayerPos,
      smoothedCameraPosition: smoothedCameraPos,
      playerYRotation: cameraPlayerYRot,
      pitch: cameraPitch,
      yaw: cameraYaw,
      camera: threeState.camera,
      world: rapier.world,
      delta,
    });

    // ---- Spine aiming ----
    if (bones.length > 3) {
      bones[3].rotation.set(0, 0, 0);

      if (playerState.isSprinting) {
        // Sprint: tilt upper body forward (lowered gun posture)
        const spineAxis = new THREE.Vector3(1, 0, 0);
        bones[3].rotateOnAxis(spineAxis, 0.7); // lean forward ~40 degrees
      } else {
        // Normal: spine follows pitch for aiming
        const spineAxis = new THREE.Vector3(1, 0, -0.5);
        bones[3].rotateOnAxis(spineAxis, pitch * 0.7);

        // Lean: rotate spine on Z (positive lean = right, body tilts right)
        if (Math.abs(playerState.lean) > 0.01) {
          bones[3].rotateZ(playerState.lean * LEAN.maxAngle);
        }
      }
    }

    // ---- Shooting ----
    const justFired = shootRef.current;

    // Spread update
    playerState.currentSpread = updateSpread({ state: playerState, input, delta });

    // Shooting spread bump
    if (justFired) {
      const cfg = playerState.isAiming ? SHOOTING.ads : SHOOTING.hipFire;
      playerState.currentSpread = Math.min(
        playerState.currentSpread + 1.5,
        cfg.maxSpread,
      );
    }

    // Recoil update
    const recoilResult = updateRecoil({ state: playerState, justFired, delta });
    playerState.recoilPitch = recoilResult.recoilPitch;
    playerState.recoilYaw = recoilResult.recoilYaw;

    // Apply recoil to mouse (player needs to "pull down" to compensate)
    if (justFired) {
      mouseRotation.current.y += playerState.recoilPitch * 0.3;
    }

    // Ray-cast shooting
    handleShooting({
      world: rapier.world,
      camera: threeState.camera,
      controls,
      shoot: justFired,
      spread: playerState.currentSpread,
      shootRayDirection: shootRayDir,
    });
  });

  return (
    <group>
      <RigidBody
        ref={controls}
        position={props.position ?? [0, 2, 0]}
        type="dynamic"
        mass={5}
        restitution={0.3}
        friction={0.5}
        linearDamping={0.1}
        angularDamping={0.1}
        canSleep={false}
        colliders={false}
        enabledRotations={[false, false, false]}
        enabledTranslations={[true, true, true]}
      >
        <CapsuleCollider
          args={[
            STANCE_CONFIG[Stance.Standing].colliderHalfHeight,
            STANCE_CONFIG[Stance.Standing].colliderRadius,
          ]}
          position={[0, STANCE_CONFIG[Stance.Standing].colliderOffset, 0]}
        />
        <group ref={group} dispose={null}>
          <group name="Scene">
            <group name="Armature" scale={0.01}>
              <primitive object={nodes.mixamorigHips} />
              <skinnedMesh
                frustumCulled={false}
                castShadow
                receiveShadow
                name="Alpha_Joints"
                geometry={nodes.Alpha_Joints.geometry}
                material={materials.Alpha_Joints_MAT}
                skeleton={nodes.Alpha_Joints.skeleton}
              />
              <skinnedMesh
                frustumCulled={false}
                castShadow
                receiveShadow
                name="Alpha_Surface"
                geometry={nodes.Alpha_Surface.geometry}
                material={materials.Alpha_Body_MAT}
                skeleton={nodes.Alpha_Surface.skeleton}
              />
            </group>
          </group>
        </group>

        <PositionalAudio
          url={getPath('sfx/pistol-shot.mp3')}
          ref={shotSfxRef}
          distance={8}
          loop={false}
          position={[0, 1.5, 0]}
        />
      </RigidBody>

      {/* Muzzle Flash */}
      <mesh ref={muzzleFlashRef} visible={false}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshBasicMaterial
          map={muzzleFlashTexture}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight
        ref={muzzleFlashLightRef}
        intensity={0}
        distance={MUZZLE_FLASH_LIGHT_DISTANCE}
        decay={2}
        color={0xffa500}
        visible={false}
      />
    </group>
  );
}
