// ============================================================
// useAnimationSetup.ts — FBX 动画加载 Hook
// ============================================================

import * as THREE from 'three';
import { useMemo } from 'react';
import { useFBX } from '@react-three/drei';

const BASE = import.meta.env.BASE_URL || '/';
const getPath = (p: string) => BASE + p.replace(/^\//, '');

export function useAnimationSetup(clone: THREE.Object3D) {
  const { animations: idle } = useFBX(getPath('animations/pistol-idle.fbx'));
  const { animations: walkFwd } = useFBX(getPath('animations/pistol-walk.fbx'));
  const { animations: walkBwd } = useFBX(getPath('animations/pistol-walk-backward.fbx'));
  const { animations: runFwd } = useFBX(getPath('animations/pistol-run.fbx'));
  const { animations: runBwd } = useFBX(getPath('animations/pistol-run-backward.fbx'));
  const { animations: strafeL } = useFBX(getPath('animations/pistol-strafe-left.fbx'));
  const { animations: strafeR } = useFBX(getPath('animations/pistol-strafe-right.fbx'));
  const { animations: jump1 } = useFBX(getPath('animations/pistol-jump-1.fbx'));
  const { animations: jump2 } = useFBX(getPath('animations/pistol-jump-2.fbx'));

  const clips = useMemo(() => {
    const c = [
      idle[0].clone(),
      walkFwd[0].clone(),
      walkBwd[0].clone(),
      runFwd[0].clone(),
      runBwd[0].clone(),
      strafeL[0].clone(),
      strafeR[0].clone(),
      jump1[0].clone(),
      jump2[0].clone(),
    ];
    c[0].name = 'idle';
    c[1].name = 'walkForward';
    c[2].name = 'walkBackward';
    c[3].name = 'runForward';
    c[4].name = 'runBackward';
    c[5].name = 'strafeLeft';
    c[6].name = 'strafeRight';
    c[7].name = 'jumpStart';
    c[8].name = 'jumpEnd';
    return c;
  }, [idle, walkFwd, walkBwd, runFwd, runBwd, strafeL, strafeR, jump1, jump2]);

  const mixer = useMemo(() => new THREE.AnimationMixer(clone), [clone]);
  const actions = useMemo(() => [] as THREE.AnimationAction[], []);

  return { actions, mixer, clips };
}
