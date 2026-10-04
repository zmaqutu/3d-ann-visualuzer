export const PHASES = ['Input', 'Forward', 'Loss', 'Backward', 'Update', 'Compare'];
export const HISTORY_LIMIT = 32;
export function appendRecord(records, record) {
  const existing = records.findIndex((item) => item.id === record.id);
  return (
    existing >= 0
      ? records.map((item) => (item.id === record.id ? record : item))
      : [...records, record]
  ).slice(-HISTORY_LIMIT);
}
export function advanceTime(time, delta, speed, committed) {
  const next = Math.min(5.999, time + (Math.min(delta, 0.1) * speed) / 1.5);
  return committed ? next : Math.min(4, next);
}
