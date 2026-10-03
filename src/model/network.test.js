import { DenseNetwork, softmax } from './network';
import { appendRecord, advanceTime, HISTORY_LIMIT } from './playback';
const example = { input: [0.2, 0.7, 0.4], label: 1 };
test('softmax remains normalized for large logits', () => {
  const values = softmax([10000, 9999, -10000]);
  expect(values.reduce((a, b) => a + b)).toBeCloseTo(1, 12);
  expect(values.every(Number.isFinite)).toBe(true);
});
test('analytic gradients agree with central finite differences for every weight and bias', () => {
  const network = new DenseNetwork({ sizes: [3, 3, 2], seed: 9 });
  // Avoid a ReLU kink while checking derivatives.
  network.layers[0].biases.fill(2);
  const trace = network.gradients(example.input, example.label);
  const epsilon = 1e-5;
  network.layers.forEach((layer, l) => {
    for (const key of ['weights', 'biases'])
      layer[key].forEach((value, i) => {
        layer[key][i] = value + epsilon;
        const plus = network.loss(network.forward(example.input), example.label);
        layer[key][i] = value - epsilon;
        const minus = network.loss(network.forward(example.input), example.label);
        layer[key][i] = value;
        expect(trace.gradients[l][key][i]).toBeCloseTo((plus - minus) / (2 * epsilon), 6);
      });
  });
});
test('batch gradient is the mean of sample gradients and SGD applies it exactly once', () => {
  const network = new DenseNetwork({
    sizes: [3, 3, 2],
    seed: 4,
    optimizer: 'sgd',
    learningRate: 0.01,
  });
  const other = { input: [0.8, 0.2, 0.1], label: 0 };
  const a = network.gradients(example.input, 1),
    b = network.gradients(other.input, 0);
  const prepared = network.prepare([example, other]);
  const before = network.layers.map((l) => l.weights.slice());
  network.apply(prepared);
  network.layers.forEach((layer, l) =>
    layer.weights.forEach((value, i) => {
      expect(prepared.gradients[l].weights[i]).toBeCloseTo(
        (a.gradients[l].weights[i] + b.gradients[l].weights[i]) / 2,
        12,
      );
      expect(value).toBeCloseTo(before[l][i] - 0.01 * prepared.gradients[l].weights[i], 12);
    }),
  );
  expect(() => network.apply(prepared)).toThrow(/already applied/);
});
test('Adam first update uses bias-corrected moments', () => {
  const network = new DenseNetwork({ sizes: [3, 2], optimizer: 'adam', learningRate: 0.003 });
  const before = network.layers[0].weights.slice();
  const prepared = network.prepare([example]);
  network.apply(prepared);
  network.layers[0].weights.forEach((value, i) => {
    const g = prepared.gradients[0].weights[i];
    expect(value).toBeCloseTo(before[i] - (0.003 * g) / (Math.abs(g) + 1e-8), 10);
  });
});
test('equal seeds reproduce initialization and replay never advances optimizer state', () => {
  const a = new DenseNetwork({ sizes: [3, 2], seed: 99 });
  const b = new DenseNetwork({ sizes: [3, 2], seed: 99 });
  expect(a.snapshot()).toEqual(b.snapshot());
  const step = a.prepare([example]);
  a.apply(step);
  for (let i = 0; i < 20; i++) a.forward(example.input);
  expect(a.step).toBe(1);
});
test('history is bounded and commit replaces the pending record', () => {
  let records = [];
  for (let i = 1; i < 70; i++) records = appendRecord(records, { id: i });
  records = appendRecord(records, { id: 69, committed: true });
  expect(records).toHaveLength(HISTORY_LIMIT);
  expect(records[records.length - 1]).toEqual({ id: 69, committed: true });
});
test('playback waits for commit and clamps long background-tab frames', () => {
  expect(advanceTime(3.99, 1, 4, false)).toBe(4);
  expect(advanceTime(4, 60, 1, true)).toBeCloseTo(4 + 0.1 / 1.5);
  expect(advanceTime(5.99, 1, 4, true)).toBe(5.999);
});
