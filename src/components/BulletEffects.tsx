// ============================================================
// BulletEffects.tsx — 弹道示踪线 + 弹孔贴花效果
// ============================================================

import * as THREE from 'three';
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

// ---- Configuration ----
const MAX_BULLET_HOLES = 50;       // max holes in pool (recycle oldest)
const HOLE_LIFETIME = 5.0;         // seconds before fade starts
const HOLE_FADE_DURATION = 0.5;    // seconds to fade out
const HOLE_SIZE = 0.08;            // radius of bullet hole decal

const MAX_TRACERS = 10;            // max active tracer lines
const TRACER_LIFETIME = 0.05;      // seconds — brief flash
const TRACER_FADE_DURATION = 0.1;  // fade out over 100ms

// ---- Bullet hole data ----
interface BulletHole {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  spawnTime: number;
  active: boolean;
}

// ---- Tracer data ----
interface Tracer {
  start: THREE.Vector3;
  end: THREE.Vector3;
  spawnTime: number;
  active: boolean;
}

// ---- Procedural bullet hole texture ----
function createBulletHoleTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Clear
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Dark center (the hole)
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  gradient.addColorStop(0, 'rgba(20, 20, 20, 1)');
  gradient.addColorStop(0.3, 'rgba(40, 35, 30, 0.95)');
  gradient.addColorStop(0.5, 'rgba(60, 55, 45, 0.7)');
  gradient.addColorStop(0.7, 'rgba(80, 70, 55, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Scorch marks — subtle radial cracks
  ctx.strokeStyle = 'rgba(30, 25, 20, 0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
    const innerR = size * 0.12;
    const outerR = size * (0.25 + Math.random() * 0.15);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ---- Public API: add bullet hole + tracer ----
export interface BulletEffectsAPI {
  addHit: (hitPoint: THREE.Vector3, hitNormal: THREE.Vector3, origin: THREE.Vector3) => void;
  addMiss: (origin: THREE.Vector3, direction: THREE.Vector3) => void;
}

// ---- Component ----
export const BulletEffects = React.forwardRef<BulletEffectsAPI, {}>((_props, ref) => {
  // ---- Bullet holes pool ----
  const holesRef = useRef<BulletHole[]>(() => {
    const arr: BulletHole[] = [];
    for (let i = 0; i < MAX_BULLET_HOLES; i++) {
      arr.push({
        position: new THREE.Vector3(),
        normal: new THREE.Vector3(0, 1, 0),
        spawnTime: -999,
        active: false,
      });
    }
    return arr;
  });
  // Initialize on first access
  if (typeof holesRef.current === 'function') {
    holesRef.current = (holesRef.current as any)();
  }
  const holeIndexRef = useRef(0);

  // ---- Tracers pool ----
  const tracersRef = useRef<Tracer[]>(() => {
    const arr: Tracer[] = [];
    for (let i = 0; i < MAX_TRACERS; i++) {
      arr.push({
        start: new THREE.Vector3(),
        end: new THREE.Vector3(),
        spawnTime: -999,
        active: false,
      });
    }
    return arr;
  });
  if (typeof tracersRef.current === 'function') {
    tracersRef.current = (tracersRef.current as any)();
  }
  const tracerIndexRef = useRef(0);

  // ---- InstancedMesh refs ----
  const holesMeshRef = useRef<THREE.InstancedMesh>(null);
  const tracersMeshRef = useRef<THREE.InstancedMesh>(null);

  // ---- Texture (created once) ----
  const holeTexture = useMemo(() => createBulletHoleTexture(), []);

  // ---- Temp objects ----
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // ---- API exposed via ref ----
  React.useImperativeHandle(ref, () => ({
    addHit(hitPoint: THREE.Vector3, hitNormal: THREE.Vector3, origin: THREE.Vector3) {
      const holes = holesRef.current;
      const idx = holeIndexRef.current % MAX_BULLET_HOLES;
      holeIndexRef.current++;

      holes[idx].position.copy(hitPoint).addScaledVector(hitNormal, 0.005); // slight offset to avoid z-fighting
      holes[idx].normal.copy(hitNormal);
      holes[idx].spawnTime = performance.now() / 1000;
      holes[idx].active = true;

      // Tracer: from origin to hitPoint
      const tracers = tracersRef.current;
      const tIdx = tracerIndexRef.current % MAX_TRACERS;
      tracerIndexRef.current++;
      tracers[tIdx].start.copy(origin);
      tracers[tIdx].end.copy(hitPoint);
      tracers[tIdx].spawnTime = performance.now() / 1000;
      tracers[tIdx].active = true;
    },
    addMiss(origin: THREE.Vector3, direction: THREE.Vector3) {
      // Tracer that goes to max distance without a hole
      const tracers = tracersRef.current;
      const tIdx = tracerIndexRef.current % MAX_TRACERS;
      tracerIndexRef.current++;
      tracers[tIdx].start.copy(origin);
      tracers[tIdx].end.copy(origin).addScaledVector(direction, 100);
      tracers[tIdx].spawnTime = performance.now() / 1000;
      tracers[tIdx].active = true;
    },
  }));

  // ---- Per-frame update ----
  useFrame(() => {
    const now = performance.now() / 1000;

    // ---- Update bullet holes ----
    const holeMesh = holesMeshRef.current;
    if (holeMesh) {
      const holes = holesRef.current;
      for (let i = 0; i < MAX_BULLET_HOLES; i++) {
        const h = holes[i];
        if (!h.active) {
          // Hide inactive instances far away
          tempMatrix.makeScale(0, 0, 0);
          holeMesh.setMatrixAt(i, tempMatrix);
          continue;
        }

        const age = now - h.spawnTime;
        if (age > HOLE_LIFETIME + HOLE_FADE_DURATION) {
          h.active = false;
          tempMatrix.makeScale(0, 0, 0);
          holeMesh.setMatrixAt(i, tempMatrix);
          continue;
        }

        // Compute opacity
        let opacity = 1.0;
        if (age > HOLE_LIFETIME) {
          opacity = 1.0 - (age - HOLE_LIFETIME) / HOLE_FADE_DURATION;
        }

        // Orient the plane to face along the normal
        tempVec.copy(h.position).add(h.normal);
        tempMatrix.lookAt(h.position, tempVec, new THREE.Vector3(0, 1, 0));
        tempQuat.setFromRotationMatrix(tempMatrix);

        // Scale based on opacity for fade effect
        const s = HOLE_SIZE * (0.5 + opacity * 0.5); // slightly shrink on fade
        tempMatrix.compose(h.position, tempQuat, new THREE.Vector3(s, s, s));
        holeMesh.setMatrixAt(i, tempMatrix);

        // Color with alpha encoded as brightness
        tempColor.setRGB(opacity, opacity, opacity);
        holeMesh.setColorAt(i, tempColor);
      }
      holeMesh.instanceMatrix.needsUpdate = true;
      if (holeMesh.instanceColor) holeMesh.instanceColor.needsUpdate = true;
    }

    // ---- Update tracers ----
    const tracerMesh = tracersMeshRef.current;
    if (tracerMesh) {
      const tracers = tracersRef.current;
      for (let i = 0; i < MAX_TRACERS; i++) {
        const t = tracers[i];
        if (!t.active) {
          tempMatrix.makeScale(0, 0, 0);
          tracerMesh.setMatrixAt(i, tempMatrix);
          continue;
        }

        const age = now - t.spawnTime;
        if (age > TRACER_LIFETIME + TRACER_FADE_DURATION) {
          t.active = false;
          tempMatrix.makeScale(0, 0, 0);
          tracerMesh.setMatrixAt(i, tempMatrix);
          continue;
        }

        let opacity = 1.0;
        if (age > TRACER_LIFETIME) {
          opacity = 1.0 - (age - TRACER_LIFETIME) / TRACER_FADE_DURATION;
        }

        // Position at midpoint, orient along direction, scale to length
        const mid = tempVec.copy(t.start).lerp(t.end, 0.5);
        const dir = new THREE.Vector3().subVectors(t.end, t.start);
        const len = dir.length();
        dir.normalize();

        // CylinderGeometry is along Y axis by default.
        // We need to rotate so Y-axis aligns with dir.
        tempQuat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

        // Tracer is a thin cylinder: radius scaled, full length = len
        const thickness = 0.025 * opacity;
        tempMatrix.compose(mid, tempQuat, new THREE.Vector3(thickness, len, thickness));
        tracerMesh.setMatrixAt(i, tempMatrix);

        tempColor.setRGB(1.5 * opacity, 1.2 * opacity, 0.5 * opacity); // bright warm yellow (HDR-ish for additive)
        tracerMesh.setColorAt(i, tempColor);
      }
      tracerMesh.instanceMatrix.needsUpdate = true;
      if (tracerMesh.instanceColor) tracerMesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Bullet holes — instanced planes with bullet hole texture */}
      <instancedMesh
        ref={holesMeshRef}
        args={[undefined, undefined, MAX_BULLET_HOLES]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={holeTexture}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.NormalBlending}
          vertexColors
          opacity={1}
        />
      </instancedMesh>

      {/* Tracers — instanced thin cylinders */}
      <instancedMesh
        ref={tracersMeshRef}
        args={[undefined, undefined, MAX_TRACERS]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshBasicMaterial
          transparent
          depthWrite={false}
          vertexColors
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  );
});

BulletEffects.displayName = 'BulletEffects';
