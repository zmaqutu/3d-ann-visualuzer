import * as tf from '@tensorflow/tfjs';
import { DenseNetwork } from './network';
beforeAll(async () => {
  await tf.setBackend('cpu');
  await tf.ready();
});
test.each(['sgd', 'adam'])(
  '%s steps and gradients match TensorFlow.js on the same small network',
  (optimizerName) => {
    const config = { sizes: [3, 4, 2], seed: 31, learningRate: 0.01, optimizer: optimizerName };
    const network = new DenseNetwork(config);
    const variables = network.layers.map((l) => ({
      weights: tf.tidy(() =>
        tf.variable(tf.tensor2d(Array.from(l.weights), [l.outputs, l.inputs])),
      ),
      biases: tf.tidy(() => tf.variable(tf.tensor1d(Array.from(l.biases)))),
    }));
    const batch = [
      { input: [0.2, 0.6, 0.9], label: 0 },
      { input: [0.8, 0.3, 0.2], label: 1 },
    ];
    const xs = tf.tensor2d(batch.map((x) => x.input));
    const labels = tf.tensor2d([
      [1, 0],
      [0, 1],
    ]);
    const optimizer =
      optimizerName === 'adam' ? tf.train.adam(0.01, 0.9, 0.999, 1e-8) : tf.train.sgd(0.01);
    const list = variables.flatMap((layer) => [layer.weights, layer.biases]);
    try {
      for (let step = 0; step < 4; step++) {
        const reference = optimizer.computeGradients(
          () =>
            tf.tidy(() => {
              const hidden = tf.relu(
                tf.add(tf.matMul(xs, variables[0].weights, false, true), variables[0].biases),
              );
              const logits = tf.add(
                tf.matMul(hidden, variables[1].weights, false, true),
                variables[1].biases,
              );
              return tf.losses.softmaxCrossEntropy(labels, logits);
            }),
          list,
        );
        const actual = network.prepare(batch);
        expect(actual.loss).toBeCloseTo(reference.value.dataSync()[0], 5);
        variables.forEach((layer, l) => {
          for (const key of ['weights', 'biases'])
            reference.grads[layer[key].name]
              .dataSync()
              .forEach((value, i) => expect(actual.gradients[l][key][i]).toBeCloseTo(value, 5));
        });
        optimizer.applyGradients(reference.grads);
        network.apply(actual);
        variables.forEach((layer, l) => {
          for (const key of ['weights', 'biases'])
            layer[key]
              .dataSync()
              .forEach((value, i) => expect(network.layers[l][key][i]).toBeCloseTo(value, 5));
        });
        tf.dispose(reference);
      }
    } finally {
      tf.dispose(list);
      xs.dispose();
      labels.dispose();
      optimizer.dispose();
    }
  },
);
