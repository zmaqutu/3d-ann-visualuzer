import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { layerPositions, connectionData } from './geometry';
import { neuronVertex, neuronFragment, edgeVertex, edgeFragment } from './shaders';
const EMPTY_SIZES = [784, 16, 16, 10];
export const SCALES = { activation: 1, weight: 1, gradient: 0.1, update: 0.01 };
function Edges({
  positions,
  sizes,
  record,
  initial,
  mode,
  filter,
  selection,
  timeRef,
  glow,
  onCount,
}) {
  const material = useRef();
  const edges = useMemo(
    () => connectionData(sizes, positions, record, initial, mode, filter, selection),
    [sizes, positions, record, initial, mode, filter, selection],
  );
  const geometry = useMemo(() => {
    const mesh = new THREE.InstancedBufferGeometry();
    mesh.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [0, -1, 0, 1, -1, 0, 1, 1, 0, 0, -1, 0, 1, 1, 0, 0, 1, 0],
        3,
      ),
    );
    for (const [name, property, width] of [
      ['aStart', 'start', 3],
      ['aEnd', 'end', 3],
      ['aValue', 'value', 1],
      ['aAfter', 'after', 1],
      ['aLayer', 'layer', 1],
      ['aFocus', 'related', 1],
    ]) {
      mesh.setAttribute(
        name,
        new THREE.InstancedBufferAttribute(
          Float32Array.from(
            edges.flatMap((edge) => (width === 3 ? edge[property] : [Number(edge[property]) || 0])),
          ),
          width,
        ),
      );
    }
    mesh.instanceCount = edges.length;
    return mesh;
  }, [edges]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => onCount(edges.length), [edges.length, onCount]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScale: { value: 1 },
      uGlow: { value: 1 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );
  useFrame(({ size }) => {
    uniforms.uTime.value = timeRef.current;
    uniforms.uScale.value = SCALES[mode];
    uniforms.uGlow.value = glow ? 1 : 0;
    uniforms.uResolution.value.set(size.width, size.height);
  });
  return (
    <mesh geometry={geometry} frustumCulled={false} raycast={() => null} renderOrder={1}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={edgeVertex}
        fragmentShader={edgeFragment}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
function Nodes({ positions, record, mode, selection, onSelect, timeRef, glow }) {
  const mesh = useRef();
  const flat = useMemo(
    () =>
      positions.flatMap((layer, l) =>
        layer.map((position, index) => ({ position, layer: l, index })),
      ),
    [positions],
  );
  const geometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1, 10, 8);
    const values = flat.map(({ layer, index }) => {
      if (layer === 0) return record?.input[index] ?? 0;
      if (mode === 'gradient')
        return (record?.trace.deltas?.[layer - 1][index] ?? 0) / SCALES.gradient;
      if (mode === 'update') return (record?.delta?.[layer - 1].biases[index] ?? 0) / SCALES.update;
      return record?.trace.activations[layer][index] ?? 0;
    });
    const after = flat.map(({ layer, index }, i) =>
      (mode === 'activation' || mode === 'weight') && layer > 0
        ? (record?.afterTrace?.activations[layer][index] ?? values[i])
        : values[i],
    );
    for (const [name, valuesArray] of [
      ['aValue', values],
      ['aAfter', after],
      ['aKind', flat.map((x) => (x.layer ? 1 : 0))],
      ['aLayer', flat.map((x) => x.layer)],
      [
        'aSelected',
        flat.map((x) => (selection?.layer === x.layer && selection?.index === x.index ? 1 : 0)),
      ],
    ]) {
      geometry.setAttribute(
        name,
        new THREE.InstancedBufferAttribute(Float32Array.from(valuesArray), 1),
      );
    }
    return geometry;
  }, [flat, record, selection, mode]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    flat.forEach(({ position, layer }, i) => {
      matrix.compose(
        new THREE.Vector3(...position),
        quaternion,
        new THREE.Vector3(...(layer === 0 ? [0.045, 0.077, 0.077] : [0.145, 0.145, 0.145])),
      );
      mesh.current.setMatrixAt(i, matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere?.();
  }, [flat, geometry]);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uGlow: { value: 1 }, uMode: { value: 0 } }),
    [],
  );
  useFrame(() => {
    uniforms.uTime.value = timeRef.current;
    uniforms.uGlow.value = glow ? 1 : 0;
    uniforms.uMode.value = mode === 'activation' || mode === 'weight' ? 0 : 1;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, null, flat.length]}
      frustumCulled={false}
      onClick={(event) => {
        event.stopPropagation();
        const { layer, index } = flat[event.instanceId];
        onSelect({ layer, index });
      }}
    >
      <shaderMaterial
        vertexShader={neuronVertex}
        fragmentShader={neuronFragment}
        uniforms={uniforms}
      />
    </instancedMesh>
  );
}
function CameraRig({ preset, cameraKey, spacing }) {
  const controls = useRef();
  const { camera, size } = useThree();
  useEffect(() => {
    const ratio = Math.max(1, 1.45 / (size.width / size.height));
    const target = preset === 'side' ? [0, 1, 17] : preset === 'input' ? [4, 1, 2] : [6, 4.8, 14];
    camera.position.set(...target.map((value) => value * ratio * Math.max(1, spacing)));
    controls.current.target.set(preset === 'input' ? -6 : 0, 0, 0);
    controls.current.update();
  }, [preset, cameraKey, camera, size.width, size.height, spacing]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      minDistance={6}
      maxDistance={50}
      enableDamping
      dampingFactor={0.1}
    />
  );
}
function SceneContents(props) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [props.playhead, props.playing, invalidate]);
  useFrame(() => {
    if (props.playing) invalidate();
  });
  const sizes = props.record?.sizes || props.initial?.sizes || EMPTY_SIZES;
  const positions = useMemo(
    () => layerPositions(sizes).map((layer) => layer.map(([x, y, z]) => [x * props.spacing, y, z])),
    [sizes, props.spacing],
  );
  const labels = ['Input', 'Hidden 01', 'Hidden 02', 'Output'];
  return (
    <>
      <CameraRig preset={props.cameraPreset} cameraKey={props.cameraKey} spacing={props.spacing} />
      <Edges {...props} positions={positions} sizes={sizes} />
      <Nodes {...props} positions={positions} />
      {positions.map((layer, i) => (
        <Html key={i} position={[layer[0][0], 3.1, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="layer-label">
            <span>{labels[i]}</span>
            <small>
              {sizes[i]} {i === 0 ? 'pixels' : i === 3 ? 'classes' : 'ReLU units'}
            </small>
          </div>
        </Html>
      ))}
      {positions[3].map((position, i) => (
        <Html
          key={i}
          position={[position[0] + 0.35, position[1], position[2]]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className="class-label">{i}</span>
        </Html>
      ))}
      <gridHelper args={[28, 28, '#203d47', '#152a34']} position={[0, -3.3, 0]} />
    </>
  );
}
export default function NetworkScene(props) {
  return (
    <Canvas
      frameloop="demand"
      camera={{ position: [10, 7, 19], fov: 43, near: 0.1, far: 100 }}
      dpr={props.quality === 'low' ? 1 : [1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0b141b');
        gl.domElement.setAttribute('role', 'img');
        gl.domElement.setAttribute(
          'aria-label',
          'Interactive 3D neural network; neuron selection is also available in the Neuron panel',
        );
      }}
      fallback={
        <div className="scene-fallback">
          WebGL is unavailable. Training values and the inspector remain accessible.
        </div>
      }
    >
      <SceneContents {...props} />
    </Canvas>
  );
}
