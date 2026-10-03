import { argmax } from '../model/network';

// One clock drives GPU pulses, node reveal, and the prediction readout.
export const FORWARD_START = 1;
export const FORWARD_END = 2;
export const BACKWARD_START = 3;
export const BACKWARD_END = 4;
export const UPDATE_END = 5;
export const LAYER_DURATION = (FORWARD_END - FORWARD_START) / 3;
export const forwardArrival = (layer) => FORWARD_START + layer * LAYER_DURATION;
export const backwardArrival = (layer) => BACKWARD_START + (3 - layer) * LAYER_DURATION;
export const VIEW_MODES = { activation: 0, weight: 1, gradient: 2, update: 3 };
export function predictionAt(record, time) {
  if (!record || time < FORWARD_END) return null;
  const after = record.committed && time >= UPDATE_END;
  const values = (after ? record.afterTrace : record.trace).activations[3];
  const index = argmax(values);
  return { index, probability: values[index], correct: index === record.label };
}
export const timingGLSL = `
const float FORWARD_START = ${FORWARD_START.toFixed(1)};
const float FORWARD_END = ${FORWARD_END.toFixed(1)};
const float BACKWARD_START = ${BACKWARD_START.toFixed(1)};
const float BACKWARD_END = ${BACKWARD_END.toFixed(1)};
const float UPDATE_END = ${UPDATE_END.toFixed(1)};
const float LAYER_DURATION = ${LAYER_DURATION};
float viewMode(float requested, float time) {
  if (requested > 0.5) return requested;
  if (time >= BACKWARD_START && time < BACKWARD_END) return 2.0;
  if (time >= BACKWARD_END && time < UPDATE_END) return 3.0;
  return 0.0;
}
float forwardArrival(float layer) { return FORWARD_START + layer * LAYER_DURATION; }
float backwardArrival(float layer) { return BACKWARD_START + (3.0 - layer) * LAYER_DURATION; }
`;
