/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScalingResult {
  scaled: number[];
  noVariation: boolean;
  min: number;
  max: number;
}

/**
 * Normalizes an array of numbers to the 0-1 range.
 * If max === min, every element gets 0.5 and noVariation is true.
 */
export function scaleValues(values: number[]): ScalingResult {
  if (values.length === 0) {
    return { scaled: [], noVariation: true, min: 0, max: 0 };
  }

  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }

  if (max === min) {
    return {
      scaled: values.map(() => 0.5),
      noVariation: true,
      min,
      max,
    };
  }

  const range = max - min;
  const scaled = values.map((v) => (v - min) / range);
  return {
    scaled,
    noVariation: false,
    min,
    max,
  };
}

/**
 * Direct array scaler matching T1 specification:
 * scaled([10,20,30]) → [0, 0.5, 1]; scaled([5,5,5]) → [0.5, 0.5, 0.5].
 */
export function scaled(values: number[]): number[] {
  return scaleValues(values).scaled;
}
