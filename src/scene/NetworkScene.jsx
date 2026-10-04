import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { layerPositions, connectionData, outputRowPosition } from './geometry';
import { VIEW_MODES, predictionAt } from './timing';
import { argmax, randomGenerator } from '../model/network';
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
  intensity,
  outputLayout,
  spacing,
  onCount,
}) {
  const material = useRef();
  const rowCamera = useRef(new THREE.Quaternion(0, 0, 0, 0));
  const right = useMemo(() => new THREE.Vector3(), []);
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
      ['aContribution', 'contribution', 1],
      ['aContributionAfter', 'contributionAfter', 1],
      ['aWeight', 'weight', 1],
      ['aWeightAfter', 'weightAfter', 1],
      ['aGradient', 'gradient', 1],
      ['aUpdate', 'update', 1],
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
  useLayoutEffect(() => {
    rowCamera.current.set(0, 0, 0, 0);
  }, [geometry]);
  useEffect(() => onCount(edges.length), [edges.length, onCount]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMode: { value: 0 },
      uIntensity: { value: 1.4 },
      uDenseInput: { value: 0 },
      uGlow: { value: 1 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );
  useFrame(({ size, camera }) => {
    if (outputLayout === 'horizontal' && !rowCamera.current.equals(camera.quaternion)) {
      right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      const ends = geometry.getAttribute('aEnd');
      edges.forEach((edge, index) => {
        if (edge.layer === sizes.length - 2)
          ends.setXYZ(index, ...outputRowPosition(edge.target, sizes.at(-1), spacing, right));
      });
      ends.needsUpdate = true;
      rowCamera.current.copy(camera.quaternion);
    }
    uniforms.uTime.value = timeRef.current;
    uniforms.uMode.value = VIEW_MODES[mode];
    uniforms.uIntensity.value = intensity;
    uniforms.uDenseInput.value = filter === 'all' ? 1 : 0;
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
function Nodes({
  positions,
  record,
  mode,
  selection,
  onSelect,
  timeRef,
  glow,
  outputLayout,
  spacing,
}) {
  const mesh = useRef();
  const rowCamera = useRef(new THREE.Quaternion(0, 0, 0, 0));
  const rowMath = useMemo(
    () => ({
      right: new THREE.Vector3(),
      position: new THREE.Vector3(),
      matrix: new THREE.Matrix4(),
      rotation: new THREE.Quaternion(),
      scale: new THREE.Vector3(0.19, 0.19, 0.19),
    }),
    [],
  );
  const flat = useMemo(
    () =>
      positions.flatMap((layer, l) =>
        layer.map((position, index) => ({ position, layer: l, index })),
      ),
    [positions],
  );
  const geometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1, 10, 8);
    const values = flat.map(({ layer, index }) => record?.trace.activations[layer][index] ?? 0);
    const after = flat.map(
      ({ layer, index }, i) => record?.afterTrace?.activations[layer][index] ?? values[i],
    );
    const winner = record ? argmax(record.trace.activations[3]) : -1;
    const winnerAfter = record?.afterTrace ? argmax(record.afterTrace.activations[3]) : winner;
    for (const [name, valuesArray] of [
      ['aValue', values],
      ['aAfter', after],
      [
        'aGradient',
        flat.map(({ layer, index }) =>
          layer ? (record?.trace.deltas?.[layer - 1][index] ?? 0) / SCALES.gradient : 0,
        ),
      ],
      [
        'aUpdate',
        flat.map(({ layer, index }) =>
          layer ? (record?.delta?.[layer - 1].biases[index] ?? 0) / SCALES.update : 0,
        ),
      ],
      ['aWinner', flat.map(({ layer, index }) => (layer === 3 && index === winner ? 1 : 0))],
      [
        'aWinnerAfter',
        flat.map(({ layer, index }) => (layer === 3 && index === winnerAfter ? 1 : 0)),
      ],
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
  }, [flat, record, selection]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    flat.forEach(({ position, layer }, i) => {
      matrix.compose(
        new THREE.Vector3(...position),
        quaternion,
        new THREE.Vector3(...(layer === 0 ? [0.045, 0.077, 0.077] : [0.19, 0.19, 0.19])),
      );
      mesh.current.setMatrixAt(i, matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere?.();
    rowCamera.current.set(0, 0, 0, 0);
  }, [flat, geometry]);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uGlow: { value: 1 }, uMode: { value: 0 } }),
    [],
  );
  useFrame(({ camera }) => {
    if (outputLayout === 'horizontal' && !rowCamera.current.equals(camera.quaternion)) {
      const count = positions[3].length;
      rowMath.right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      for (let index = 0; index < count; index++) {
        rowMath.position.set(...outputRowPosition(index, count, spacing, rowMath.right));
        rowMath.matrix.compose(rowMath.position, rowMath.rotation, rowMath.scale);
        mesh.current.setMatrixAt(flat.length - count + index, rowMath.matrix);
      }
      mesh.current.instanceMatrix.needsUpdate = true;
      rowCamera.current.copy(camera.quaternion);
    }
    uniforms.uTime.value = timeRef.current;
    uniforms.uGlow.value = glow ? 1 : 0;
    uniforms.uMode.value = VIEW_MODES[mode];
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
function CameraRig({ preset, cameraKey, spacing, outputLayout }) {
  const controls = useRef();
  const { camera, size } = useThree();
  useEffect(() => {
    const ratio = Math.max(1, 1.45 / (size.width / size.height));
    const wide = outputLayout === 'horizontal';
    const target =
      preset === 'side'
        ? [wide ? 1 : 0, 1, wide ? 20 : 17]
        : preset === 'input'
          ? [4, 1, 2]
          : wide
            ? [8, 4.8, 17]
            : [6, 4.8, 14];
    camera.position.set(...target.map((value) => value * ratio * Math.max(1, spacing)));
    controls.current.target.set(preset === 'input' ? -6 : wide ? 1 : 0, 0, 0);
    controls.current.update();
  }, [preset, cameraKey, camera, size.width, size.height, spacing, outputLayout]);
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
  const { invalidate, size } = useThree();
  const compact = size.width < 500;
  useEffect(() => {
    invalidate();
  }, [props.playhead, props.playing, invalidate]);
  useFrame(() => {
    if (props.playing) invalidate();
  });
  const sizes = props.record?.sizes || props.initial?.sizes || EMPTY_SIZES;
  const positions = useMemo(
    () =>
      layerPositions(sizes, props.outputLayout).map((layer) =>
        layer.map(([x, y, z]) => [x * props.spacing, y, z]),
      ),
    [sizes, props.spacing, props.outputLayout],
  );
  const labels = ['Input', 'Hidden 01', 'Hidden 02', 'Output'];
  const prediction = predictionAt(props.record, props.playhead);
  const horizontal = props.outputLayout === 'horizontal';
  return (
    <>
      <CameraRig
        preset={props.cameraPreset}
        cameraKey={props.cameraKey}
        spacing={props.spacing}
        outputLayout={props.outputLayout}
      />
      <Starfield />
      <Edges {...props} positions={positions} sizes={sizes} />
      <Nodes {...props} positions={positions} />
      {positions.map((layer, i) => (
        <Html
          key={i}
          position={[
            i === 3 ? 6 * props.spacing : layer[0][0],
            i === 3 && horizontal && compact ? 4.2 : 3.1,
            0,
          ]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="layer-label">
            <span>{labels[i]}</span>
            <small>
              {sizes[i]} {i === 0 ? 'pixels' : i === 3 ? 'classes' : 'ReLU units'}
            </small>
          </div>
        </Html>
      ))}
      <OutputLabels
        positions={positions[3]}
        horizontal={horizontal}
        spacing={props.spacing}
        prediction={prediction}
      />
      <Html
        position={[6 * props.spacing, horizontal ? (compact ? 2.0 : 1.25) : -3.6, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div className={`output-prediction ${compact ? 'compact' : ''}`}>
          <span>TOP PREDICTION</span>
          {prediction ? (
            <>
              <strong>
                {prediction.index} <small>{(prediction.probability * 100).toFixed(1)}%</small>
              </strong>
              <em className={prediction.correct ? 'correct' : 'incorrect'}>
                {prediction.correct ? 'Correct' : 'Incorrect'}
              </em>
            </>
          ) : (
            <small>Awaiting forward pass</small>
          )}
        </div>
      </Html>
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

function Starfield() {
  const geometry = useMemo(() => {
    const random = randomGenerator(718);
    const positions = [],
      colors = [];
    for (let i = 0; i < 2400; i++) {
      const y = random() * 2 - 1;
      const angle = random() * Math.PI * 2;
      const radius = 32 + random() * 30;
      const ring = Math.sqrt(1 - y * y);
      positions.push(Math.cos(angle) * ring * radius, y * radius, Math.sin(angle) * ring * radius);
      const brightness = 0.4 + random() * 0.6;
      colors.push(brightness * 0.65, brightness * 0.8, brightness);
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    result.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points geometry={geometry} raycast={() => null}>
      <pointsMaterial vertexColors size={0.085} transparent opacity={0.85} depthWrite={false} />
    </points>
  );
}

function OutputLabels({ positions, horizontal, spacing, prediction }) {
  const row = useRef();
  useFrame(({ camera }) => {
    if (horizontal) row.current.quaternion.copy(camera.quaternion);
    else row.current.quaternion.identity();
  });
  return (
    <group ref={row} position={horizontal ? [6 * spacing, 0, 0] : [0, 0, 0]}>
      {positions.map((position, index) => (
        <Html
          key={index}
          position={
            horizontal
              ? [(index - (positions.length - 1) / 2) * 0.52, -0.45, 0]
              : [position[0] + 0.4, position[1], position[2]]
          }
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className={`class-label ${prediction?.index === index ? 'predicted' : ''}`}>
            {index}
          </span>
        </Html>
      ))}
    </group>
  );
}
