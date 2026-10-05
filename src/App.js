import ProjectCredit from './ProjectCredit';
import React, { Component, useCallback, useEffect, useRef, useState } from 'react';
import './App.scss';
import useTraining, { DEFAULT_SETTINGS } from './hooks/useTraining';
import NetworkScene, { SCALES } from './scene/NetworkScene';
import { PHASES, advanceTime } from './model/playback';
import { argmax } from './model/network';
import { predictionAt } from './scene/timing';
import {
  PixelImage,
  Probabilities,
  LossChart,
  NeuronInspector,
  WeightMaps,
  number,
} from './ui/Readouts';
class SceneBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="scene-fallback">
        The 3D renderer could not start. You can still train and inspect the numerical results in
        the panels.
      </div>
    ) : (
      this.props.children
    );
  }
}
const descriptions = [
  'A real training example enters the network. The first example in this batch is shown.',
  'Weighted contributions accumulate through two ReLU layers to produce ten class probabilities.',
  'Cross-entropy measures the prediction against the true label. The batch loss averages all examples.',
  'The chain rule computes derivatives at the current weights. No parameters have changed yet.',
  'Apply one optimizer update using the mean batch gradient. Edge transitions show actual parameter changes.',
  'Evaluate the same input and batch at the updated weights. An individual example can improve or worsen.',
];
export default function App() {
  const training = useTraining();
  const { request, status } = training;
  const [draft, setDraft] = useState(DEFAULT_SETTINGS);
  const [mode, setMode] = useState('activation');
  const [filter, setFilter] = useState('input-sparse');
  const [selection, setSelection] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [speed, setSpeed] = useState(() =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0.25 : 1,
  );
  const [time, setTime] = useState(0);
  const timeRef = useRef(0);
  const latestSeen = useRef(0);
  const [cameraPreset, setCameraPreset] = useState('overview');
  const [cameraKey, setCameraKey] = useState(0);
  const [quality, setQuality] = useState('high');
  const [glow, setGlow] = useState(
    () => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  const [spacing, setSpacing] = useState(1);
  const [outputLayout, setOutputLayout] = useState('vertical');
  const [intensity, setIntensity] = useState(1.4);
  const [edgeCount, setEdgeCount] = useState(0);
  const [rightTab, setRightTab] = useState('story');
  const [leftTab, setLeftTab] = useState('train');
  const latest = training.records[training.records.length - 1];
  const latestMeasurement = training.records.filter((item) => item.committed).at(-1);
  const record = training.records.find((r) => r.id === activeId) || latest;
  const phase = Math.min(5, Math.floor(time));
  const busy = ['loading', 'computing', 'applying'].includes(training.status);
  const effectiveMode =
    mode === 'activation' && phase === 3
      ? 'gradient'
      : mode === 'activation' && phase === 4
        ? 'update'
        : mode;
  const after = time >= 5 && record?.committed;
  const probabilities = (after ? record?.afterTrace : record?.trace)?.activations[3];
  const prediction = probabilities ? argmax(probabilities) : null;
  const scenePrediction = predictionAt(record, time);
  const setPlayhead = useCallback((value) => {
    timeRef.current = value;
    setTime(value);
  }, []);
  useEffect(() => {
    if (!latest) latestSeen.current = 0;
    if (latest && latest.id !== latestSeen.current) {
      latestSeen.current = latest.id;
      setActiveId(latest.id);
      setPlayhead(0);
      setPlaying(true);
    }
  }, [latest, setPlayhead]);
  useEffect(() => {
    if (training.status === 'error') {
      setPlaying(false);
      setContinuous(false);
    }
  }, [training.status]);
  useEffect(() => {
    if (!playing || !record) return undefined;
    let frame;
    let previous;
    let lastPaint = 0;
    function tick(now) {
      const delta = previous === undefined ? 0 : (now - previous) / 1000;
      previous = now;
      const next = advanceTime(timeRef.current, delta, speed, record.committed);
      timeRef.current = next;
      if (next >= 4 && !record.committed && status === 'prepared') request('commit', record.id);
      if (now - lastPaint > 60 || next >= 5.999) {
        setTime(next);
        lastPaint = now;
      }
      if (next >= 5.999) {
        setPlaying(false);
        if (continuous && record.id === latest?.id && status === 'committed') request('prepare');
        return;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, record, continuous, latest?.id, status, request]);
  function pause() {
    setPlaying(false);
    setContinuous(false);
  }
  function train(runContinuously = false) {
    if (busy || training.status === 'error') return;
    setContinuous(runContinuously);
    if (latest && !latest.committed) {
      if (activeId !== latest.id) setPlayhead(0);
      setActiveId(latest.id);
      setPlaying(true);
    } else training.request('prepare');
  }
  function seek(value) {
    pause();
    if (!record) return;
    const target = Math.min(record.committed ? 5.999 : 4, Math.max(0, value));
    setPlayhead(target);
    if (target >= 4 && !record.committed && status === 'prepared') request('commit', record.id);
  }
  function reset() {
    pause();
    setActiveId(null);
    latestSeen.current = 0;
    setSelection(null);
    setPlayhead(0);
    training.initialize(draft);
  }
  function inspectHistory(id) {
    pause();
    setActiveId(id);
    setPlayhead(5);
  }
  function selectNeuron(value) {
    setSelection(value);
    setRightTab('inspect');
  }
  const totalEdges = (record?.sizes || training.initial?.sizes || [784, 16, 16, 10])
    .slice(1)
    .reduce(
      (sum, count, i) =>
        sum + count * (record?.sizes || training.initial?.sizes || [784, 16, 16, 10])[i],
      0,
    );
  return (
    <main className="observatory">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            n<span>·</span>
          </span>
          <div>
            <strong>NEURAL OBSERVATORY</strong>
            <span>A network, learning in plain sight.</span>
          </div>
        </div>
        <div className="run-status">
          <i className={playing ? 'live' : ''} />
          <span>
            {training.status === 'loading'
              ? 'LOADING DATA'
              : playing
                ? 'LEARNING IN VIEW'
                : record
                  ? 'RUN PAUSED'
                  : 'UNTRAINED NETWORK'}
          </span>
          <b>MNIST / DENSE</b>
        </div>
      </header>
      <div className="workspace">
        <aside className="panel control-rail" aria-label="Training and visual controls">
          <div className="rail-heading">
            <span className="eyebrow">THE EXPERIMENT</span>
            <h1>
              Watch a network <br />
              <em>learn.</em>
            </h1>
            <p>Follow the numbers from the first pixel to the next weight update.</p>
          </div>
          <div className="tabs" role="group" aria-label="Control panels">
            <button
              className={leftTab === 'train' ? 'active' : ''}
              onClick={() => setLeftTab('train')}
            >
              Training
            </button>
            <button
              className={leftTab === 'view' ? 'active' : ''}
              onClick={() => setLeftTab('view')}
            >
              Scene
            </button>
          </div>
          {leftTab === 'train' ? (
            <>
              <div className="section-heading">
                <span>01 / MODEL</span>
                <span className="badge">FROM SCRATCH</span>
              </div>
              <div className="architecture">
                <span>784</span>
                <i>→</i>
                <span>{training.settings.width}</span>
                <i>→</i>
                <span>{training.settings.width}</span>
                <i>→</i>
                <span>10</span>
              </div>
              <details className="model-config">
                <summary>
                  Configure a new run <span>＋</span>
                </summary>
                <div className="config-content">
                  <div className="field-grid">
                    <label>
                      Hidden units
                      <select
                        value={draft.width}
                        onChange={(e) => setDraft({ ...draft, width: +e.target.value })}
                      >
                        {[8, 16, 24].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Optimizer
                      <select
                        value={draft.optimizer}
                        onChange={(e) => setDraft({ ...draft, optimizer: e.target.value })}
                      >
                        <option value="adam">Adam</option>
                        <option value="sgd">SGD</option>
                      </select>
                    </label>
                    <label>
                      Learning rate
                      <select
                        value={draft.learningRate}
                        onChange={(e) => setDraft({ ...draft, learningRate: +e.target.value })}
                      >
                        {[0.001, 0.003, 0.01, 0.03, 0.1].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Batch size
                      <select
                        value={draft.batchSize}
                        onChange={(e) => setDraft({ ...draft, batchSize: +e.target.value })}
                      >
                        {[1, 8, 32, 64].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="seed-field">
                    Initialization seed
                    <input
                      type="number"
                      min="0"
                      max="999999"
                      value={draft.seed}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          seed: Math.min(999999, Math.max(0, Number(e.target.value) || 0)),
                        })
                      }
                    />
                  </label>
                  <button className="subtle full" onClick={reset}>
                    ↻ New run with these settings
                  </button>
                  <p className="microcopy">
                    New run resets weights and history. Active: {training.settings.width} /{' '}
                    {training.settings.optimizer.toUpperCase()} / η {training.settings.learningRate}{' '}
                    / batch {training.settings.batchSize}.
                  </p>
                </div>
              </details>
              <div className="section-heading">
                <span>02 / TRAINING</span>
                <span className="tiny-dot" />
              </div>
              {training.status === 'loading' || training.status === 'error' ? (
                <div
                  className={`status-card ${training.status}`}
                  role={training.status === 'error' ? 'alert' : 'status'}
                >
                  {training.message}
                  {training.status === 'error' && <button onClick={reset}>Retry loading</button>}
                </div>
              ) : (
                <div className="training-actions">
                  <button
                    className="primary"
                    disabled={busy || playing}
                    onClick={() => train(false)}
                  >
                    {training.status === 'computing'
                      ? 'Computing gradients…'
                      : latest && !latest.committed
                        ? 'Resume this update'
                        : 'Train one batch'}
                    <span>↗</span>
                  </button>
                  <button
                    className={continuous ? 'active subtle' : 'subtle'}
                    disabled={busy && !playing}
                    onClick={() => (playing ? pause() : train(true))}
                  >
                    {playing ? 'Ⅱ Pause learning' : '▷ Train continuously'}
                  </button>
                </div>
              )}
              <p className="microcopy">
                Each batch advances with the animation. Updates happen at the Update stage; replay
                never trains twice.
              </p>
              <div className="section-heading">
                <span>03 / LOSS HISTORY</span>
                <span className="badge">LAST 32</span>
              </div>
              <LossChart
                records={training.records}
                selectedId={record?.id}
                onSelect={inspectHistory}
              />
              <div className="mini-stat">
                <span>Fixed held-out probe · 64 digits</span>
                <strong>
                  {latestMeasurement?.probeAccuracy !== undefined
                    ? `${(latestMeasurement.probeAccuracy * 100).toFixed(1)}%`
                    : '—'}
                </strong>
              </div>
              <p className="microcopy">
                Probe accuracy is a small, fixed comparison set, not full test-set accuracy.
              </p>
            </>
          ) : (
            <>
              <div className="section-heading">
                <span>VISUAL ENCODING</span>
              </div>
              <div className="mode-list">
                {[
                  ['activation', 'Activations', 'Signals through the network'],
                  ['weight', 'Weights', 'Signed connection strengths'],
                  ['gradient', 'Gradients', 'Derivatives before the update'],
                  ['update', 'Updates', 'Actual optimizer changes'],
                ].map(([value, name, copy]) => (
                  <button
                    key={value}
                    className={mode === value ? 'active' : ''}
                    onClick={() => setMode(value)}
                  >
                    <span>
                      {name}
                      <small>{copy}</small>
                    </span>
                    <i>{mode === value ? '●' : '○'}</i>
                  </button>
                ))}
              </div>
              <label>
                Connection visibility
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="input-sparse">Clear input · 8 per unit</option>
                  <option value="strongest">Strongest 8 per neuron</option>
                  <option value="all">All connections</option>
                  <option value="focus" disabled={!selection}>
                    Selected neuron only
                  </option>
                </select>
              </label>
              <p className="microcopy">
                Clear input shows eight strongest pixel links per hidden unit; every hidden and
                output connection remains visible. Filtering changes only the picture. Signals ranks
                forward contributions, or weights before training.
              </p>
              <label>
                Output arrangement
                <select value={outputLayout} onChange={(e) => setOutputLayout(e.target.value)}>
                  <option value="horizontal">Horizontal row</option>
                  <option value="vertical">Vertical column</option>
                </select>
              </label>
              <label>
                Connection intensity · {intensity.toFixed(1)}×
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={intensity}
                  onChange={(e) => setIntensity(+e.target.value)}
                />
              </label>
              <label>
                Camera
                <select value={cameraPreset} onChange={(e) => setCameraPreset(e.target.value)}>
                  <option value="overview">Spatial overview</option>
                  <option value="side">Layer schematic</option>
                  <option value="input">Input detail</option>
                </select>
              </label>
              <button className="subtle" onClick={() => setCameraKey((v) => v + 1)}>
                ↺ Reset camera
              </button>
              <label>
                Layer spacing · {spacing.toFixed(1)}×
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.1"
                  value={spacing}
                  onChange={(e) => setSpacing(+e.target.value)}
                />
              </label>
              <label>
                Render quality
                <select value={quality} onChange={(e) => setQuality(e.target.value)}>
                  <option value="high">Balanced · adaptive resolution cap</option>
                  <option value="low">Low · 1× resolution</option>
                </select>
              </label>
              <label className="switch-row">
                <span>Shader highlights</span>
                <input type="checkbox" checked={glow} onChange={(e) => setGlow(e.target.checked)} />
              </label>
              <p className="microcopy">
                Drag to orbit · scroll to zoom · click to inspect. Values use fixed scales so
                changes remain comparable.
              </p>
            </>
          )}
          <footer className="rail-footer">
            <span className="tiny-dot" /> REAL GRADIENTS. REAL UPDATES.
          </footer>
        </aside>
        <section className="scene-column" aria-label="Neural network visualization">
          <div className="scene-toolbar">
            <div>
              <span className="eyebrow">
                {record ? `STEP ${String(record.id).padStart(3, '0')}` : 'INITIAL STATE'}
              </span>
              <strong>{record ? PHASES[phase] : 'The untrained network'}</strong>
            </div>
            <div className="view-pills">
              {['activation', 'weight', 'gradient', 'update'].map((value) => (
                <button
                  key={value}
                  className={mode === value ? 'active' : ''}
                  onClick={() => setMode(value)}
                >
                  {value === 'activation'
                    ? 'Signals'
                    : value === 'weight'
                      ? 'Weights'
                      : value === 'gradient'
                        ? 'Gradients'
                        : 'Updates'}
                </button>
              ))}
            </div>
          </div>
          <div className="scene-viewport">
            <ProjectCredit />
            <SceneBoundary>
              <NetworkScene
                record={record}
                initial={training.initial}
                mode={mode}
                playhead={time}
                playing={playing}
                filter={filter}
                selection={selection}
                onSelect={selectNeuron}
                timeRef={timeRef}
                cameraPreset={cameraPreset}
                cameraKey={cameraKey}
                quality={quality}
                glow={glow}
                outputLayout={outputLayout}
                intensity={intensity}
                spacing={spacing}
                onCount={setEdgeCount}
              />
            </SceneBoundary>
            <div className="output-prediction">
              <span>TOP PREDICTION</span>
              {scenePrediction ? (
                <>
                  <strong>
                    {scenePrediction.index}{' '}
                    <small>{(scenePrediction.probability * 100).toFixed(1)}%</small>
                  </strong>
                  <em className={scenePrediction.correct ? 'correct' : 'incorrect'}>
                    {scenePrediction.correct ? 'Correct' : 'Incorrect'}
                  </em>
                </>
              ) : (
                <small>Awaiting forward pass</small>
              )}
            </div>
            <div className="scene-caption">
              <span>
                {edgeCount.toLocaleString()} / {totalEdges.toLocaleString()} connections
              </span>
              <button onClick={() => setCameraKey((v) => v + 1)} aria-label="Reset camera view">
                ↺
              </button>
            </div>
            {selection && (
              <div className="selection-chip">
                {selection.layer === 0 ? 'Pixel' : `Layer ${selection.layer} · neuron`}{' '}
                {selection.index + 1}
                <button
                  onClick={() => {
                    setSelection(null);
                    if (filter === 'focus') setFilter('input-sparse');
                  }}
                  aria-label="Clear selected neuron"
                >
                  ×
                </button>
                <button onClick={() => setFilter(filter === 'focus' ? 'input-sparse' : 'focus')}>
                  {filter === 'focus' ? 'Show network' : 'Isolate'}
                </button>
              </div>
            )}
          </div>
          <div className="legend">
            <span>
              <i className="negative-key" />
              Negative
            </span>
            <div className="legend-gradient" />
            <span>
              Positive
              <i className="positive-key" />
            </span>
            <small>
              {!record && 'Violet lines show resting connections. '}
              Edges:{' '}
              {effectiveMode === 'activation'
                ? 'a × w'
                : effectiveMode === 'gradient'
                  ? 'mean batch ∂L/∂w'
                  : effectiveMode === 'update'
                    ? 'Δw'
                    : 'w'}{' '}
              · fixed ±{SCALES[effectiveMode]}
              {effectiveMode === 'gradient'
                ? ' / nodes: sample ∂L/∂z'
                : effectiveMode === 'update'
                  ? ' / nodes: Δbias'
                  : ' / nodes: activation'}
            </small>
          </div>
          <div className="transport">
            <div className="transport-top">
              <div>
                <span className="eyebrow">TRAINING TIMELINE</span>
                <p>
                  {record
                    ? descriptions[phase]
                    : 'Start a batch to follow its forward pass, loss, gradients, and update.'}
                </p>
              </div>
              <select
                aria-label="Playback speed"
                value={speed}
                onChange={(e) => setSpeed(+e.target.value)}
              >
                {[0.25, 0.5, 1, 2, 4, 8].map((v) => (
                  <option key={v} value={v}>
                    {v}× speed
                  </option>
                ))}
              </select>
            </div>
            <div className="phase-buttons">
              {PHASES.map((name, i) => (
                <button
                  key={name}
                  disabled={!record || (!record.committed && i > 4)}
                  className={phase === i && record ? 'active' : ''}
                  onClick={() => seek(i + (i === 1 || i === 3 ? 0.5 : 0))}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {name}
                </button>
              ))}
            </div>
            <div className="playback-controls">
              <button
                disabled={!record}
                aria-label={playing ? 'Pause playback' : 'Play playback'}
                onClick={() => {
                  if (playing) pause();
                  else {
                    if (timeRef.current >= 5.999) setPlayhead(0);
                    setPlaying(true);
                  }
                }}
              >
                {playing ? 'Ⅱ' : '▶'}
              </button>
              <button
                disabled={!record}
                aria-label="Previous phase"
                onClick={() => seek(Math.floor(timeRef.current) - 1)}
              >
                ‹
              </button>
              <input
                aria-label="Training phase playhead"
                type="range"
                min="0"
                max={record?.committed ? '5.999' : '4'}
                step="0.01"
                value={time}
                disabled={!record}
                onChange={(e) => seek(+e.target.value)}
              />
              <button
                disabled={!record}
                aria-label="Next phase"
                onClick={() => seek(Math.min(5, Math.floor(timeRef.current) + 1))}
              >
                ›
              </button>
              <button
                disabled={!record}
                onClick={() => {
                  setContinuous(false);
                  setPlayhead(0);
                  setPlaying(true);
                }}
              >
                Replay
              </button>
            </div>
            <div className="timeline-note">
              <span>
                {record?.committed
                  ? 'RECORDED UPDATE · SAFE TO REPLAY'
                  : record
                    ? 'LIVE STEP · UPDATE NOT YET APPLIED'
                    : 'WAITING FOR FIRST BATCH'}
              </span>
              <span>{continuous ? 'CONTINUOUS' : 'STEP BY STEP'}</span>
            </div>
          </div>
        </section>
        <aside className="panel insight-rail" aria-label="Training step and neuron inspector">
          <div className="section-heading">
            <span>THE LEARNING STORY</span>
            <span className="badge">{after ? 'AFTER UPDATE' : 'BEFORE UPDATE'}</span>
          </div>
          <div className="tabs" role="group" aria-label="Inspector panels">
            {[
              ['story', 'Step'],
              ['inspect', 'Neuron'],
              ['maps', 'Weights'],
            ].map(([key, name]) => (
              <button
                key={key}
                className={rightTab === key ? 'active' : ''}
                onClick={() => setRightTab(key)}
              >
                {name}
              </button>
            ))}
          </div>
          {rightTab === 'story' ? (
            <>
              <div className="sample-card">
                <PixelImage pixels={record?.input} />
                <div>
                  <span className="eyebrow">TRAINING EXAMPLE</span>
                  <strong>{record ? `Digit ${record.label}` : 'Awaiting input'}</strong>
                  <small>
                    {record
                      ? `MNIST #${record.sampleId} · first of ${record.batchIds.length}`
                      : 'Start from random weights.'}
                  </small>
                  <span
                    className={`prediction-tag ${prediction === record?.label ? 'correct' : ''}`}
                  >
                    {prediction === null
                      ? 'No prediction yet'
                      : `Predicts ${prediction}${prediction === record.label ? ' · correct' : ' · incorrect'}`}
                  </span>
                </div>
              </div>
              <div className="section-heading">
                <span>CLASS PROBABILITIES</span>
                <span className="muted">softmax</span>
              </div>
              <Probabilities record={record} after={after} />
              <div className="metric-grid">
                <div>
                  <span>Batch loss · before</span>
                  <strong>{number(record?.loss)}</strong>
                </div>
                <div>
                  <span>Batch loss · after</span>
                  <strong>{number(record?.afterLoss)}</strong>
                </div>
                <div>
                  <span>Sample loss · {after ? 'after' : 'before'}</span>
                  <strong>{number(after ? record?.afterTrace.loss : record?.trace.loss)}</strong>
                </div>
                <div>
                  <span>Batch accuracy · before</span>
                  <strong>{record ? `${(record.accuracy * 100).toFixed(1)}%` : '—'}</strong>
                </div>
              </div>
              <div className="story-note">
                <span className="eyebrow">WHAT CHANGED?</span>
                <p>
                  {record?.committed
                    ? `One ${record.settings.optimizer.toUpperCase()} update ${record.afterLoss <= record.loss ? 'reduced' : 'increased'} this batch's mean loss by ${number(Math.abs(record.afterLoss - record.loss), 4)}. Compare the same input before and after; one update does not guarantee every example improves.`
                    : record
                      ? 'The backward pass computes derivatives at the current weights. The model stays unchanged until you reach Update.'
                      : 'An untrained classifier begins with random parameters. Each batch supplies evidence for one measured parameter update.'}
                </p>
              </div>
              <p className="microcopy">
                {training.settings.optimizer === 'adam'
                  ? 'Adam uses running first and second moments. Displayed Δ values are measured changes, not −η × gradient.'
                  : 'SGD applies Δw = −η × mean batch gradient.'}{' '}
                Pulse travel depicts calculation order, not physical signal speed.
              </p>
            </>
          ) : rightTab === 'inspect' ? (
            <>
              <h2>Inside a neuron</h2>
              <div className="field-grid">
                <label>
                  Layer
                  <select
                    value={selection?.layer === 0 ? '' : (selection?.layer ?? '')}
                    onChange={(e) => setSelection({ layer: +e.target.value, index: 0 })}
                  >
                    <option value="" disabled>
                      Choose layer
                    </option>
                    <option value="1">Hidden 01</option>
                    <option value="2">Hidden 02</option>
                    <option value="3">Output</option>
                  </select>
                </label>
                <label>
                  Neuron
                  <select
                    disabled={!selection || selection.layer === 0}
                    value={selection?.index ?? 0}
                    onChange={(e) => setSelection({ ...selection, index: +e.target.value })}
                  >
                    {Array.from(
                      { length: selection?.layer === 3 ? 10 : training.settings.width },
                      (_, i) => (
                        <option key={i} value={i}>
                          {i + 1}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              <NeuronInspector record={record} selection={selection} after={after} />
            </>
          ) : (
            <>
              <h2>Patterns in the weights</h2>
              <p className="muted">
                The first hidden layer, seen through the pixels it connects to.
              </p>
              <WeightMaps
                record={record}
                initial={training.initial}
                selected={selection}
                onSelect={selectNeuron}
                after={after}
              />
            </>
          )}
          <div className="insight-footer">
            784 inputs · ReLU hidden layers · softmax output
            <br />
            Cross-entropy loss · training runs in a worker
          </div>
        </aside>
      </div>
    </main>
  );
}
