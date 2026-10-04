import { useCallback, useEffect, useRef, useState } from 'react';
import { appendRecord } from '../model/playback';
export const DEFAULT_SETTINGS = {
  width: 16,
  optimizer: 'adam',
  learningRate: 0.003,
  batchSize: 32,
  seed: 42,
};
export default function useTraining() {
  const workerRef = useRef(null);
  const runRef = useRef(0);
  const busyRef = useRef(false);
  const [state, setState] = useState({
    status: 'loading',
    message: 'Preparing the training worker…',
    records: [],
    initial: null,
    settings: DEFAULT_SETTINGS,
  });
  const initialize = useCallback((settings) => {
    runRef.current++;
    busyRef.current = true;
    setState({
      status: 'loading',
      message: 'Initializing an untrained network…',
      records: [],
      initial: null,
      settings,
    });
    workerRef.current?.postMessage({ type: 'initialize', settings, runId: runRef.current });
  }, []);
  useEffect(() => {
    const worker = new Worker(new URL('../workers/worker.js', import.meta.url));
    workerRef.current = worker;
    worker.onmessage = ({ data }) => {
      if (data.runId !== runRef.current) return;
      if (['ready', 'prepared', 'committed', 'error'].includes(data.type)) busyRef.current = false;
      setState((previous) => {
        if (data.type === 'initial') return { ...previous, initial: data };
        if (data.type === 'loading') return { ...previous, message: data.message };
        if (data.type === 'ready')
          return {
            ...previous,
            status: 'ready',
            message: 'MNIST ready. Your network has not trained yet.',
          };
        if (data.type === 'prepared' || data.type === 'committed')
          return {
            ...previous,
            status: data.type,
            records: appendRecord(previous.records, data.record),
          };
        if (data.type === 'error') return { ...previous, status: 'error', message: data.message };
        return previous;
      });
    };
    worker.onerror = (event) => {
      busyRef.current = false;
      setState((previous) => ({
        ...previous,
        status: 'error',
        message: event.message || 'The training worker stopped. Reset to retry.',
      }));
    };
    initialize(DEFAULT_SETTINGS);
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [initialize]);
  const request = useCallback((type, id) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setState((previous) => ({
      ...previous,
      status: type === 'prepare' ? 'computing' : 'applying',
    }));
    workerRef.current?.postMessage({ type, id, runId: runRef.current });
  }, []);
  return { ...state, initialize, request };
}
