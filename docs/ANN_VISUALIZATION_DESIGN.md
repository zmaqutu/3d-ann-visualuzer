# ANN visualization direction

3 October 2026. Revised after the product clarification: the experience is about watching a network learn. The priorities are mathematically faithful animation, excellent rendering, meaningful control, and the visual language of the word-embeddings explorer. This document supersedes the earlier audit's emphasis on an instant prepared demo. It is a proposal, not an implemented feature list.

## The defining experience

Start with an untrained network. Let the user see a digit enter it, inspect how its prediction is computed, see the loss and gradients, watch the parameters change, and compare the same input before and after that change. Over many steps, show which patterns in weights, activations, and predictions emerge.

Every visual effect must answer a question: what quantity is represented, when was it measured, what scale is used, and what changed? A polished scene should remain useful when all decorative glow is disabled.

## First fix the relationship between training and animation

The current worker calls `model.fit` for two epochs on a 64-example batch, then samples a separate test image and sends a prediction. It does not send weights, gradients, biases, or optimizer updates. The backward animation restores particle positions. This is a sequence of post-training predictions rather than a visualization of the updates that produced them.

Introduce a step record with a stable run/step ID, batch membership, selected training example, model version, optimizer configuration, activations and preactivations, probabilities, loss, weight/bias gradients, parameters before and after the update, and actual parameter deltas. Explicitly distinguish selected-example values from batch aggregates. The model updates from the aggregate batch gradient, not necessarily from the selected example's gradient alone.

Use an explicit training step that computes gradients, captures the required data, applies the optimizer once, and captures the actual update. TensorFlow.js exposes gradient computation and optimizer application APIs; validate the chosen implementation against the locked version before integration. Parameter gradients alone do not expose all hidden-layer error signals: compute/capture those explicitly if the backward neuron animation represents them. Do not calculate a fresh backward pass against already-updated weights and label it as the update's original gradient. [TensorFlow.js reference](https://js.tensorflow.org/api/latest/#variableGrads).

For SGD, the explanatory update can show `Δw = −learningRate × gradient`. The current optimizer is Adam, so the interface must show its actual delta and explain the influence of accumulated moments. Never silently use the SGD formula for an Adam update.

Two execution modes share the same model and record format:

- **Step training:** compute the current step's forward values and gradients; present Input → Forward → Loss → Backward; apply the pending update when the user advances to Update; capture after-values; then request the next batch. Settings stay fixed during a pending step. Replay does not apply the update again.
- **Continuous training:** the worker trains freely and emits bounded, sampled records plus aggregate metrics. The UI states which steps are recorded, which are omitted, and how far the displayed record trails live training. The user can pause training and inspect history.

Training progress and playback time are distinct. Scrubbing rewinds a captured record; resuming training from a historical step requires an explicit checkpoint restore/branch action. Adam checkpoints need optimizer state as well as model weights. Seeded initialization and batch ordering help comparisons, but do not promise bitwise reproducibility across different GPU backends.

## A consistent visual language

| Quantity | Representation | Meaning and limits |
| --- | --- | --- |
| Input | Flat 28 × 28 grayscale tile plane | Preserve pixel intensity and its mapping to 784 input values. |
| Neuron activation | Core intensity plus optional restrained size change | Magnitude of `a`; dead ReLUs remain dim. For signed activations, use a diverging scale. |
| Preactivation | Inspector value and optional alternate color mode | `z = Σ(w × a) + b`, distinct from activation. |
| Weight | Edge width for magnitude; blue/orange for sign | Weight mode has a fixed, visible scale; selection adds an outline rather than replacing sign color. |
| Forward contribution | A pulse on the corresponding edge | Pulse intensity encodes `|w × a|`; hue encodes its sign. Travel is a diagrammatic sequence, not a physical signal speed. |
| Gradient | Backward pulse and a signed gradient overlay | Encodes a named derivative; do not mix gradient hue with weight hue in the same mode. |
| Parameter update | Brief edge emphasis and before/after values | Actual `Δw` and `Δb`; highlight the update phase separately from the gradient phase. |
| Output | Ten probability bars and their matching output neurons | Keep all classes in fixed order; clearly mark predicted and true classes. |

Provide a visible legend for every mode, a scale lock, and an optional labelled logarithmic scale. Autoscaling every frame can make a tiny update look as large as an early update; keep a stable reference when comparing training steps. Clamp display intensity without discarding raw inspector values. Do not promise loss decreases on every stochastic update.

Default to an angled, stable arrangement of layer planes, with generous spacing and a clear input-to-output direction. Offer overview, side-on schematic, and focused-layer camera presets. Smooth camera transitions stop immediately when the user takes control. Camera fitting must account for the panels covering the viewport.

## Animation and shader design

**Neuron material:** one shared instanced material per compatible group. Feed activation, gradient, selection, and update magnitude through attributes or a data texture. A fragment shader provides a crisp core and a restrained rim. Selection, activation, and error indicators must be distinguishable.

**Connection material:** instanced camera-facing ribbons with start/end positions, signed weight, contribution, gradient, update magnitude, and layer/stage IDs. Derive ribbon position and pulse position from the same bounded phase uniform. Animate light along fixed connections instead of moving neuron/weight spheres into a common center. Use direction-aware pulses for forward and backward phases, and suppress pulses for zero contributions.

**Update transition:** interpolate the displayed weight encoding between captured before/after values. Make clear that this is a slowed depiction of one discrete optimizer update, not extra intermediate optimizer steps.

**Glow:** optional selective bloom for active/selected structures, with restrained intensity and a low-quality fallback. Keep labels and charts outside bloom. Test dense overlapping ribbons: transparency and additive blending can wash out values and consume fill rate even with few draw calls.

All animation is a deterministic function of the record, phase, and playback time. Avoid wall-clock-only beam shaders, which continue moving when a timeline is paused. Replay, reverse inspection, and scrubbing must reconstruct the same scene values without running training again.

The embeddings repo's `AnimatedBeam` is a good visual reference for pulse/glow, but its individual cylinders, materials, and trails should not be copied for all 12,960 ANN connections. Use batched geometry and shared shaders. Three.js provides the relevant [shader material](https://threejs.org/docs/pages/ShaderMaterial.html) and [instanced geometry](https://threejs.org/docs/pages/InstancedBufferGeometry.html) primitives.

## Inspection that makes the model understandable

- Select a neuron to isolate its incoming/outgoing connections and pin its values: bias, weighted sum, activation, gradient, and largest signed contributions. Display the remaining contributions as a residual so the explanation still sums correctly.
- Select an edge to see source activation, weight, contribution, batch gradient, optimizer update, and before/after weight. Show the exact step ID alongside it.
- Offer all edges, selected-neuron edges, strongest weights, strongest contributions, and largest updates. Display the visible/total connection count. Changing visibility never changes model connectivity.
- Add a synchronized weight-matrix view. The first hidden layer's sixteen 784-weight vectors can each be reshaped into a 28 × 28 signed heatmap, revealing their relationship to input pixels. Call these weight maps; do not assert that an individual neuron necessarily learns a human-readable concept.
- Track the same fixed probe examples across checkpoints to make improvement and regressions comparable. These are read-only evaluations, separate from the training batches. Distinguish confidence from calibrated certainty.
- Plot training loss, validation accuracy, gradient norms, and update norms. Mark the currently inspected step. Detailed activation distributions, confusion matrices, and inactive-ReLU statistics belong in optional diagnostics.

## UI continuity with the word-embeddings explorer

Reference inspected: `../visualize-word-embeddings/src/App.css`, `src/pages/EmbeddingViewer.jsx`, `src/components/CartesianSpace.jsx`, and the portfolio's capabilities screenshot.

Retain its navy canvas (`#101820`), translucent dark panels, subtle borders, compact typography, 8 px panel corners, emerald actions, cyan accents, consistent rail sizing, mode tabs, and timeline controls. Reuse the visual rules and interaction patterns while splitting the ANN interface into small components.

| Embeddings pattern | ANN adaptation |
| --- | --- |
| Left relationship controls | Train / Inspect / Compare modes; architecture, optimizer, learning rate, batch size, seed, start/pause/reset |
| Central embedding space | Layered network with stage readout, selection focus, camera presets, and uncluttered labels |
| Right Semantic Story | Training Step panel: input/target, prediction, loss, selected contributions, gradients, and measured update |
| Prev / Next / Replay timeline | Input / Forward / Loss / Backward / Update phases, step ID, speed, phase stepping, and recorded-history scrubbing |
| Heatmap and halo controls | Activation / Weight / Gradient / Update modes; connection filtering and selected-neuron neighborhood |

The Training Step panel should explain captured numbers with deterministic text, including cases where loss worsens. It must not infer causal stories from mere correlations or use decorative language to imply a neuron “understands” a shape.

Separate model controls from presentation controls. Architecture changes start a new run. Apply learning-rate changes only at a recorded update boundary. Changing the optimizer requires explicit treatment of optimizer state. Pause training and pause visualization must be separately understandable in continuous mode.

## Rendering and data architecture

Training worker → bounded step-record store → playback controller → Three.js scene. React owns low-frequency UI state; refs/buffers/uniforms own per-frame presentation. The renderer consumes immutable records and never mutates the model.

Use a few geometry groups for neurons, static connections, active pulses, and selection highlights. Remove duplicate inactive segment sets and avoid one React component per edge. Update numeric buffers when the training record changes; per frame, update only phase/camera uniforms where possible. Reuse scratch vectors/matrices and dispose resources on run replacement.

Use transferable typed-array buffers with explicit ownership and a bounded pool. Keep sparse checkpoints and a configurable recent-history ring rather than an unlimited queue of all activations/weights/gradients. For the current 13,002 parameters, one Float32 parameter array is about 50.8 KiB; four such arrays per step already approach 198 MiB over 1,000 steps, before other data. Record detailed batch-wide activations only when requested.

Use demand rendering when paused, adaptive DPR, bounded label counts, and density/quality presets. Profile GPU contention between training and rendering before choosing a training backend: workers move JavaScript off the main thread but do not eliminate contention on a shared GPU. Maintain WebGL compatibility first; consider WebGPU only after compatibility and profiling establish a benefit. R3F's [performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls) support keeping frame work out of React state and avoiding allocations in hot loops.

Suggested performance targets are goals to validate on named devices: 60 FPS desktop in the default scene, 30 FPS on a lower-power profile, no growing tensor count after repeated run resets, and bounded record-store memory. Never improve frame rate by silently changing training or hiding unreported data.

## Implementation sequence and quality gates

1. **One truthful training step:** explicit gradients/update capture, stable worker lifecycle, run IDs, pause/resume, bounded records, and current-sample/batch semantics. Compare forward values and gradients with a trusted implementation and small finite-difference checks.
2. **Scene and UI foundation:** embeddings-style rails, fitted layer layout, inspectors, weight heatmaps, and a scrub-capable stage timeline. A selected neuron's weighted sum plus bias must reconstruct its displayed preactivation.
3. **GPU animation system:** shared neuron shader, instanced connection ribbons, phase-driven pulses, actual update transitions, selection effects, and quality controls. Pausing freezes effects; replay applies zero extra optimizer steps.
4. **Training over time:** fixed probe comparisons, run comparison with matched seeds/batches, checkpoint history, diagnostics, and optional deeper architecture controls. Restoring an Adam run must restore its moments too.

The first complete milestone should be one batch whose entire learning step can be watched, paused, scrubbed, inspected numerically, and replayed accurately inside the new UI. That validates both the visual promise and the model semantics before adding more effects.
