import { connectionData, layerPositions } from './geometry';

test('visual modes use the selected example, mean gradients, and actual optimizer deltas', () => {
  const sizes = [2, 1];
  const positions = [
    [
      [0, 0, 0],
      [0, 1, 0],
    ],
    [[1, 0, 0]],
  ];
  const record = {
    before: [{ weights: [-0.5, 0.8] }],
    after: [{ weights: [-0.49, 0.77] }],
    trace: { activations: [[0.2, 0.4]] },
    afterTrace: { activations: [[0.3, 0.5]] },
    gradients: [{ weights: [0.07, -0.08] }],
    delta: [{ weights: [0.01, -0.03] }],
  };
  const edges = (mode) => connectionData(sizes, positions, record, null, mode, 'all', null);
  expect(edges('activation')[0].value).toBeCloseTo(-0.1);
  expect(edges('activation')[0].after).toBeCloseTo(-0.147);
  expect(edges('weight').map((e) => e.value)).toEqual([-0.5, 0.8]);
  expect(edges('gradient').map((e) => e.value)).toEqual([0.07, -0.08]);
  expect(edges('update').map((e) => e.value)).toEqual([0.01, -0.03]);
  const focus = connectionData(sizes, positions, record, null, 'weight', 'focus', {
    layer: 0,
    index: 1,
  });
  expect(focus).toHaveLength(1);
  expect(focus[0].start).toEqual(positions[0][1]);
});

test('strongest filter limits each target and input columns face the overview camera', () => {
  const sizes = [784, 16, 16, 10];
  const positions = layerPositions(sizes);
  const weights = sizes
    .slice(1)
    .map((count, l) => ({ weights: new Float32Array(count * sizes[l]).fill(0.1) }));
  expect(
    connectionData(sizes, positions, null, { weights }, 'weight', 'strongest', null),
  ).toHaveLength(8 * 42);
  expect(connectionData(sizes, positions, null, { weights }, 'weight', 'all', null)).toHaveLength(
    12960,
  );
  expect(positions[0][0][2]).toBeGreaterThan(positions[0][27][2]);
});

test('output orientation preserves classes and all adjacent-layer connections', () => {
  const sizes = [784, 16, 16, 10];
  const horizontal = layerPositions(sizes, 'horizontal');
  const vertical = layerPositions(sizes, 'vertical');
  expect(new Set(horizontal[3].map((p) => p[1])).size).toBe(1);
  expect(new Set(horizontal[3].map((p) => p[0])).size).toBe(10);
  expect(new Set(vertical[3].map((p) => p[0])).size).toBe(1);
  expect(new Set(vertical[3].map((p) => p[1])).size).toBe(10);
  const weights = sizes
    .slice(1)
    .map((count, l) => ({ weights: new Float32Array(count * sizes[l]) }));
  for (const positions of [horizontal, vertical]) {
    const edges = connectionData(sizes, positions, null, { weights }, 'weight', 'all', null);
    for (let l = 0; l < 3; l++) {
      expect(edges.filter((e) => e.layer === l)).toHaveLength(sizes[l] * sizes[l + 1]);
      for (const target of positions[l + 1]) {
        expect(edges.filter((e) => e.end === target)).toHaveLength(sizes[l]);
      }
    }
  }
});

test('horizontal output is left-to-right at equal camera depth for arbitrary viewing angles', () => {
  const { outputRowPosition } = require('./geometry');
  const { PerspectiveCamera, Vector3 } = require('three');
  for (const viewpoint of [
    [8, 4.8, 17],
    [18, 7, 3],
    [-8, 4, 17],
  ]) {
    const camera = new PerspectiveCamera(43, 1.4, 0.1, 100);
    camera.position.set(...viewpoint);
    camera.lookAt(1, 0, 0);
    camera.updateMatrixWorld();
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const projected = Array.from({ length: 10 }, (_, index) =>
      new Vector3(...outputRowPosition(index, 10, 1, right)).project(camera),
    );
    for (let index = 1; index < projected.length; index++) {
      expect(projected[index].x).toBeGreaterThan(projected[index - 1].x);
      expect(projected[index].y).toBeCloseTo(projected[0].y, 10);
      expect(projected[index].z).toBeCloseTo(projected[0].z, 10);
    }
  }
});

test('clear-input view keeps the strongest eight pixel links and every hidden/output link', () => {
  const sizes = [784, 16, 16, 10];
  const positions = layerPositions(sizes);
  const weights = sizes.slice(1).map((count, layer) => ({
    weights: Float32Array.from(
      { length: count * sizes[layer] },
      (_, index) => (index % sizes[layer]) + 1,
    ),
  }));
  const edges = connectionData(
    sizes,
    positions,
    null,
    { weights },
    'activation',
    'input-sparse',
    null,
  );
  expect(edges).toHaveLength(544);
  expect(
    edges.filter((edge) => edge.layer === 0 && edge.target === 0).map((edge) => edge.start),
  ).toEqual(positions[0].slice(-8).reverse());
  for (let layer = 0; layer < 3; layer++) {
    for (let target = 0; target < sizes[layer + 1]; target++) {
      expect(edges.filter((edge) => edge.layer === layer && edge.target === target)).toHaveLength(
        layer === 0 ? 8 : sizes[layer],
      );
    }
  }
  expect(
    connectionData(sizes, positions, null, { weights }, 'activation', 'all', null),
  ).toHaveLength(12960);
});
