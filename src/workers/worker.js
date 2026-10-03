/* eslint-disable no-restricted-globals */
import { DenseNetwork, compactTrace, argmax } from '../model/network';
import { loadMnist, createSampler } from '../model/dataset';
let dataset, model, sampler, pending, controller, runId, settings;
let initialized = false;
const send = (message) => self.postMessage({ ...message, runId });
self.onmessage = async ({ data }) => {
  if (data.type !== 'initialize' && data.runId !== runId) return;
  try {
    if (data.type === 'initialize') {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      initialized = false;
      runId = data.runId;
      settings = data.settings;
      pending = null;
      model = new DenseNetwork({ ...settings, sizes: [784, settings.width, settings.width, 10] });
      send({ type: 'initial', weights: model.snapshot(), sizes: model.sizes });
      if (!dataset)
        dataset = await loadMnist((message) => {
          if (!signal.aborted) send({ type: 'loading', message });
        }, signal);
      if (signal.aborted) return;
      sampler = createSampler(dataset, settings.seed);
      initialized = true;
      send({ type: 'ready' });
    } else if (data.type === 'prepare') {
      if (!initialized) throw new Error('Training data is not ready.');
      if (pending) throw new Error('Finish the pending update before requesting another batch.');
      const batch = sampler.batch(settings.batchSize);
      const prepared = model.prepare(batch);
      const record = {
        id: model.step + 1,
        sizes: model.sizes,
        settings,
        batchIds: batch.map((x) => x.id),
        input: batch[0].input,
        label: batch[0].label,
        sampleId: batch[0].id,
        before: model.snapshot(),
        trace: compactTrace(prepared.selected),
        gradients: prepared.gradients.map((g) => ({
          weights: Float32Array.from(g.weights),
          biases: Float32Array.from(g.biases),
        })),
        loss: prepared.loss,
        accuracy: prepared.accuracy,
        committed: false,
      };
      pending = { prepared, batch, record };
      send({ type: 'prepared', record });
    } else if (data.type === 'commit') {
      // Repeated UI events must never apply the same optimizer step twice.
      if (!pending || pending.record.id !== data.id) return;
      const delta = model.apply(pending.prepared);
      const { record, batch } = pending;
      record.after = model.snapshot();
      record.delta = delta;
      record.afterTrace = compactTrace(model.forward(batch[0].input));
      record.afterTrace.loss = model.loss(record.afterTrace, batch[0].label);
      record.afterLoss =
        batch.reduce(
          (sum, sample) => sum + model.loss(model.forward(sample.input), sample.label),
          0,
        ) / batch.length;
      record.probeAccuracy =
        sampler.probes.reduce(
          (correct, sample) =>
            correct + (argmax(model.forward(sample.input).activations[3]) === sample.label ? 1 : 0),
          0,
        ) / sampler.probes.length;
      record.committed = true;
      pending = null;
      send({ type: 'committed', record });
    }
  } catch (error) {
    if (data.runId === runId && error.name !== 'AbortError')
      send({ type: 'error', message: error.message || 'Training failed. Reset the run to retry.' });
  }
};
