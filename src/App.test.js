import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import NetworkScene from './scene/NetworkScene';
import useTraining from './hooks/useTraining';
jest.mock('./hooks/useTraining', () => ({
  __esModule: true,
  default: jest.fn(),
  DEFAULT_SETTINGS: { width: 16, batchSize: 32, optimizer: 'adam', learningRate: 0.003, seed: 42 },
}));
jest.mock('./scene/NetworkScene', () => ({
  __esModule: true,
  default: jest.fn(() => <div>Network scene</div>),
  SCALES: { activation: 1 },
}));
jest.mock('./ui/Readouts', () => ({
  PixelImage: () => null,
  Probabilities: () => null,
  LossChart: ({ onSelect }) => <button onClick={() => onSelect(1)}>Inspect history</button>,
  NeuronInspector: () => null,
  WeightMaps: () => null,
  number: () => '—',
}));
const settings = { width: 16, batchSize: 32, optimizer: 'adam', learningRate: 0.003, seed: 42 };
test('loading cannot start training or playback; errors offer recovery', () => {
  const initialize = jest.fn();
  useTraining.mockReturnValue({
    status: 'loading',
    message: 'Loading data',
    records: [],
    settings,
    initialize,
    request: jest.fn(),
  });
  const { rerender } = render(<App />);
  expect(screen.getByRole('button', { name: 'Play playback' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: /Train one batch/ })).not.toBeInTheDocument();
  useTraining.mockReturnValue({
    status: 'error',
    message: 'Download failed',
    records: [],
    settings,
    initialize,
    request: jest.fn(),
  });
  rerender(<App />);
  expect(screen.getByRole('alert')).toHaveTextContent('Download failed');
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading' }));
  expect(initialize).toHaveBeenCalledWith(settings);
});
test('ready state requests a real training batch', () => {
  const request = jest.fn();
  useTraining.mockReturnValue({
    status: 'ready',
    records: [],
    settings,
    initialize: jest.fn(),
    request,
  });
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Train one batch/ }));
  expect(request).toHaveBeenCalledWith('prepare');
});

test('resuming a pending batch from history starts its own timeline without committing early', () => {
  const request = jest.fn();
  const trace = { activations: [[], [], [], Array(10).fill(0.1)], loss: 2.3 };
  const completed = {
    id: 1,
    committed: true,
    sizes: [784, 16, 16, 10],
    settings,
    trace,
    afterTrace: trace,
    loss: 2.3,
    afterLoss: 2.2,
    accuracy: 0,
    batchIds: [1],
  };
  const pending = { ...completed, id: 2, committed: false };
  useTraining.mockReturnValue({
    status: 'prepared',
    records: [completed, pending],
    settings,
    initialize: jest.fn(),
    request,
  });
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Inspect history' }));
  expect(screen.getByRole('slider', { name: 'Training phase playhead' })).toHaveValue('5');
  fireEvent.click(screen.getByRole('button', { name: /Resume this update/ }));
  expect(screen.getByRole('slider', { name: 'Training phase playhead' })).toHaveValue('0');
  expect(request).not.toHaveBeenCalled();
});

test('scene defaults restore full connectivity, horizontal output, and optional stars', () => {
  useTraining.mockReturnValue({
    status: 'ready',
    records: [],
    settings,
    initialize: jest.fn(),
    request: jest.fn(),
  });
  render(<App />);
  const sceneProps = () => NetworkScene.mock.calls.at(-1)[0];
  expect(sceneProps()).toMatchObject({ filter: 'all', outputLayout: 'horizontal', stars: true });
  fireEvent.click(screen.getByRole('button', { name: 'Scene', exact: true }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Output arrangement' }), {
    target: { value: 'vertical' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Starfield' }));
  expect(sceneProps()).toMatchObject({ filter: 'all', outputLayout: 'vertical', stars: false });
});
