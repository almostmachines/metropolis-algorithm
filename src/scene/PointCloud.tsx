import { useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import type { SampleRecord } from '../state/types';
import type { Params } from '../types';
import { normalize, type ParameterBounds } from './scene-math';

interface PointCloudProps {
  burnInSamples: SampleRecord[];
  acceptedSamples: SampleRecord[];
  maxBurnIn: number;
  maxAccepted: number;
  bounds: ParameterBounds;
}
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const colorBlue = new THREE.Color('#3b82f6');
const colorPurple = new THREE.Color('#a855f7');

export function PointCloud({
  burnInSamples,
  acceptedSamples,
  maxBurnIn,
  maxAccepted,
  bounds,
}: PointCloudProps) {
  const burnInRef = useRef<THREE.InstancedMesh>(null);
  const acceptedRef = useRef<THREE.InstancedMesh>(null);

  const toPos = useCallback(
    (p: Params): [number, number, number] => [
      normalize(p.tau, bounds.tau),
      normalize(p.mu1, bounds.mu1),
      normalize(p.mu2, bounds.mu2),
    ],
    [bounds],
  );

  // Update burn-in instances
  useEffect(() => {
    if (!burnInRef.current) return;
    const mesh = burnInRef.current;

    for (let i = 0; i < burnInSamples.length; i++) {
      const [x, y, z] = toPos(burnInSamples[i].params);
      tempObject.position.set(x, y, z);
      tempObject.scale.setScalar(1);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
      mesh.setColorAt(i, tempColor.set('#64748b'));
    }

    mesh.count = burnInSamples.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [burnInSamples, toPos]);

  // Update accepted instances with blue-to-purple gradient
  useEffect(() => {
    if (!acceptedRef.current) return;
    const mesh = acceptedRef.current;
    const total = acceptedSamples.length;

    for (let i = 0; i < total; i++) {
      const [x, y, z] = toPos(acceptedSamples[i].params);
      tempObject.position.set(x, y, z);
      tempObject.scale.setScalar(1);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      const t = total > 1 ? i / (total - 1) : 0;
      tempColor.lerpColors(colorBlue, colorPurple, t);
      mesh.setColorAt(i, tempColor);
    }

    mesh.count = total;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [acceptedSamples, toPos]);

  const sphereGeom = useMemo(
    () => new THREE.SphereGeometry(0.08, 8, 8),
    [],
  );

  return (
    <>
      <instancedMesh
        key={`burn-${maxBurnIn}`}
        ref={burnInRef}
        args={[sphereGeom, undefined, maxBurnIn]}
        frustumCulled={false}
      >
        <meshStandardMaterial transparent opacity={0.4} />
      </instancedMesh>
      <instancedMesh
        key={`accepted-${maxAccepted}`}
        ref={acceptedRef}
        args={[sphereGeom, undefined, maxAccepted]}
        frustumCulled={false}
      >
        <meshStandardMaterial transparent opacity={0.85} />
      </instancedMesh>
    </>
  );
}
