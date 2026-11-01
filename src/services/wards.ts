/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ward } from '../types/index.ts';
import { generateCityPeakPoints } from './cityPeakPoints.ts';

/**
 * Generates regular 1 km grid cells over a bounding box.
 * Available as an optional geometric partitioning mode.
 */
export function generateGridCells(
  bbox: [number, number, number, number], // [minLat, minLon, maxLat, maxLon]
  gridStepKm = 1.2
): Ward[] {
  const [minLat, minLon, maxLat, maxLon] = bbox;
  const wards: Ward[] = [];

  // ~1 km in degrees
  const latStep = gridStepKm / 111.0;
  // lonStep varies with cos(lat)
  const midLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const lonStep = gridStepKm / (111.0 * Math.cos(midLatRad));

  let cellIndex = 1;

  for (let lat = minLat; lat < maxLat; lat += latStep) {
    for (let lon = minLon; lon < maxLon; lon += lonStep) {
      const cellLatMax = Math.min(lat + latStep, maxLat + 0.001);
      const cellLonMax = Math.min(lon + lonStep, maxLon + 0.001);

      const centroidLat = (lat + cellLatMax) / 2;
      const centroidLon = (lon + cellLonMax) / 2;

      // Area in km2: width * height
      const hKm = (cellLatMax - lat) * 111.0;
      const wKm = (cellLonMax - lon) * (111.0 * Math.cos(centroidLat * (Math.PI / 180)));
      const areaKm2 = Number((hKm * wKm).toFixed(2));

      // GeoJSON Polygon coordinates [lon, lat]
      const polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [lon, lat],
            [cellLonMax, lat],
            [cellLonMax, cellLatMax],
            [lon, cellLatMax],
            [lon, lat],
          ],
        ],
      };

      wards.push({
        ward_id: `grid_${cellIndex}`,
        name: `Grid Sector ${cellIndex} (1km² cell)`,
        polygon,
        centroid_lat: Number(centroidLat.toFixed(5)),
        centroid_lon: Number(centroidLon.toFixed(5)),
        area_km2: Math.max(0.1, areaKm2),
        is_grid_cell: true,
      });

      cellIndex++;
    }
  }

  return wards;
}

/**
 * Loads ward polygons from a GeoJSON URL, or generates major city peak points and urban zones.
 */
export async function loadWards(
  geojsonUrl: string | null | undefined,
  bbox: [number, number, number, number],
  cityName: string
): Promise<{ wards: Ward[]; isFallback: boolean; errorDetail: string | null }> {
  if (!geojsonUrl || geojsonUrl.trim() === '') {
    const peakPoints = generateCityPeakPoints(bbox, cityName);
    return {
      wards: peakPoints,
      isFallback: true,
      errorDetail: null,
    };
  }

  try {
    const response = await fetch(geojsonUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching ward GeoJSON.`);
    }

    // Check size limit: max 15MB
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 15 * 1024 * 1024) {
      throw new Error('Ward GeoJSON file exceeds the 15 MB limit.');
    }

    const json = await response.json();
    if (json.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
      throw new Error('Invalid GeoJSON: Expected FeatureCollection.');
    }

    const wards: Ward[] = [];
    let idx = 1;

    for (const feat of json.features) {
      if (!feat.geometry || (feat.geometry.type !== 'Polygon' && feat.geometry.type !== 'MultiPolygon')) {
        continue;
      }

      // Compute centroid from coordinates
      const coords = feat.geometry.type === 'Polygon' ? feat.geometry.coordinates[0] : feat.geometry.coordinates[0][0];
      let sumLat = 0, sumLon = 0, count = 0;
      for (const pt of coords) {
        sumLon += pt[0];
        sumLat += pt[1];
        count++;
      }
      const cLat = count > 0 ? sumLat / count : bbox[0];
      const cLon = count > 0 ? sumLon / count : bbox[1];

      // Clean name (E19: strip control characters, truncate to 100)
      const rawName =
        feat.properties?.name ||
        feat.properties?.ward_name ||
        feat.properties?.WARD_NAME ||
        feat.properties?.Name ||
        `Ward ${idx}`;
      const cleanName = String(rawName).replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 100);

      const wardId = String(feat.properties?.ward_id || feat.properties?.id || `ward_${idx}`);

      wards.push({
        ward_id: wardId,
        name: cleanName,
        polygon: feat.geometry,
        centroid_lat: Number(cLat.toFixed(5)),
        centroid_lon: Number(cLon.toFixed(5)),
        area_km2: 1.5,
        is_grid_cell: false,
      });

      idx++;
    }

    if (wards.length === 0) {
      throw new Error('GeoJSON contains no valid Polygon or MultiPolygon features.');
    }

    return { wards, isFallback: false, errorDetail: null };
  } catch (err: any) {
    console.warn('Ward GeoJSON load failed, falling back to city peak points:', err.message);
    const peakPoints = generateCityPeakPoints(bbox, cityName);
    return {
      wards: peakPoints,
      isFallback: true,
      errorDetail: `GeoJSON load failed: ${err.message}. Using ${peakPoints.length} major city peak points and urban zones.`,
    };
  }
}
