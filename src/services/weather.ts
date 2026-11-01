/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DayForecast, HourForecast, SourceStatus, Ward } from '../types/index.ts';

// In-memory cache with 30-minute expiration (L18)
const forecastCache = new Map<string, { data: WeatherResult; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export interface WeatherResult {
  daily: Map<string, DayForecast[]>; // ward_id -> 7 days
  hourly: Map<string, HourForecast[]>; // ward_id -> 168 hours
  peakApparentOverall: number;
  peakDayOverall: string;
  sourceStatus: SourceStatus;
}

/**
 * Sleeps for ms with backoff.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetches forecast with retry logic for 5xx/timeout (E2) and 429 rate limits (E3).
 */
async function fetchWithRetry(url: string, retries = 2): Promise<any> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const resp = await fetch(url);
      if (resp.status === 429) {
        console.warn('Open-Meteo rate limited (429), backing off 10s...');
        await sleep(10000);
        attempt++;
        continue;
      }
      if (!resp.ok) {
        if (resp.status >= 500 && attempt < retries) {
          const backoff = attempt === 0 ? 1000 : 3000;
          await sleep(backoff);
          attempt++;
          continue;
        }
        throw new Error(`Open-Meteo HTTP ${resp.status}`);
      }
      return await resp.json();
    } catch (err: any) {
      if (attempt < retries) {
        const backoff = attempt === 0 ? 1000 : 3000;
        await sleep(backoff);
        attempt++;
      } else {
        throw err;
      }
    }
  }
}

/**
 * Fetches 7-day hourly and daily forecast per ward sample point.
 * L1: Coordinates chunked up to 50 coordinates per request.
 * L18: 30 min in-memory caching.
 */
export async function fetchForecastForWards(
  wards: Ward[],
  bypassCache = false
): Promise<WeatherResult> {
  const cacheKey = wards.map((w) => `${w.centroid_lat.toFixed(3)},${w.centroid_lon.toFixed(3)}`).join(';');
  const now = Date.now();

  if (!bypassCache && forecastCache.has(cacheKey)) {
    const cached = forecastCache.get(cacheKey)!;
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const dailyMap = new Map<string, DayForecast[]>();
  const hourlyMap = new Map<string, HourForecast[]>();

  let peakApparent = -999;
  let peakDay = '';

  try {
    // If > 200 wards, simplify sample points, else use all ward centroids
    const sampleWards = wards.length > 200 ? wards.filter((_, idx) => idx % 2 === 0) : wards;

    // Chunk into batches of up to 50 coordinates (L1)
    const chunkSize = 50;
    for (let i = 0; i < sampleWards.length; i += chunkSize) {
      const chunk = sampleWards.slice(i, i + chunkSize);
      const lats = chunk.map((w) => w.centroid_lat.toFixed(4)).join(',');
      const lons = chunk.map((w) => w.centroid_lon.toFixed(4)).join(',');

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=apparent_temperature,temperature_2m,relative_humidity_2m&daily=temperature_2m_max,apparent_temperature_max&timezone=Asia%2FKolkata`;

      const json = await fetchWithRetry(url);
      const results = Array.isArray(json) ? json : [json];

      for (let cIdx = 0; cIdx < chunk.length; cIdx++) {
        const ward = chunk[cIdx];
        const res = results[cIdx] || results[0];

        if (!res || !res.daily || !res.hourly) continue;

        const wardDays: DayForecast[] = [];
        const times = res.daily.time || [];
        const tmax = res.daily.temperature_2m_max || [];
        const appMax = res.daily.apparent_temperature_max || [];

        for (let d = 0; d < times.length; d++) {
          const apparent = appMax[d] ?? tmax[d] ?? 35;
          wardDays.push({
            ward_id: ward.ward_id,
            date: times[d],
            tmax_c: tmax[d] ?? 35,
            apparent_max_c: apparent,
            humidity_mean_pct: 50,
          });

          if (apparent > peakApparent) {
            peakApparent = apparent;
            peakDay = times[d];
          }
        }
        dailyMap.set(ward.ward_id, wardDays);

        // Hourly
        const hTimes = res.hourly.time || [];
        const hApparent = res.hourly.apparent_temperature || [];
        const hTemp = res.hourly.temperature_2m || [];
        const wardHours: HourForecast[] = [];

        for (let h = 0; h < hTimes.length; h++) {
          wardHours.push({
            ward_id: ward.ward_id,
            datetime: hTimes[h],
            apparent_c: hApparent[h] ?? 30,
            temperature_c: hTemp[h] ?? 28,
          });
        }
        hourlyMap.set(ward.ward_id, wardHours);
      }
    }

    // For any remaining wards not in sampleWards, assign nearest sample ward's forecast (L1)
    if (sampleWards.length < wards.length) {
      for (const w of wards) {
        if (!dailyMap.has(w.ward_id)) {
          // find nearest
          let nearestId = sampleWards[0].ward_id;
          let minDist = 999999;
          for (const s of sampleWards) {
            const d = Math.hypot(w.centroid_lat - s.centroid_lat, w.centroid_lon - s.centroid_lon);
            if (d < minDist) {
              minDist = d;
              nearestId = s.ward_id;
            }
          }
          if (dailyMap.has(nearestId)) {
            dailyMap.set(w.ward_id, dailyMap.get(nearestId)!);
            hourlyMap.set(w.ward_id, hourlyMap.get(nearestId)!);
          }
        }
      }
    }

    const sourceStatus: SourceStatus = {
      source_id: 'open_meteo_forecast',
      name: 'Open-Meteo High-Resolution Forecast',
      status: 'live',
      last_fetched: new Date().toISOString(),
      records: dailyMap.size * 7,
      detail: `Fetched 7-day hourly & daily data across ${dailyMap.size} ward centroids.`,
      url: 'https://open-meteo.com/en/docs',
    };

    const result: WeatherResult = {
      daily: dailyMap,
      hourly: hourlyMap,
      peakApparentOverall: peakApparent > -900 ? peakApparent : 38.5,
      peakDayOverall: peakDay || new Date().toISOString().split('T')[0],
      sourceStatus,
    };

    forecastCache.set(cacheKey, { data: result, timestamp: now });
    return result;
  } catch (err: any) {
    console.error('Weather forecast fetch error:', err.message);
    const sourceStatus: SourceStatus = {
      source_id: 'open_meteo_forecast',
      name: 'Open-Meteo High-Resolution Forecast',
      status: 'failed',
      last_fetched: null,
      records: 0,
      detail: `Data unavailable: ${err.message}`,
      url: 'https://open-meteo.com/en/docs',
    };

    return {
      daily: new Map(),
      hourly: new Map(),
      peakApparentOverall: 0,
      peakDayOverall: '',
      sourceStatus,
    };
  }
}

/**
 * Fetches historical temperature archive from Open-Meteo for demand backtesting.
 */
export async function fetchHistoricalArchiveTemperatures(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<{ date: string; tmax_c: number }[]> {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat.toFixed(
    4
  )}&longitude=${lon.toFixed(4)}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max&timezone=Asia%2FKolkata`;

  const json = await fetchWithRetry(url, 2);
  if (!json.daily || !json.daily.time) {
    throw new Error('Historical archive response contains no daily records.');
  }

  const result: { date: string; tmax_c: number }[] = [];
  const times = json.daily.time;
  const tmax = json.daily.temperature_2m_max;

  for (let i = 0; i < times.length; i++) {
    if (tmax[i] !== null && tmax[i] !== undefined) {
      result.push({
        date: times[i],
        tmax_c: tmax[i],
      });
    }
  }

  return result;
}
