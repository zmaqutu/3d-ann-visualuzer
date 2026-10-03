// Dense ReLU classifier. Weights are output-major: w[output * inputs + input].
export function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const argmax = (values) =>
  values.reduce((best, value, i) => (value > values[best] ? i : best), 0);
export function softmax(logits) {
  const peak = Math.max(...logits);
  const values = Float64Array.from(logits, (x) => Math.exp(x - peak));
  const sum = values.reduce((a, b) => a + b, 0);
  return values.map((x) => x / sum);
}
export class DenseNetwork {
  constructor({
    sizes = [784, 16, 16, 10],
    seed = 42,
    optimizer = 'adam',
    learningRate = 0.003,
  } = {}) {
    this.sizes = sizes;
    this.optimizer = optimizer;
    this.learningRate = learningRate;
    this.step = 0;
    const random = randomGenerator(seed);
    this.layers = sizes.slice(1).map((outputs, l) => {
      const inputs = sizes[l];
      const scale = Math.sqrt(6 / inputs);
      const weights = Float64Array.from(
        { length: inputs * outputs },
        () => (random() * 2 - 1) * scale,
      );
      return {
        inputs,
        outputs,
        weights,
        biases: new Float64Array(outputs),
        mw: new Float64Array(weights.length),
        vw: new Float64Array(weights.length),
        mb: new Float64Array(outputs),
        vb: new Float64Array(outputs),
      };
    });
  }
  forward(input) {
    const activations = [Float64Array.from(input)];
    const preactivations = [];
    this.layers.forEach((layer, l) => {
      const z = new Float64Array(layer.outputs);
      for (let j = 0; j < layer.outputs; j++) {
        let value = layer.biases[j];
        for (let i = 0; i < layer.inputs; i++)
          value += layer.weights[j * layer.inputs + i] * activations[l][i];
        z[j] = value;
      }
      preactivations.push(z);
      activations.push(l === this.layers.length - 1 ? softmax(z) : z.map((v) => Math.max(0, v)));
    });
    return { activations, preactivations };
  }
  loss(trace, label) {
    const logits = trace.preactivations[trace.preactivations.length - 1];
    const peak = Math.max(...logits);
    return peak + Math.log(logits.reduce((sum, z) => sum + Math.exp(z - peak), 0)) - logits[label];
  }
  gradients(input, label) {
    const trace = this.forward(input);
    const deltas = new Array(this.layers.length);
    const last = this.layers.length - 1;
    deltas[last] = Float64Array.from(trace.activations[last + 1]);
    deltas[last][label] -= 1;
    for (let l = last - 1; l >= 0; l--) {
      const next = this.layers[l + 1];
      deltas[l] = new Float64Array(this.layers[l].outputs);
      for (let i = 0; i < deltas[l].length; i++) {
        let value = 0;
        for (let j = 0; j < next.outputs; j++)
          value += next.weights[j * next.inputs + i] * deltas[l + 1][j];
        deltas[l][i] = trace.preactivations[l][i] > 0 ? value : 0;
      }
    }
    const gradients = this.layers.map((layer, l) => ({
      weights: Float64Array.from(
        { length: layer.weights.length },
        (_, k) => deltas[l][Math.floor(k / layer.inputs)] * trace.activations[l][k % layer.inputs],
      ),
      biases: deltas[l].slice(),
    }));
    return { ...trace, deltas, gradients, loss: this.loss(trace, label) };
  }
  prepare(batch) {
    if (!batch.length) throw new Error('A training batch must contain at least one example.');
    const gradients = this.layers.map((layer) => ({
      weights: new Float64Array(layer.weights.length),
      biases: new Float64Array(layer.outputs),
    }));
    let loss = 0,
      correct = 0;
    let selected;
    batch.forEach((example, index) => {
      const trace = this.gradients(example.input, example.label);
      if (index === 0) selected = trace;
      loss += trace.loss;
      correct += argmax(trace.activations[trace.activations.length - 1]) === example.label ? 1 : 0;
      gradients.forEach((gradient, l) => {
        for (const key of ['weights', 'biases']) {
          for (let i = 0; i < gradient[key].length; i++)
            gradient[key][i] += trace.gradients[l][key][i] / batch.length;
        }
      });
    });
    return {
      gradients,
      selected,
      loss: loss / batch.length,
      accuracy: correct / batch.length,
      version: this.step,
    };
  }
  apply(prepared) {
    if (prepared.version !== this.step)
      throw new Error('This update was already applied or belongs to an older model.');
    this.step++;
    const updates = this.layers.map((layer) => ({
      weights: new Float32Array(layer.weights.length),
      biases: new Float32Array(layer.biases.length),
    }));
    this.layers.forEach((layer, l) => {
      for (const [key, moment, variance] of [
        ['weights', 'mw', 'vw'],
        ['biases', 'mb', 'vb'],
      ]) {
        layer[key].forEach((value, i) => {
          const g = prepared.gradients[l][key][i];
          let delta = -this.learningRate * g;
          if (this.optimizer === 'adam') {
            layer[moment][i] = 0.9 * layer[moment][i] + 0.1 * g;
            layer[variance][i] = 0.999 * layer[variance][i] + 0.001 * g * g;
            const m = layer[moment][i] / (1 - 0.9 ** this.step);
            const v = layer[variance][i] / (1 - 0.999 ** this.step);
            delta = (-this.learningRate * m) / (Math.sqrt(v) + 1e-8);
          }
          layer[key][i] = value + delta;
          updates[l][key][i] = delta;
        });
      }
    });
    return updates;
  }
  snapshot() {
    return this.layers.map(({ weights, biases }) => ({
      weights: Float32Array.from(weights),
      biases: Float32Array.from(biases),
    }));
  }
}
export function compactTrace(trace) {
  return {
    activations: trace.activations.map((v) => Float32Array.from(v)),
    preactivations: trace.preactivations.map((v) => Float32Array.from(v)),
    deltas: trace.deltas?.map((v) => Float32Array.from(v)),
    loss: trace.loss,
  };
}
