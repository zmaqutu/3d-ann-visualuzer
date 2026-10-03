import { forwardArrival, backwardArrival, predictionAt } from './timing';

test('forward arrival and backward arrival follow opposite layer orders', () => {
  expect(forwardArrival(1)).toBeCloseTo(1 + 1 / 3);
  expect(forwardArrival(2)).toBeCloseTo(1 + 2 / 3);
  expect(forwardArrival(3)).toBe(2);
  expect(backwardArrival(3)).toBe(3);
  expect(backwardArrival(2)).toBeCloseTo(3 + 1 / 3);
  expect(backwardArrival(1)).toBeCloseTo(3 + 2 / 3);
  expect(backwardArrival(0)).toBe(4);
});

test('output shows the top prediction, including failures, only after the forward pass', () => {
  const record = {
    label: 7,
    committed: true,
    trace: { activations: [[], [], [], [0, 0, 0, 0, 0, 0.7, 0, 0.3, 0, 0]] },
    afterTrace: { activations: [[], [], [], [0, 0, 0, 0, 0, 0.2, 0, 0.8, 0, 0]] },
  };
  expect(predictionAt(record, 1.999)).toBeNull();
  expect(predictionAt(record, 2)).toEqual({ index: 5, probability: 0.7, correct: false });
  expect(predictionAt(record, 4.99).index).toBe(5);
  expect(predictionAt(record, 5)).toEqual({ index: 7, probability: 0.8, correct: true });
  expect(predictionAt({ ...record, committed: false }, 5).index).toBe(5);
});
