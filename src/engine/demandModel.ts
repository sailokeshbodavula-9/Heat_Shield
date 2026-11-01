/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DemandModel } from '../types/index.ts';

export interface MatchedDemandDay {
  date: string;
  tmax_c: number;
  demand_mw: number;
}

/**
 * Solves a 3x3 system of linear equations A * x = b using Gaussian elimination with partial pivoting.
 */
function solve3x3(A: number[][], b: number[]): [number, number, number] {
  // Make deep copies
  const M = [
    [...A[0]],
    [...A[1]],
    [...A[2]],
  ];
  const rhs = [...b];

  for (let i = 0; i < 3; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < 3; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }
    // Swap rows
    const tempRow = M[i];
    M[i] = M[maxRow];
    M[maxRow] = tempRow;

    const tempRhs = rhs[i];
    rhs[i] = rhs[maxRow];
    rhs[maxRow] = tempRhs;

    // Eliminate
    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-12) {
      throw new Error('Singular matrix in quadratic regression');
    }

    for (let k = i + 1; k < 3; k++) {
      const factor = M[k][i] / pivot;
      for (let j = i; j < 3; j++) {
        M[k][j] -= factor * M[i][j];
      }
      rhs[k] -= factor * rhs[i];
    }
  }

  // Back substitution
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    let sum = rhs[i];
    for (let j = i + 1; j < 3; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }

  return [x[0], x[1], x[2]];
}

/**
 * Pure Ordinary Least Squares fit for: y = a + b*T + c*T^2
 */
export function fitQuadraticOLS(
  temperatures: number[],
  demands: number[]
): {
  coefficients: [number, number, number];
  r2: number;
  residualStd: number;
  mapePct: number;
  predict: (t: number) => number;
} {
  const N = temperatures.length;
  if (N < 3) {
    throw new Error('At least 3 points required for quadratic regression');
  }

  let sumT = 0, sumT2 = 0, sumT3 = 0, sumT4 = 0;
  let sumY = 0, sumTY = 0, sumT2Y = 0;

  for (let i = 0; i < N; i++) {
    const t = temperatures[i];
    const y = demands[i];
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;

    sumT += t;
    sumT2 += t2;
    sumT3 += t3;
    sumT4 += t4;

    sumY += y;
    sumTY += t * y;
    sumT2Y += t2 * y;
  }

  const XTX = [
    [N, sumT, sumT2],
    [sumT, sumT2, sumT3],
    [sumT2, sumT3, sumT4],
  ];
  const XTy = [sumY, sumTY, sumT2Y];

  const coefficients = solve3x3(XTX, XTy);
  const [a, b, c] = coefficients;

  const predict = (t: number) => a + b * t + c * t * t;

  // Compute R^2, residuals, and MAPE
  const meanY = sumY / N;
  let ssTot = 0;
  let ssRes = 0;
  let sumApe = 0;

  for (let i = 0; i < N; i++) {
    const actual = demands[i];
    const pred = predict(temperatures[i]);
    const res = actual - pred;

    ssTot += (actual - meanY) * (actual - meanY);
    ssRes += res * res;
    if (actual !== 0) {
      sumApe += Math.abs(res / actual);
    }
  }

  const r2 = ssTot === 0 ? 1.0 : Math.max(0, 1 - ssRes / ssTot);
  const residualStd = Math.sqrt(ssRes / Math.max(1, N - 3));
  const mapePct = (sumApe / N) * 100;

  return {
    coefficients,
    r2,
    residualStd,
    mapePct,
    predict,
  };
}

/**
 * Trains demand model using chronological 80/20 train/test split.
 * Enforces >= 90 matched days check (L10 & T6).
 */
export function trainDemandModel(matchedDays: MatchedDemandDay[]): DemandModel {
  if (matchedDays.length < 90) {
    const err = new Error(`Need at least 90 days of data; found ${matchedDays.length}.`);
    (err as any).code = 'DEMAND_TOO_FEW_DAYS';
    throw err;
  }

  // Chronological sort
  const sorted = [...matchedDays].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const trainCount = Math.floor(sorted.length * 0.8);
  const trainSet = sorted.slice(0, trainCount);
  const testSet = sorted.slice(trainCount);

  const trainTemps = trainSet.map((d) => d.tmax_c);
  const trainDemands = trainSet.map((d) => d.demand_mw);

  const fitResult = fitQuadraticOLS(trainTemps, trainDemands);

  // Evaluate on test set
  let ssTot = 0;
  let ssRes = 0;
  let sumApe = 0;
  const testMean = testSet.reduce((acc, d) => acc + d.demand_mw, 0) / testSet.length;

  const testActual: number[] = [];
  const testPredicted: number[] = [];
  const testDates: string[] = [];

  for (const d of testSet) {
    const pred = fitResult.predict(d.tmax_c);
    const res = d.demand_mw - pred;

    testActual.push(d.demand_mw);
    testPredicted.push(Number(pred.toFixed(1)));
    testDates.push(d.date);

    ssTot += (d.demand_mw - testMean) * (d.demand_mw - testMean);
    ssRes += res * res;
    if (d.demand_mw !== 0) {
      sumApe += Math.abs(res / d.demand_mw);
    }
  }

  const r2Test = ssTot === 0 ? 1.0 : Math.max(0, 1 - ssRes / ssTot);
  const mapeTestPct = (sumApe / testSet.length) * 100;
  const residualStdMw = Math.sqrt(ssRes / Math.max(1, testSet.length - 3));

  return {
    coefficients: [
      Number(fitResult.coefficients[0].toFixed(4)),
      Number(fitResult.coefficients[1].toFixed(4)),
      Number(fitResult.coefficients[2].toFixed(4)),
    ],
    train_days: trainSet.length,
    test_days: testSet.length,
    r2_test: Number(r2Test.toFixed(3)),
    mape_test_pct: Number(mapeTestPct.toFixed(1)),
    residual_std_mw: Number(residualStdMw.toFixed(1)),
    testActual,
    testPredicted,
    testDates,
  };
}
