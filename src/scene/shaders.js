import { timingGLSL } from './timing';

export const neuronVertex = `
${timingGLSL}
attribute float aValue;
attribute float aAfter;
attribute float aGradient;
attribute float aUpdate;
attribute float aWinner;
attribute float aWinnerAfter;
attribute float aSelected;
attribute float aKind;
attribute float aLayer;
uniform float uTime;
uniform float uMode;
varying float vValue;
varying float vSelected;
varying float vKind;
varying float vWinner;
varying float vMode;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vMode = viewMode(uMode, uTime);
  float blend = step(UPDATE_END, uTime);
  float reveal = aLayer < 0.5 ? 1.0 : smoothstep(forwardArrival(aLayer) - 0.04, forwardArrival(aLayer), uTime);
  vValue = mix(aValue, aAfter, blend);
  if (aLayer > 0.5 && vMode > 1.5 && vMode < 2.5) {
    vValue = aGradient;
    reveal = uTime >= BACKWARD_START && uTime < BACKWARD_END ? smoothstep(backwardArrival(aLayer), backwardArrival(aLayer) + 0.04, uTime) : 1.0;
  } else if (aLayer > 0.5 && vMode > 2.5) {
    vValue = aUpdate;
    reveal = uTime >= BACKWARD_END && uTime < UPDATE_END ? smoothstep(BACKWARD_END, UPDATE_END, uTime) : 1.0;
  }
  vValue *= reveal;
  vWinner = mix(aWinner, aWinnerAfter, blend) * step(FORWARD_END, uTime);
  vSelected = aSelected; vKind = aKind;
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
export const neuronFragment = `
uniform float uGlow;
varying float vValue;
varying float vSelected;
varying float vKind;
varying float vWinner;
varying float vMode;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float facing = abs(dot(normalize(vNormal), normalize(vView)));
  float rim = pow(1.0 - facing, 2.2);
  float strength = sqrt(clamp(abs(vValue), 0.0, 1.0));
  vec3 tint = vValue < 0.0 ? vec3(1.0, 0.20, 0.045) : vec3(0.02, 0.62, 1.0);
  if (vMode < 1.5) tint = vec3(0.06, 1.0, 0.48);
  vec3 color = mix(vec3(0.11, 0.16, 0.25), tint, strength);
  color *= 0.65 + 0.35 * facing;
  color += rim * (0.07 + uGlow * strength * 0.28);
  color = mix(color, vec3(1.0, 0.73, 0.12), vWinner * smoothstep(0.15, 0.6, rim));
  color = mix(color, vec3(0.95, 0.98, 1.0), vSelected * rim);
  if (vKind < 0.5) color = mix(vec3(0.07, 0.12, 0.17), vec3(0.90, 0.98, 0.96), clamp(abs(vValue), 0.0, 1.0));
  gl_FragColor = vec4(color, 1.0);
}`;
export const edgeVertex = `
${timingGLSL}
attribute vec3 aStart;
attribute vec3 aEnd;
attribute float aContribution;
attribute float aContributionAfter;
attribute float aWeight;
attribute float aWeightAfter;
attribute float aGradient;
attribute float aUpdate;
attribute float aLayer;
attribute float aFocus;
uniform vec2 uResolution;
uniform float uTime;
uniform float uMode;
varying float vAlong;
varying float vAcross;
varying float vValue;
varying float vLayer;
varying float vFocus;
varying float vMode;
void main() {
  vMode = viewMode(uMode, uTime);
  float blend = smoothstep(BACKWARD_END, UPDATE_END, uTime);
  vValue = mix(aContribution, aContributionAfter, step(UPDATE_END, uTime));
  if (vMode > 0.5 && vMode < 1.5) vValue = mix(aWeight, aWeightAfter, blend);
  if (vMode > 1.5 && vMode < 2.5) vValue = aGradient / 0.1;
  if (vMode > 2.5) vValue = aUpdate / 0.01;
  vLayer = aLayer; vFocus = aFocus;
  vAlong = position.x; vAcross = position.y;
  vec4 start = projectionMatrix * modelViewMatrix * vec4(aStart, 1.0);
  vec4 end = projectionMatrix * modelViewMatrix * vec4(aEnd, 1.0);
  vec2 direction = (end.xy / end.w - start.xy / start.w) * uResolution;
  vec2 normal = normalize(vec2(-direction.y, direction.x) + vec2(0.00001));
  vec4 projected = mix(start, end, position.x);
  float thickness = 0.65 + 1.25 * sqrt(clamp(abs(vValue), 0.0, 1.0)) + aFocus * 0.4;
  projected.xy += normal * position.y * thickness / uResolution * projected.w * 2.0;
  gl_Position = projected;
}`;
export const edgeFragment = `
${timingGLSL}
uniform float uTime;
uniform float uGlow;
uniform float uIntensity;
uniform float uDenseInput;
varying float vAlong;
varying float vAcross;
varying float vValue;
varying float vLayer;
varying float vFocus;
varying float vMode;
void main() {
  float strength = sqrt(clamp(abs(vValue), 0.0, 1.0));
  float forward = (uTime - FORWARD_START) / LAYER_DURATION - vLayer;
  float backward = (uTime - BACKWARD_START) / LAYER_DURATION - (2.0 - vLayer);
  float distanceToPulse = 10.0;
  float reveal = 1.0;
  if (vMode < 0.5 && uTime < FORWARD_END) reveal = smoothstep(vAlong - 0.025, vAlong + 0.025, forward);
  if (vMode > 1.5 && vMode < 2.5 && uTime >= BACKWARD_START && uTime < BACKWARD_END) reveal = smoothstep(1.0 - vAlong - 0.025, 1.0 - vAlong + 0.025, backward);
  if (uTime >= FORWARD_START && uTime < FORWARD_END && forward >= 0.0 && forward <= 1.0) distanceToPulse = abs(vAlong - forward);
  if (uTime >= BACKWARD_START && uTime < BACKWARD_END && backward >= 0.0 && backward <= 1.0) distanceToPulse = abs(vAlong - (1.0 - backward));
  float pulse = exp(-distanceToPulse * distanceToPulse * 260.0) * step(0.000001, abs(vValue));
  float updateProgress = uTime >= BACKWARD_END && uTime < UPDATE_END ? smoothstep(BACKWARD_END, UPDATE_END, uTime) : 1.0;
  if (vMode > 2.5) reveal = updateProgress;
  float updateFlash = uTime >= BACKWARD_END && uTime < UPDATE_END ? sin((uTime - BACKWARD_END) * 3.14159) : 0.0;
  float signalVisible = step(0.000001, abs(vValue)) * reveal;
  vec3 tint = vValue < 0.0 ? vec3(1.0, 0.22, 0.045) : vec3(0.01, 0.56, 1.0);
  tint = mix(vec3(0.48, 0.55, 0.92), tint, signalVisible);
  // The dense input bundle needs less opacity than the sparse hidden/output bundles.
  // This structural layer remains visible even when all activations are still zero.
  float restingAlpha = vLayer < 0.5 && uDenseInput > 0.5 ? 0.028 : 0.22;
  float alpha = (restingAlpha + signalVisible * (0.035 + 0.42 * strength) + pulse * 0.8 + vFocus * 0.1 + updateFlash * strength * 0.25) * uIntensity;
  alpha *= 1.0 - smoothstep(0.4, 1.0, abs(vAcross));
  gl_FragColor = vec4(tint * (1.0 + pulse * uGlow * 0.6), clamp(alpha, 0.0, 1.0));
}`;
