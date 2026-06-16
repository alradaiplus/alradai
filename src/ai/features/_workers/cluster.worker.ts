// Cluster worker. Greedy centroid clustering with cosine threshold.
//
// Input  : Array<{ id: string; v: Float32Array }>
// Output : Array<{ memberIds: string[]; centroid: Float32Array }>
//
// Deterministic. Idempotent for a fixed input order. Designed to run
// inside a Web Worker so the main thread stays at 60 fps during the
// weekly discovery pass.

export type WorkerInput = {
  blocks: Array<{ id: string; v: number[] }>;
  threshold: number; // cosine
  minSize: number;
};

export type WorkerOutput = {
  clusters: Array<{ memberIds: string[]; centroid: number[] }>;
};

function cosine(a: number[] | Float32Array, b: number[] | Float32Array): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

function normalize(v: number[]): number[] {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  const out = new Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
}

export function cluster(input: WorkerInput): WorkerOutput {
  const { blocks, threshold, minSize } = input;
  const centroids: number[][] = [];
  const members: string[][] = [];

  for (const { id, v } of blocks) {
    let bestIdx = -1;
    let best = -Infinity;
    for (let i = 0; i < centroids.length; i++) {
      const c = cosine(v, centroids[i]);
      if (c > best) {
        best = c;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && best >= threshold) {
      const idx = bestIdx;
      const list = members[idx];
      list.push(id);
      // running mean of unit vectors, then re-normalize.
      const c = centroids[idx];
      const n = list.length;
      for (let i = 0; i < c.length; i++) c[i] = c[i] + (v[i] - c[i]) / n;
      centroids[idx] = normalize(c);
    } else {
      centroids.push(normalize(v.slice()));
      members.push([id]);
    }
  }

  const clusters = members
    .map((memberIds, i) => ({ memberIds, centroid: centroids[i] }))
    .filter((c) => c.memberIds.length >= minSize);

  return { clusters };
}

// Worker bridge
type WorkerSelf = {
  onmessage: ((e: MessageEvent<WorkerInput>) => void) | null;
  postMessage: (data: WorkerOutput) => void;
};
const ws = typeof self !== 'undefined' ? (self as unknown as WorkerSelf) : null;
if (ws && 'onmessage' in ws) {
  ws.onmessage = (e: MessageEvent<WorkerInput>) => {
    const out = cluster(e.data);
    ws.postMessage(out);
  };
}
