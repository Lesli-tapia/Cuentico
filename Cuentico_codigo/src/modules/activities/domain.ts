/** A stable Fisher–Yates shuffle: the same session always starts in the same order. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let value = 2166136261;
  for (const character of seed) value = Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0;
  const random = () => {
    value += 0x6d2b79f5;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  const output = [...items];
  for (let index = output.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  // An already solved activity gives away the answer. Rotate that rare permutation.
  if (output.length > 1 && output.every((item, index) => item === items[index])) output.push(output.shift()!);
  return output;
}

export function isCorrectSequence(order: readonly string[], expected: readonly string[]): boolean {
  return expected.length > 0 && order.length === expected.length && order.every((id, index) => id === expected[index]);
}
