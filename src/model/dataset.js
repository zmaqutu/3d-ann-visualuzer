/** MNIST sprite decoding adapted from Google TensorFlow.js examples.
 * Copyright 2018 Google LLC. Licensed under Apache-2.0.
 * https://www.apache.org/licenses/LICENSE-2.0
 */
import { randomGenerator } from './network';
const ROOT = 'https://storage.googleapis.com/learnjs-data/model-builder/';
const COUNT = 65000;
const TRAIN = 55000;
export async function loadMnist(onProgress, signal) {
  if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
    throw new Error(
      'This browser needs OffscreenCanvas support to decode MNIST. Try a current Chrome, Firefox, or Safari.',
    );
  }
  onProgress('Downloading MNIST images and labels…');
  const responses = await Promise.all(
    ['mnist_images.png', 'mnist_labels_uint8'].map((path) => fetch(ROOT + path, { signal })),
  );
  for (const response of responses)
    if (!response.ok) throw new Error(`MNIST download failed (${response.status}). Please retry.`);
  const [blob, labelBuffer] = await Promise.all([responses[0].blob(), responses[1].arrayBuffer()]);
  const labels = new Uint8Array(labelBuffer);
  if (labels.length !== COUNT * 10) throw new Error('The MNIST labels have an unexpected size.');
  const bitmap = await createImageBitmap(blob);
  try {
    if (bitmap.width !== 784 || bitmap.height !== COUNT)
      throw new Error('The MNIST image has an unexpected size.');
    const images = new Uint8Array(COUNT * 784);
    const canvas = new OffscreenCanvas(784, 1000);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Could not create the image decoder.');
    for (let row = 0; row < COUNT; row += 1000) {
      signal?.throwIfAborted();
      context.drawImage(bitmap, 0, row, 784, 1000, 0, 0, 784, 1000);
      const pixels = context.getImageData(0, 0, 784, 1000).data;
      for (let i = 0; i < pixels.length / 4; i++) images[row * 784 + i] = pixels[i * 4];
      onProgress(`Decoding training images · ${Math.round(((row + 1000) / COUNT) * 100)}%`);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return { images, labels };
  } finally {
    bitmap.close();
  }
}
export function createSampler(data, seed) {
  const random = randomGenerator(seed);
  const order = Uint32Array.from({ length: TRAIN }, (_, i) => i);
  function shuffle() {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  shuffle();
  let cursor = 0;
  function example(id) {
    const input = Float32Array.from(
      data.images.subarray(id * 784, (id + 1) * 784),
      (value) => value / 255,
    );
    const label = data.labels.subarray(id * 10, (id + 1) * 10).indexOf(1);
    if (label < 0) throw new Error('MNIST label is not one-hot encoded.');
    return { id, input, label };
  }
  return {
    batch(size) {
      return Array.from({ length: size }, () => {
        if (cursor === TRAIN) {
          shuffle();
          cursor = 0;
        }
        return example(order[cursor++]);
      });
    },
    // Stable held-out probes make successive checkpoints comparable.
    probes: Array.from({ length: 64 }, (_, i) => example(TRAIN + i * 137)),
  };
}
