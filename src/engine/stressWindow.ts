/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StressWindowResult {
  start_hour: number;
  end_hour: number;
  max_apparent_c: number;
  threshold_c: number;
  label: string;
}

export interface ShiftWindowResult {
  start_hour: number;
  end_hour: number;
  recommended_actions: string[];
  safety_note: string;
}

/**
 * Calculates the temperature-driven stress window from hourly apparent temperatures.
 * L11 & T7: find hours where apparent_c >= day_max_apparent - 1.5;
 * take the longest contiguous block as [start_hour, end_hour).
 */
export function calculateStressWindow(
  hourlyApparent: number[]
): StressWindowResult {
  if (hourlyApparent.length === 0) {
    return {
      start_hour: 12,
      end_hour: 16,
      max_apparent_c: 0,
      threshold_c: 0,
      label: 'temperature-driven stress window, not a measured demand peak',
    };
  }

  const maxApparent = Math.max(...hourlyApparent);
  const threshold = maxApparent - 1.5;

  let bestStart = 0;
  let bestLength = 0;

  let currentStart = -1;
  let currentLength = 0;

  for (let h = 0; h < hourlyApparent.length; h++) {
    if (hourlyApparent[h] >= threshold) {
      if (currentStart === -1) {
        currentStart = h;
        currentLength = 1;
      } else {
        currentLength++;
      }

      if (currentLength > bestLength) {
        bestLength = currentLength;
        bestStart = currentStart;
      }
    } else {
      currentStart = -1;
      currentLength = 0;
    }
  }

  // If no block found (edge case), default to hour of max
  if (bestLength === 0) {
    const maxHour = hourlyApparent.indexOf(maxApparent);
    bestStart = maxHour;
    bestLength = 1;
  }

  return {
    start_hour: bestStart,
    end_hour: bestStart + bestLength,
    max_apparent_c: Number(maxApparent.toFixed(1)),
    threshold_c: Number(threshold.toFixed(1)),
    label: 'temperature-driven stress window, not a measured demand peak',
  };
}

/**
 * Calculates shift window: 3 hours starting 1 hour after end_hour (L12).
 * Strictly preserves safety constraint: Never advise switching off cooling or medical equipment.
 */
export function calculateShiftWindow(endHour: number): ShiftWindowResult {
  const startHour = (endHour + 1) % 24;
  const finishHour = (startHour + 3) % 24;

  return {
    start_hour: startHour,
    end_hour: finishHour,
    recommended_actions: [
      'Defer agricultural / municipal water pumping',
      'Schedule electric vehicle (EV) charging off-peak',
      'Postpone heavy laundry, washing machines & dishwashers',
      'Delay industrial heating and iron pressing operations',
    ],
    safety_note:
      'Critical Safety Note: Never advise switching off essential air cooling, fans, or medical equipment.',
  };
}
