export function shannonEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  const len = str.length;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function isHighEntropyString(value: string): boolean {
  if (value.length < 20) return false;
  const entropy = shannonEntropy(value);
  if (/^[A-Za-z0-9+/=_-]+$/.test(value) && entropy >= 4.3) return true;
  if (/^[0-9a-fA-F]+$/.test(value) && entropy >= 3.5) return true;
  return false;
}
