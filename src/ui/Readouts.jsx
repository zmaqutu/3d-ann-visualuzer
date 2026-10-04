import React, { useEffect, useRef, useState } from 'react';
import { argmax } from '../model/network';
export const number = (value, digits = 3) => (Number.isFinite(value) ? value.toFixed(digits) : '—');
export function PixelImage({ pixels, weights = false, size = 112 }) {
  const canvas = useRef();
  useEffect(() => {
    const context = canvas.current.getContext('2d');
    const image = context.createImageData(28, 28);
    for (let i = 0; i < 784; i++) {
      const value = pixels?.[i] || 0;
      const intensity = Math.min(1, Math.abs(value) * (weights ? 4 : 1));
      const tint = weights ? (value < 0 ? [250, 149, 82] : [78, 195, 238]) : [218, 248, 234];
      for (let c = 0; c < 3; c++) image.data[i * 4 + c] = 15 + (tint[c] - 15) * intensity;
      image.data[i * 4 + 3] = 255;
    }
    context.putImageData(image, 0, 0);
  }, [pixels, weights]);
  return (
    <canvas
      ref={canvas}
      width="28"
      height="28"
      style={{ width: size, height: size }}
      className="pixel-image"
      role="img"
      aria-label={
        weights
          ? 'Signed input-weight map; blue positive, orange negative'
          : 'Selected MNIST training digit'
      }
    />
  );
}
export function Probabilities({ record, after }) {
  const values = (after ? record?.afterTrace : record?.trace)?.activations[3];
  const prediction = values ? argmax(values) : null;
  return (
    <div className="probabilities">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={`probability ${prediction === i ? 'predicted' : ''} ${record?.label === i ? 'target' : ''}`}
        >
          <span>{i}</span>
          <div className="probability-track">
            <i style={{ width: `${(values?.[i] || 0) * 100}%` }} />
          </div>
          <b>{values ? `${(values[i] * 100).toFixed(1)}%` : '—'}</b>
          <small>{record?.label === i ? 'true' : prediction === i ? 'top' : ''}</small>
        </div>
      ))}
    </div>
  );
}
export function LossChart({ records, selectedId, onSelect }) {
  const complete = records.filter((record) => record.committed);
  if (!complete.length)
    return (
      <div className="empty-chart">
        <span className="chart-guide" />
        Loss history appears after the first update.
      </div>
    );
  const max = Math.max(0.1, ...complete.map((r) => r.loss));
  const min = Math.min(0, ...complete.map((r) => r.loss));
  const position = (record, i) => [
    8 + (i / Math.max(1, complete.length - 1)) * 264,
    66 - ((record.loss - min) / (max - min)) * 56,
  ];
  return (
    <>
      <svg
        className="loss-chart"
        viewBox="0 0 280 76"
        role="img"
        aria-label="Mean training batch loss over recorded steps"
      >
        {[10, 38, 66].map((y) => (
          <line key={y} x1="0" x2="280" y1={y} y2={y} stroke="#23313b" />
        ))}
        <polyline
          points={complete
            .map(position)
            .map((p) => p.join(','))
            .join(' ')}
          fill="none"
          stroke="#70dcb0"
          strokeWidth="2"
        />
        {complete.map((r, i) => (
          <circle
            key={r.id}
            cx={position(r, i)[0]}
            cy={position(r, i)[1]}
            r={r.id === selectedId ? 4 : 2}
            fill={r.id === selectedId ? '#eefaf4' : '#70dcb0'}
          />
        ))}
      </svg>
      <div className="history-picks" aria-label="Recorded training steps">
        {complete.map((r) => (
          <button
            key={r.id}
            className={r.id === selectedId ? 'active' : ''}
            onClick={() => onSelect(r.id)}
            title={`Inspect step ${r.id}; batch loss ${number(r.loss)}`}
          >
            {r.id}
          </button>
        ))}
      </div>
    </>
  );
}
export function NeuronInspector({ record, selection, after }) {
  if (!record || !selection || selection.layer === 0)
    return (
      <p className="muted">
        {selection?.layer === 0 && record
          ? `Pixel ${selection.index}: ${number(record.input[selection.index])}. Select a hidden or output neuron to inspect its computation.`
          : 'Select a neuron in the scene to inspect its values and connections.'}
      </p>
    );
  const l = selection.layer - 1;
  const j = selection.index;
  const trace = after ? record.afterTrace || record.trace : record.trace;
  const params = after ? record.after || record.before : record.before;
  const inputs = trace.activations[l];
  const contributions = Array.from(inputs, (a, i) => ({
    i,
    weight: params[l].weights[j * inputs.length + i],
    value: a * params[l].weights[j * inputs.length + i],
  })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const remainder = contributions.slice(5).reduce((s, c) => s + c.value, 0);
  return (
    <div className="neuron-inspector">
      <div className="section-heading">
        <span>
          Layer {selection.layer} · neuron {j + 1}
        </span>
        <span className="badge">{after ? 'AFTER' : 'BEFORE'}</span>
      </div>
      <div className="metric-grid">
        <div>
          <span>Preactivation z</span>
          <strong>{number(trace.preactivations[l][j])}</strong>
        </div>
        <div>
          <span>Activation a</span>
          <strong>{number(trace.activations[l + 1][j])}</strong>
        </div>
        <div>
          <span>Bias</span>
          <strong>{number(params[l].biases[j], 4)}</strong>
        </div>
        <div>
          <span>Sample ∂L/∂z · before</span>
          <strong>{number(record.trace.deltas[l][j], 4)}</strong>
        </div>
      </div>
      <p className="formula">z = Σ(aᵢ × wᵢ) + b</p>
      <div className="contribution-table">
        <div>
          <span>Input</span>
          <span>Weight</span>
          <span>Contribution</span>
        </div>
        {contributions.slice(0, 5).map((c) => (
          <div key={c.i}>
            <span>{c.i + 1}</span>
            <span>{number(c.weight, 4)}</span>
            <span className={c.value < 0 ? 'negative' : 'positive'}>{number(c.value, 4)}</span>
          </div>
        ))}
        <div>
          <span>Remaining</span>
          <span>Σ</span>
          <span>{number(remainder, 4)}</span>
        </div>
      </div>
      <ConnectionInspector
        key={`${selection.layer}-${j}`}
        record={record}
        layer={l}
        neuron={j}
        inputs={inputs}
        after={after}
      />
      <p className="microcopy">
        Top contributions + remaining contributions + bias reconstruct z. Sample derivatives are
        measured before the update; the optimizer uses the mean batch gradient.
      </p>
      <div className="metric-grid">
        <div>
          <span>Batch ∂L/∂b</span>
          <strong>{number(record.gradients[l].biases[j], 5)}</strong>
        </div>
        <div>
          <span>Actual Δbias</span>
          <strong>{number(record.delta?.[l].biases[j], 5)}</strong>
        </div>
      </div>
    </div>
  );
}
export function WeightMaps({ record, initial, selected, onSelect, after }) {
  const layer = (after ? record?.after : record?.before)?.[0] || initial?.weights?.[0];
  const count = layer ? layer.biases.length : 16;
  return (
    <>
      <div className="weight-maps">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            className={selected?.layer === 1 && selected.index === i ? 'selected' : ''}
            onClick={() => onSelect({ layer: 1, index: i })}
            aria-label={`Inspect hidden layer one neuron ${i + 1}`}
          >
            <PixelImage
              weights
              pixels={layer?.weights.subarray(i * 784, (i + 1) * 784)}
              size={48}
            />
            <span>{String(i + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>
      <p className="microcopy">
        Each tile is one neuron's 784 input weights, reshaped to 28 × 28. Blue + / orange −. Fixed
        display range ±0.25; values outside the range are clipped visually.
      </p>
    </>
  );
}

function ConnectionInspector({ record, layer, neuron, inputs, after }) {
  const [source, setSource] = useState(0);
  const offset = neuron * inputs.length + source;
  const beforeWeight = record.before[layer].weights[offset];
  const afterWeight = record.after?.[layer].weights[offset];
  const weight = after ? (afterWeight ?? beforeWeight) : beforeWeight;
  return (
    <div className="connection-inspector">
      <label>
        Inspect incoming connection
        <input
          type="number"
          min="1"
          max={inputs.length}
          value={source + 1}
          onChange={(event) =>
            setSource(
              Math.max(
                0,
                Math.min(inputs.length - 1, Math.trunc(Number(event.target.value) || 1) - 1),
              ),
            )
          }
        />
      </label>
      <p className="microcopy">
        Input {source + 1}: {number(inputs[source], 5)} × {number(weight, 5)} ={' '}
        {number(inputs[source] * weight, 5)}
      </p>
      <div className="metric-grid">
        <div>
          <span>Weight · before</span>
          <strong>{number(beforeWeight, 5)}</strong>
        </div>
        <div>
          <span>Weight · after</span>
          <strong>{number(afterWeight, 5)}</strong>
        </div>
        <div>
          <span>Batch ∂L/∂w</span>
          <strong>{number(record.gradients[layer].weights[offset], 5)}</strong>
        </div>
        <div>
          <span>Actual Δweight</span>
          <strong>{number(record.delta?.[layer].weights[offset], 5)}</strong>
        </div>
      </div>
    </div>
  );
}
