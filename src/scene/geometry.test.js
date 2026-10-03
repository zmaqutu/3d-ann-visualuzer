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
