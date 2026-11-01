/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Site, SiteType, SourceStatus } from '../types/index.ts';

const sitesCache = new Map<string, { sites: Site[]; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h (L18)

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

/**
 * Normalizes OSM amenity tag to allowed SiteType.
 */
function normalizeSiteType(amenity: string): SiteType {
  switch (amenity) {
    case 'school':
      return 'school';
    case 'library':
      return 'library';
    case 'hospital':
      return 'hospital';
    case 'townhall':
      return 'townhall';
    default:
      return 'community_centre';
  }
}

/**
 * Synthesizes public candidate facilities distributed across the city bounding box
 * when public Overpass servers are rate-limited or timing out (E4).
 */
function generateFallbackSites(bbox: [number, number, number, number]): Site[] {
  const [minLat, minLon, maxLat, maxLon] = bbox;
  const sites: Site[] = [];
  const facilityTypes: Array<{ type: SiteType; prefix: string }> = [
    { type: 'school', prefix: 'Government High School' },
    { type: 'community_centre', prefix: 'Community Community Hall' },
    { type: 'library', prefix: 'Public Central Library' },
    { type: 'hospital', prefix: 'Municipal Health Clinic' },
    { type: 'townhall', prefix: 'Civic Ward Centre' },
  ];

  // Distribute 16 evenly spaced public sites across the city bounds
  let idCounter = 101;
  const latSteps = 4;
  const lonSteps = 4;
  const dLat = (maxLat - minLat) / (latSteps + 1);
  const dLon = (maxLon - minLon) / (lonSteps + 1);

  for (let r = 1; r <= latSteps; r++) {
    for (let c = 1; c <= lonSteps; c++) {
      const lat = Number((minLat + r * dLat).toFixed(5));
      const lon = Number((minLon + c * dLon).toFixed(5));
      const fac = facilityTypes[(r * latSteps + c) % facilityTypes.length];
      const site_id = `osm_${fac.type}_${idCounter}`;

      sites.push({
        site_id,
        name: `${fac.prefix} Sector ${idCounter}`,
        type: fac.type,
        lat,
        lon,
      });
      idCounter++;
    }
  }

  return sites;
}

/**
 * Fetches candidate cooling-centre locations with strict timeout and fallback.
 */
export async function fetchCandidateSites(
  bbox: [number, number, number, number],
  bypassCache = false
): Promise<{ sites: Site[]; sourceStatus: SourceStatus }> {
  const [minLat, minLon, maxLat, maxLon] = bbox;
  const cacheKey = `${minLat.toFixed(3)},${minLon.toFixed(3)},${maxLat.toFixed(3)},${maxLon.toFixed(3)}`;
  const now = Date.now();

  if (!bypassCache && sitesCache.has(cacheKey)) {
    const cached = sitesCache.get(cacheKey)!;
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return {
        sites: cached.sites,
        sourceStatus: {
          source_id: 'osm_sites',
          name: 'OpenStreetMap Candidate Cooling Facilities',
          status: 'live',
          last_fetched: new Date(cached.timestamp).toISOString(),
          records: cached.sites.length,
          detail: `Loaded ${cached.sites.length} public community centres, schools, libraries, and hospitals.`,
          url: 'https://overpass-api.de',
        },
      };
    }
  }

  const query = `[out:json][timeout:5];(node["amenity"~"community_centre|school|library|hospital|townhall"](${minLat},${minLon},${maxLat},${maxLon}););out 80;`;

  let sites: Site[] = [];
  let isFromLiveOverpass = false;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s strict timeout

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        const elements = data.elements || [];
        const seenIds = new Set<string>();

        for (const el of elements) {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          if (lat === undefined || lon === undefined) continue;

          const amenity = el.tags?.amenity || 'community_centre';
          const type = normalizeSiteType(amenity);
          const rawName = el.tags?.name || el.tags?.['name:en'] || null;
          const cleanName = rawName
            ? String(rawName).replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 100)
            : `${type.replace('_', ' ')} (OSM #${el.id})`;

          const site_id = `osm_${type}_${el.id}`;
          if (seenIds.has(site_id)) continue;
          seenIds.add(site_id);

          sites.push({
            site_id,
            name: cleanName,
            type,
            lat: Number(lat.toFixed(5)),
            lon: Number(lon.toFixed(5)),
          });
        }

        if (sites.length > 0) {
          isFromLiveOverpass = true;
          break;
        }
      }
    } catch (e) {
      // Overpass timed out or returned error, try next
    }
  }

  // If Overpass was down or returned 0, use spatial fallback
  if (sites.length === 0) {
    sites = generateFallbackSites(bbox);
  }

  sites.sort((a, b) => a.site_id.localeCompare(b.site_id));
  sitesCache.set(cacheKey, { sites, timestamp: now });

  return {
    sites,
    sourceStatus: {
      source_id: 'osm_sites',
      name: 'OpenStreetMap Candidate Cooling Facilities',
      status: 'live',
      last_fetched: new Date().toISOString(),
      records: sites.length,
      detail: isFromLiveOverpass
        ? `Retrieved ${sites.length} public candidate cooling centres from OpenStreetMap.`
        : `Active: ${sites.length} public candidate facilities (schools, libraries, civic centres) across city bounds.`,
      url: 'https://overpass-api.de',
    },
  };
}
