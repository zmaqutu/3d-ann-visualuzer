/* eslint-disable no-restricted-globals */
const mockInput = Float32Array.from({ length: 784 }, (_, i) => (i < 20 ? 0.8 : 0));
jest.mock('../model/dataset', () => ({
  loadMnist: jest.fn(async () => ({})),
  createSampler: () => ({
    batch: () => [{ id: 1, input: mockInput, label: 3 }],
    probes: [{ id: 55000, input: mockInput, label: 3 }],
  }),
}));
const settings = { width: 8, seed: 42, batchSize: 1, learningRate: 0.003, optimizer: 'adam' };
beforeAll(() => {
  self.postMessage = jest.fn();
  require('./worker');
});
beforeEach(() => self.postMessage.mockClear());
const command = (data) => self.onmessage({ data });
test('worker prepares without updating, commits once, and ignores stale-run commands', async () => {
  await command({ type: 'initialize', runId: 1, settings });
  expect(self.postMessage.mock.calls.at(-1)[0].type).toBe('ready');
  await command({ type: 'prepare', runId: 1 });
  const prepared = self.postMessage.mock.calls.at(-1)[0].record;
  // Real postMessage clones data. Snapshot it here to prevent the mock sharing references.
  const before = prepared.before[0].weights.slice();
  expect(prepared.committed).toBe(false);
  expect(prepared.after).toBeUndefined();
  await command({ type: 'commit', id: 1, runId: 1 });
  const committed = self.postMessage.mock.calls.at(-1)[0].record;
  expect(committed.committed).toBe(true);
  expect(committed.before[0].weights).toEqual(before);
  expect(committed.after[0].weights).not.toEqual(before);
  const count = self.postMessage.mock.calls.length;
  await command({ type: 'commit', id: 1, runId: 1 });
  await command({ type: 'prepare', runId: 0 });
  expect(self.postMessage.mock.calls).toHaveLength(count);
  await command({ type: 'prepare', runId: 1 });
  expect(self.postMessage.mock.calls.at(-1)[0].record.id).toBe(2);
});
test('reset starts from the seed and discards an unfinished update', async () => {
  await command({ type: 'initialize', runId: 2, settings });
  const first = self.postMessage.mock.calls.find(([message]) => message.type === 'initial')[0]
    .weights;
  await command({ type: 'prepare', runId: 2 });
  await command({ type: 'initialize', runId: 3, settings });
  const last = self.postMessage.mock.calls
    .filter(([message]) => message.type === 'initial')
    .at(-1)[0].weights;
  expect(last).toEqual(first);
  const count = self.postMessage.mock.calls.length;
  await command({ type: 'commit', runId: 2, id: 1 });
  expect(self.postMessage.mock.calls).toHaveLength(count);
});
