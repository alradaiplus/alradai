/**
 * ULID — Crockford base32, time-sortable. 26 chars, 128 bits.
 * No deps. Works in any JS runtime.
 */
const ENC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function rand(n: number): number[] {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const out = new Uint8Array(n);
    crypto.getRandomValues(out);
    return Array.from(out);
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(Math.floor(Math.random() * 256));
  return out;
}

function encodeTime(ms: number): string {
  let s = '';
  for (let i = 9; i >= 0; i--) {
    s = ENC[ms % 32] + s;
    ms = Math.floor(ms / 32);
  }
  return s;
}

function encodeRand(bytes: number[]): string {
  let s = '';
  for (const b of bytes) s += ENC[b % 32];
  return s.slice(0, 16);
}

export function ulid(now: number = Date.now()): string {
  return encodeTime(now) + encodeRand(rand(16));
}

export function ulidTime(id: string): number {
  let t = 0;
  for (let i = 0; i < 10; i++) {
    const v = ENC.indexOf(id[i]);
    if (v < 0) return 0;
    t = t * 32 + v;
  }
  return t;
}
