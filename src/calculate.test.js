import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyReturns,
  calculateAverageMonthlyReturns,
  calculateCumulativeReturns,
  calculateAbnormalReturns
} from './calculate.js';

function expectNumbersClose(received, expected, precision = 10) {
  const delta = Math.pow(10, -precision);
  const pass = Math.abs(received - expected) < delta;
  if (!pass) {
    console.error(`Expected ${expected} but received ${received}. Difference: ${Math.abs(received - expected)}`);
  }
  expect(pass).toBe(true);
}

describe('calculate.js', () => {
  describe('calculateMonthlyReturns', () => {
    it('should calculate monthly returns correctly', () => {
      const priceData = [[100, 110, 105, 115]];
      const expected = [[null, 0.1, -0.0454545455, 0.0952380952]];
      const result = calculateMonthlyReturns(priceData);
      expect(result.length).toBe(expected.length);
      expect(result[0].length).toBe(expected[0].length);
      result[0].forEach((value, index) => {
        if (value === null) {
          expect(value).toBeNull();
        } else {
          expectNumbersClose(value, expected[0][index]);
        }
      });
    });

    it('should handle null values', () => {
      const priceData = [[100, null, 105, 115]];
      const expected = [[null, null, null, 0.0952380952]];
      const result = calculateMonthlyReturns(priceData);
      expect(result.length).toBe(expected.length);
      expect(result[0].length).toBe(expected[0].length);
      result[0].forEach((value, index) => {
        if (value === null) {
          expect(value).toBeNull();
        } else {
          expectNumbersClose(value, expected[0][index]);
        }
      });
    });
  });

  describe('calculateAverageMonthlyReturns', () => {
    it('should calculate average monthly returns correctly', () => {
      const returns = [
        [null, 0.1, 0.05, 0.02],
        [null, 0.05, 0.03, 0.01]
      ];
      const [avgReturns, counts] = calculateAverageMonthlyReturns(returns);
      expect(avgReturns).toEqual([null, 0.075, 0.04, 0.015]);
      expect(counts).toEqual([0, 2, 2, 2]);
    });

    it('should handle null values', () => {
      const returns = [
        [null, 0.1, null, 0.02],
        [null, 0.05, 0.03, null]
      ];
      const [avgReturns, counts] = calculateAverageMonthlyReturns(returns);
      expect(avgReturns).toEqual([null, 0.075, 0.03, 0.02]);
      expect(counts).toEqual([0, 2, 1, 1]);
    });
  });

  describe('calculateCumulativeReturns', () => {
    it('should calculate cumulative returns correctly with high precision', () => {
      const returns = [[null, 0.1, 0.05, 0.02]];
      const expected = [[null, 0.1, 0.155, 0.1781]];
      const result = calculateCumulativeReturns(returns);
      expect(result).toEqual(expected);
    });

    it('should handle long sequences of returns without losing significant precision', () => {
      const returns = [[0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01]]; // 10 months of 1% return
      const result = calculateCumulativeReturns(returns);
      const expected = 0.1046221344; // (1.01^10) - 1
      expect(result[0][9]).toBeCloseTo(expected, 7); // Checking precision to 7 decimal places
    });
  });

  describe('calculateAbnormalReturns', () => {
    it('should calculate abnormal returns correctly', () => {
      const shareReturns = [[0.1, 0.05, 0.02]];
      const indexReturns = [[0.08, 0.03, 0.01]];
      const expected = [[0.02, 0.02, 0.01]];
      const result = calculateAbnormalReturns(shareReturns, indexReturns);
      expect(result).toEqual(expected);
    });

    it('should handle null values', () => {
      const shareReturns = [[0.1, null, 0.02]];
      const indexReturns = [[0.08, 0.03, null]];
      const expected = [[0.02, null, null]];
      const result = calculateAbnormalReturns(shareReturns, indexReturns);
      expect(result).toEqual(expected);
    });
  });
});