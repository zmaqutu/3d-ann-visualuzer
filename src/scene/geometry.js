export function layerPositions(sizes, outputLayout = 'horizontal') {
  const xs = [-6, -1.8, 2.1, 6];
  return sizes.map((count, layer) =>
    Array.from({ length: count }, (_, index) => {
      if (layer === 0)
        return [xs[layer], (13.5 - Math.floor(index / 28)) * 0.17, (13.5 - (index % 28)) * 0.17];
      if (layer === 3)
        return outputLayout === 'horizontal'
          ? [xs[layer] + (index - 4.5) * 0.48, 0, 0]
          : [xs[layer], (4.5 - index) * 0.48, 0];
      const columns = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / columns);
      return [
        xs[layer],
        ((rows - 1) / 2 - Math.floor(index / columns)) * 0.65,
        ((index % columns) - (columns - 1) / 2) * 0.65,
      ];
    }),
  );
}
export function connectionData(sizes, positions, record, initial, mode, filter, selection) {
  const edges = [];
  const layers = record?.before || initial?.weights;
  if (!layers) return edges;
  for (let l = 0; l < sizes.length - 1; l++) {
    for (let j = 0; j < sizes[l + 1]; j++) {
      const candidates = [];
      for (let i = 0; i < sizes[l]; i++) {
        const k = j * sizes[l] + i;
        const weight = layers[l].weights[k];
        const afterWeight = record?.after?.[l].weights[k] ?? weight;
        let value = weight,
          after = afterWeight;
        if (mode === 'activation') {
          value *= record?.trace.activations[l][i] ?? 0;
          after *= record?.afterTrace?.activations[l][i] ?? record?.trace.activations[l][i] ?? 0;
        } else if (mode === 'gradient') {
          value = record?.gradients[l].weights[k] ?? 0;
          after = value;
        } else if (mode === 'update') {
          value = record?.delta?.[l].weights[k] ?? 0;
          after = value;
        }
        const related =
          selection &&
          ((selection.layer === l && selection.index === i) ||
            (selection.layer === l + 1 && selection.index === j));
        if (filter === 'focus' && !related) continue;
        candidates.push({
          start: positions[l][i],
          end: positions[l + 1][j],
          value,
          after,
          weight,
          weightAfter: afterWeight,
          contribution: weight * (record?.trace.activations[l][i] ?? 0),
          contributionAfter:
            afterWeight *
            (record?.afterTrace?.activations[l][i] ?? record?.trace.activations[l][i] ?? 0),
          gradient: record?.gradients[l].weights[k] ?? 0,
          update: record?.delta?.[l].weights[k] ?? 0,
          layer: l,
          related,
          rank: Math.abs(mode === 'activation' && !record ? weight : value),
        });
      }
      if (filter === 'strongest') candidates.sort((a, b) => b.rank - a.rank);
      edges.push(...(filter === 'strongest' ? candidates.slice(0, 8) : candidates));
    }
  }
  return edges;
}
