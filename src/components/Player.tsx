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
  WEAPONS,
  FireMode,
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

export interface PlayerHUDState {
  stance: Stance;
  isAiming: boolean;
  isSprinting: boolean;
  weaponName: string;
  ammo: number;
  magSize: number;
  reserveAmmo: number;
  isReloading: boolean;
  fireMode: FireMode;
  spread: number;
}

export function Player(props: {
  position?: [number, number, number];
  onStateUpdate?: (state: PlayerHUDState) => void;
}) {
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
  const initWeapon = WEAPONS[1]; // M416 default
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
    // Weapon system
    currentWeaponIndex: 1,
    ammo: initWeapon.magSize,
    reserveAmmo: initWeapon.reserveAmmo,
    isReloading: false,
    reloadTimer: 0,
    fireMode: initWeapon.availableModes[0],
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
  const mouseHeldRef = useRef(false); // LMB held for auto fire

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

  // Sprint-to-shoot transition
  const sprintLockUntilRef = useRef(0);
  const pendingShootTimeRef = useRef(0);

  // Weapon switch / reload / fire-mode toggle detection
  const reloadPressedRef = useRef(false);
  const fireModePressedRef = useRef(false);

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

  // Helper: get current weapon config
  const getWeapon = () => WEAPONS[playerState.currentWeaponIndex] ?? WEAPONS[1];

  // Helper: execute a shot (shared between immediate and delayed fire)
  const executeShot = useCallback(() => {
    const weapon = WEAPONS[playerState.currentWeaponIndex] ?? WEAPONS[1];
    if (playerState.ammo <= 0 || playerState.isReloading) return;

    const now = performance.now() / 1000;
    shootRef.current = true;
    playerState.lastFireTime = now;
    playerState.consecutiveShots++;
    playerState.ammo--;
    sprintLockUntilRef.current = now + 0.5;

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

    setTimeout(() => { shootRef.current = false; }, 50);
  }, [playerState]);

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
        mouseHeldRef.current = true;
        // Immediate shot attempt (for single fire or first auto shot)
        const now = performance.now() / 1000;
        const weapon = WEAPONS[playerState.currentWeaponIndex] ?? WEAPONS[1];
        if (now - playerState.lastFireTime >= weapon.fireCooldown && !playerState.isReloading && playerState.ammo > 0) {
          if (playerState.isSprinting) {
            playerState.isSprinting = false;
            sprintLockUntilRef.current = now + 0.5;
            pendingShootTimeRef.current = now + 0.1;
          } else {
            executeShot();
          }
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
        mouseHeldRef.current = false;
        playerState.consecutiveShots = 0;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.pointerLockElement) {
        document.exitPointerLock();
      }
      // Fire mode toggle: B key
      if (e.code === 'KeyB') {
        const weapon = WEAPONS[playerState.currentWeaponIndex] ?? WEAPONS[1];
        const modes = weapon.availableModes;
        if (modes.length > 1) {
          const currentIdx = modes.indexOf(playerState.fireMode);
          playerState.fireMode = modes[(currentIdx + 1) % modes.length];
        }
      }
      // Weapon switch: 1, 2, 3
      if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') {
        const slot = parseInt(e.code.replace('Digit', '')) - 1;
        if (slot !== playerState.currentWeaponIndex && slot >= 0 && slot < WEAPONS.length) {
          const newWeapon = WEAPONS[slot];
          playerState.currentWeaponIndex = slot;
          playerState.ammo = newWeapon.magSize;
          playerState.reserveAmmo = newWeapon.reserveAmmo;
          playerState.isReloading = false;
          playerState.reloadTimer = 0;
          playerState.consecutiveShots = 0;
          playerState.fireMode = newWeapon.availableModes[0];
        }
      }
    };

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
  }, [playerState, executeShot]);

  const rapier = useRapier();

  // ---- Main game loop ----
  useFrame((threeState, delta) => {
    if (!controls.current) return;

    const hasPointerLock = !!document.pointerLockElement;
    const kb = get();
    const now = performance.now() / 1000;
    const weapon = getWeapon();

    // Build input state
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

    // ---- Reload (R key, single press) ----
    const reloadJust = input.reload && !reloadPressedRef.current;
    reloadPressedRef.current = input.reload;

    if (reloadJust && !playerState.isReloading && playerState.ammo < weapon.magSize && playerState.reserveAmmo > 0) {
      playerState.isReloading = true;
      playerState.reloadTimer = weapon.reloadTime;
    }

    // Reload timer countdown
    if (playerState.isReloading) {
      playerState.reloadTimer -= delta;
      if (playerState.reloadTimer <= 0) {
        const needed = weapon.magSize - playerState.ammo;
        const available = Math.min(needed, playerState.reserveAmmo);
        playerState.ammo += available;
        playerState.reserveAmmo -= available;
        playerState.isReloading = false;
        playerState.reloadTimer = 0;
      }
    }

    // ---- Fire mode toggle (B key, single press) ----
    const fireModeJust = hasPointerLock && (kb as any).fireMode && !fireModePressedRef.current;
    fireModePressedRef.current = hasPointerLock && !!(kb as any).fireMode;
    // Also handle via keyboard event listener for B key
    // (B is not in keyMap, so we handle via separate detection below)

    // ---- Pending shot from sprint-to-shoot transition ----
    if (pendingShootTimeRef.current > 0 && now >= pendingShootTimeRef.current) {
      pendingShootTimeRef.current = 0;
      executeShot();
    }

    // ---- Auto fire (hold LMB in auto mode) ----
    if (mouseHeldRef.current && playerState.fireMode === FireMode.Auto && !playerState.isReloading && playerState.ammo > 0) {
      if (now - playerState.lastFireTime >= weapon.fireCooldown && !shootRef.current && !playerState.isSprinting) {
        executeShot();
      }
    }

    // ---- Sprint ----
    const stanceCfg = STANCE_CONFIG[playerState.stance];
    const sprintLocked = now < sprintLockUntilRef.current;
    playerState.isSprinting = input.sprint && input.forward && stanceCfg.canSprint && !playerState.isAiming && !sprintLocked;

    // ---- Aim ----
    playerState.isAiming = input.aim;
    if (playerState.isAiming) playerState.isSprinting = false;

    // Cancel reload when switching actions (optional: keep reload going)

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
      const slerpFactor = !hasPointerLock || playerState.isAiming ? 1 : 0.15;

      if (playerState.isSprinting) {
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
    if (bones.length > 31) {
      const spineAxis = new THREE.Vector3(1, 0, -0.5);
      bones[3].rotation.set(0, 0, 0);

      if (playerState.isSprinting) {
        const sprintLean = 0.35;
        bones[3].rotateOnAxis(spineAxis, pitch * 0.5 + sprintLean);
      } else {
        bones[3].rotateOnAxis(spineAxis, pitch * 0.7);
        if (Math.abs(playerState.lean) > 0.01) {
          bones[3].rotateZ(playerState.lean * LEAN.maxAngle);
        }
      }
    }

    // ---- Shooting ----
    const justFired = shootRef.current;

    // Spread update
    playerState.currentSpread = updateSpread({ state: playerState, input, delta });

    if (justFired) {
      const cfg = playerState.isAiming ? SHOOTING.ads : SHOOTING.hipFire;
      playerState.currentSpread = Math.min(
        playerState.currentSpread + 1.5,
        cfg.maxSpread,
      );
    }

    // Recoil update (use per-weapon recoil values)
    const recoilResult = updateRecoil({ state: playerState, justFired, delta });
    playerState.recoilPitch = recoilResult.recoilPitch;
    playerState.recoilYaw = recoilResult.recoilYaw;

    // Apply recoil to mouse — kick UP + random horizontal jitter
    if (justFired) {
      mouseRotation.current.y -= weapon.recoilVertical * (Math.PI / 180) * 0.5;
      const hJitter = (Math.random() * 2 - 1) * weapon.recoilHorizontal * (Math.PI / 180) * 0.5;
      mouseRotation.current.x += hJitter;
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

    // ---- Report state to HUD ----
    if (props.onStateUpdate) {
      props.onStateUpdate({
        stance: playerState.stance,
        isAiming: playerState.isAiming,
        isSprinting: playerState.isSprinting,
        weaponName: weapon.name,
        ammo: playerState.ammo,
        magSize: weapon.magSize,
        reserveAmmo: playerState.reserveAmmo,
        isReloading: playerState.isReloading,
        fireMode: playerState.fireMode,
        spread: playerState.currentSpread,
      });
    }
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
