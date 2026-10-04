# Neural Observatory

Watch a dense neural network learn to recognize MNIST digits, one real optimizer update at a time. The scene, timeline, inspector, and charts share the same recorded computation.

## Run locally

Use Node.js 22 and npm:

```sh
npm ci
npm start
```

The initial load downloads the MNIST sprite and labels from Google's public TensorFlow.js example dataset. Training then runs locally in a Web Worker. The browser needs WebGL for the scene and worker-side `OffscreenCanvas` / `createImageBitmap` for dataset decoding. Download and initialization failures expose a retry action.

```sh
npm run lint
npm test -- --watchAll=false --runInBand
npm run build
```

The existing GitHub Pages `homepage` and deployment script are retained. Building does not deploy the site.

## Explore

- **Train one batch** follows Input → Forward → Loss → Backward → Update → Compare. Preparing a batch computes gradients; only reaching Update applies them. Continuous training repeats this same visible sequence.
- Pause, scrub, change playback speed, or replay a recorded update. Replaying a committed record never updates the model again. The last 32 steps are retained; choosing history inspects a snapshot, not a restored model checkpoint.
- Switch between signals, signed weights, mean batch gradients, and actual optimizer changes. Signals automatically displays gradients in Backward and parameter changes in Update.
- Click a neuron or use the keyboard-accessible layer and neuron selectors. Inspect its weighted sum, activation, sample derivative, top contributions, and any individual incoming weight's batch gradient and update.
- First-layer weight maps reshape each neuron's 784 weights into a 28 × 28 tile. They show learned parameters, not training images or a claim that every neuron has learned a recognizable digit.
- The default **Clear input** view shows the eight strongest pixel links per first-layer neuron, while keeping every hidden-to-hidden and hidden-to-output connection visible: 544 displayed links with 16-unit hidden layers. The model still has all 12,960 connections. Scene controls include all-connections / strongest-eight / selected-neuron views, connection intensity, horizontal or vertical outputs, camera presets, layer spacing, resolution cap, and shader highlights. Filtering affects only the visualization.
- Horizontal outputs face the camera and remain left-to-right as you orbit; their connection endpoints and class labels follow the same positions. Stars are a permanent part of the scene.
- The output row highlights the **top predicted class**, its probability, and whether it is correct, including failures. It appears after the forward pass and switches to the updated prediction at Compare. The side panel retains both top and true labels.
- Configure a new run with two hidden layers of 8, 16, or 24 units, SGD or Adam, batch size, learning rate, and seed. New runs reset weights, optimizer state, sampler, and history.

## What the visualization means

Hidden layers use ReLU; the ten outputs use stable softmax with cross-entropy loss. Weights are initialized deterministically from the seed; minibatches use a seeded shuffle over the first 55,000 examples. Training and sampling repeat for a given configuration. There is no pretrained starting point.

The displayed input is the first example in the batch. Activations and neuron derivatives belong to that example. Edge gradients and optimizer updates belong to the **mean batch loss**. Adam's actual update includes its moment estimates; it is not simply `−learningRate × gradient`. Before/after losses evaluate the same batch at the two parameter states.

Violet resting lines show connectivity even before training. During the calculation, electric-blue edges are positive and orange edges are negative. Edge width/opacity encodes magnitude on fixed, clipped display scales: contribution and weight ±1, gradient ±0.1, update ±0.01. Opaque emerald nodes encode activation magnitude (clipped to 0–1, with a square-root display curve to keep smaller nonzero values visible); signed node colors in Backward/Update encode the sample preactivation derivative / batch bias update respectively. Exact values remain available in the inspector. Forward pulses reach each layer before its activation lights up. Gradient colors propagate from output back toward the input; the update visualization ramps in after the commit. GPU pulses and node reveals use the same clock, including while scrubbing. Pulse movement communicates calculation order, not physical signal speed. Stars are static decoration and do not keep paused rendering running.

The loss chart shows **pre-update mean batch loss**, so consecutive points can increase because batches differ. Probe accuracy uses 64 fixed held-out digits from the remaining 10,000 examples; it is not full test-set accuracy. An update can worsen an individual example or batch.

## Architecture and validation

- `src/model/network.js`: explicit forward pass, backpropagation, SGD, and Adam using Float64 computation; Float32 snapshots for display.
- `src/model/dataset.js`: checked sprite loading, compact Uint8 pixel storage, seeded minibatches, fixed held-out probes.
- `src/workers/worker.js`: run-scoped initialize / prepare / commit protocol; stale requests and duplicate commits cannot apply a second update.
- `src/hooks/useTraining.js`: worker lifetime, loading/error state, request guard, bounded history.
- `src/model/playback.js`: deterministic timeline and commit boundary.
- `src/scene/`: instanced neurons and shader ribbons, shared materials, demand rendering while paused, camera controls.
- `src/ui/`: probabilities, history, neuron/connection inspector, weight maps.

Tests check finite-difference gradients, stable loss, exact SGD updates, Adam moment updates, deterministic initialization, safe replay, worker resets, loading/error UI, and resuming a pending update from history. An independent TensorFlow.js CPU reference checks gradients and multiple SGD/Adam steps. TensorFlow is a development-only dependency and is not imported by the application.

This is the first implementation of the [visualization design](docs/ANN_VISUALIZATION_DESIGN.md), following the [repository audit](docs/REPOSITORY_AUDIT.md). Deferred work includes optimizer-state checkpoint restoration, comparisons between saved runs, full test-set evaluation, export/import, and dedicated device performance profiling. The application still uses Create React App; modernization of that build toolchain is separate work.

MNIST sprite decoding is adapted from the Apache-2.0 licensed Google TensorFlow.js examples; attribution is retained in the loader.
