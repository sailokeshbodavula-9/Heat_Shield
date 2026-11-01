/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserLocationDetails } from '../types/index.ts';

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  bbox: [number, number, number, number]; // [minLat, minLon, maxLat, maxLon]
}

/**
 * Curated catalog of major Indian cities, state capitals, industrial hubs,
 * and municipal corporations across all Indian states and union territories.
 */
export const INDIAN_CITIES_CATALOG: GeocodingResult[] = [
  // Mega-Metros & Major State Capitals
  {
    id: 1277333,
    name: 'Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
    country: 'India',
    admin1: 'Karnataka',
    bbox: [12.85, 77.48, 13.10, 77.72],
  },
  {
    id: 1275339,
    name: 'Mumbai',
    latitude: 19.076,
    longitude: 72.8777,
    country: 'India',
    admin1: 'Maharashtra',
    bbox: [18.89, 72.77, 19.28, 72.99],
  },
  {
    id: 1273294,
    name: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    country: 'India',
    admin1: 'Delhi',
    bbox: [28.40, 76.84, 28.88, 77.35],
  },
  {
    id: 1264527,
    name: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
    country: 'India',
    admin1: 'Tamil Nadu',
    bbox: [12.90, 80.12, 13.24, 80.34],
  },
  {
    id: 1275004,
    name: 'Kolkata',
    latitude: 22.5726,
    longitude: 88.3639,
    country: 'India',
    admin1: 'West Bengal',
    bbox: [22.45, 88.24, 22.68, 88.46],
  },
  {
    id: 1269843,
    name: 'Hyderabad',
    latitude: 17.385,
    longitude: 78.4867,
    country: 'India',
    admin1: 'Telangana',
    bbox: [17.26, 78.32, 17.55, 78.62],
  },
  {
    id: 1279233,
    name: 'Ahmedabad',
    latitude: 23.0225,
    longitude: 72.5714,
    country: 'India',
    admin1: 'Gujarat',
    bbox: [22.92, 72.45, 23.14, 72.69],
  },
  {
    id: 1259229,
    name: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    country: 'India',
    admin1: 'Maharashtra',
    bbox: [18.42, 73.74, 18.63, 73.98],
  },
  {
    id: 1269515,
    name: 'Jaipur',
    latitude: 26.9124,
    longitude: 75.7873,
    country: 'India',
    admin1: 'Rajasthan',
    bbox: [26.80, 75.68, 27.02, 75.92],
  },
  {
    id: 1264733,
    name: 'Lucknow',
    latitude: 26.8467,
    longitude: 80.9462,
    country: 'India',
    admin1: 'Uttar Pradesh',
    bbox: [26.74, 80.82, 26.96, 81.05],
  },
  // Key Tier-2 & Industrial Centers
  {
    id: 1255364,
    name: 'Surat',
    latitude: 21.1702,
    longitude: 72.8311,
    country: 'India',
    admin1: 'Gujarat',
    bbox: [21.08, 72.74, 21.28, 72.93],
  },
  {
    id: 1267995,
    name: 'Kanpur',
    latitude: 26.4499,
    longitude: 80.3319,
    country: 'India',
    admin1: 'Uttar Pradesh',
    bbox: [26.37, 80.22, 26.54, 80.44],
  },
  {
    id: 1262180,
    name: 'Nagpur',
    latitude: 21.1458,
    longitude: 79.0882,
    country: 'India',
    admin1: 'Maharashtra',
    bbox: [21.05, 78.98, 21.24, 79.19],
  },
  {
    id: 1269743,
    name: 'Indore',
    latitude: 22.7196,
    longitude: 75.8577,
    country: 'India',
    admin1: 'Madhya Pradesh',
    bbox: [22.62, 75.76, 22.81, 75.95],
  },
  {
    id: 1275841,
    name: 'Bhopal',
    latitude: 23.2599,
    longitude: 77.4126,
    country: 'India',
    admin1: 'Madhya Pradesh',
    bbox: [23.16, 77.32, 23.36, 77.52],
  },
  {
    id: 1253102,
    name: 'Visakhapatnam',
    latitude: 17.6868,
    longitude: 83.2185,
    country: 'India',
    admin1: 'Andhra Pradesh',
    bbox: [17.60, 83.12, 17.82, 83.35],
  },
  {
    id: 1260086,
    name: 'Patna',
    latitude: 25.5941,
    longitude: 85.1376,
    country: 'India',
    admin1: 'Bihar',
    bbox: [25.50, 85.02, 25.68, 85.25],
  },
  {
    id: 1253573,
    name: 'Vadodara',
    latitude: 22.3072,
    longitude: 73.1812,
    country: 'India',
    admin1: 'Gujarat',
    bbox: [22.22, 73.10, 22.40, 73.28],
  },
  {
    id: 1266041,
    name: 'Ludhiana',
    latitude: 30.901,
    longitude: 75.8573,
    country: 'India',
    admin1: 'Punjab',
    bbox: [30.82, 30.98, 75.76, 75.96],
  },
  {
    id: 1279259,
    name: 'Agra',
    latitude: 27.1767,
    longitude: 78.0081,
    country: 'India',
    admin1: 'Uttar Pradesh',
    bbox: [27.10, 77.90, 27.26, 78.11],
  },
  {
    id: 1262117,
    name: 'Nashik',
    latitude: 19.9975,
    longitude: 73.7898,
    country: 'India',
    admin1: 'Maharashtra',
    bbox: [19.90, 73.70, 20.08, 73.88],
  },
  {
    id: 1253405,
    name: 'Varanasi',
    latitude: 25.3176,
    longitude: 82.9739,
    country: 'India',
    admin1: 'Uttar Pradesh',
    bbox: [25.23, 82.88, 25.40, 83.07],
  },
  {
    id: 1259424,
    name: 'Prayagraj',
    latitude: 25.4358,
    longitude: 81.8463,
    country: 'India',
    admin1: 'Uttar Pradesh',
    bbox: [25.35, 81.75, 25.52, 81.94],
  },
  {
    id: 1258526,
    name: 'Ranchi',
    latitude: 23.3441,
    longitude: 85.3096,
    country: 'India',
    admin1: 'Jharkhand',
    bbox: [23.26, 85.22, 23.44, 85.40],
  },
  {
    id: 1273874,
    name: 'Coimbatore',
    latitude: 11.0168,
    longitude: 76.9558,
    country: 'India',
    admin1: 'Tamil Nadu',
    bbox: [10.92, 76.86, 11.10, 77.06],
  },
  {
    id: 1253184,
    name: 'Vijayawada',
    latitude: 16.5062,
    longitude: 80.648,
    country: 'India',
    admin1: 'Andhra Pradesh',
    bbox: [16.42, 80.56, 16.58, 80.74],
  },
  {
    id: 1269321,
    name: 'Jodhpur',
    latitude: 26.2389,
    longitude: 73.0243,
    country: 'India',
    admin1: 'Rajasthan',
    bbox: [26.15, 72.93, 26.33, 73.12],
  },
  {
    id: 1264663,
    name: 'Madurai',
    latitude: 9.9252,
    longitude: 78.1198,
    country: 'India',
    admin1: 'Tamil Nadu',
    bbox: [9.84, 78.03, 10.01, 78.21],
  },
  {
    id: 1258980,
    name: 'Raipur',
    latitude: 21.2514,
    longitude: 81.6296,
    country: 'India',
    admin1: 'Chhattisgarh',
    bbox: [21.16, 81.54, 21.34, 81.72],
  },
  {
    id: 1266946,
    name: 'Kota',
    latitude: 25.2138,
    longitude: 75.8648,
    country: 'India',
    admin1: 'Rajasthan',
    bbox: [25.12, 75.77, 25.30, 75.96],
  },
  {
    id: 1274746,
    name: 'Chandigarh',
    latitude: 30.7333,
    longitude: 76.7794,
    country: 'India',
    admin1: 'Chandigarh',
    bbox: [30.65, 76.70, 30.81, 76.87],
  },
  {
    id: 1271476,
    name: 'Guwahati',
    latitude: 26.1445,
    longitude: 91.7362,
    country: 'India',
    admin1: 'Assam',
    bbox: [26.06, 91.64, 26.23, 91.83],
  },
  {
    id: 1259220,
    name: 'Puducherry',
    latitude: 11.9416,
    longitude: 79.8083,
    country: 'India',
    admin1: 'Puducherry',
    bbox: [11.86, 79.73, 12.02, 79.88],
  },
  {
    id: 1275817,
    name: 'Bhubaneswar',
    latitude: 20.2961,
    longitude: 85.8245,
    country: 'India',
    admin1: 'Odisha',
    bbox: [20.20, 85.74, 20.38, 85.92],
  },
  {
    id: 1254163,
    name: 'Thiruvananthapuram',
    latitude: 8.5241,
    longitude: 76.9366,
    country: 'India',
    admin1: 'Kerala',
    bbox: [8.44, 76.86, 8.60, 77.02],
  },
  {
    id: 1273874,
    name: 'Kochi',
    latitude: 9.9312,
    longitude: 76.2673,
    country: 'India',
    admin1: 'Kerala',
    bbox: [9.85, 76.19, 10.02, 76.36],
  },
  {
    id: 1273840,
    name: 'Dehradun',
    latitude: 30.3165,
    longitude: 78.0322,
    country: 'India',
    admin1: 'Uttarakhand',
    bbox: [30.23, 77.94, 30.40, 78.13],
  },
  {
    id: 1255634,
    name: 'Srinagar',
    latitude: 34.0837,
    longitude: 74.7973,
    country: 'India',
    admin1: 'Jammu and Kashmir',
    bbox: [34.00, 74.70, 34.17, 74.90],
  },
  {
    id: 1256312,
    name: 'Shimla',
    latitude: 31.1048,
    longitude: 77.1734,
    country: 'India',
    admin1: 'Himachal Pradesh',
    bbox: [31.04, 77.10, 31.16, 77.24],
  },
  {
    id: 1269300,
    name: 'Jamshedpur',
    latitude: 22.8046,
    longitude: 86.2029,
    country: 'India',
    admin1: 'Jharkhand',
    bbox: [22.72, 86.11, 22.89, 86.30],
  },
  {
    id: 1262321,
    name: 'Mysuru',
    latitude: 12.2958,
    longitude: 76.6394,
    country: 'India',
    admin1: 'Karnataka',
    bbox: [12.21, 76.55, 12.38, 76.73],
  },
  {
    id: 1260799,
    name: 'Noida',
    latitude: 28.5355,
    longitude: 77.391,
    country: 'India',
    admin1: 'Uttar Pradesh',
    bbox: [28.45, 77.30, 28.62, 77.48],
  },
  {
    id: 1270260,
    name: 'Gurugram',
    latitude: 28.4595,
    longitude: 77.0266,
    country: 'India',
    admin1: 'Haryana',
    bbox: [28.37, 76.94, 28.55, 77.12],
  },
  {
    id: 1273294,
    name: 'Amritsar',
    latitude: 31.634,
    longitude: 74.8723,
    country: 'India',
    admin1: 'Punjab',
    bbox: [31.55, 74.79, 31.72, 74.96],
  },
  {
    id: 1253434,
    name: 'Vasco da Gama',
    latitude: 15.3982,
    longitude: 73.8113,
    country: 'India',
    admin1: 'Goa',
    bbox: [15.33, 73.74, 15.46, 73.88],
  },
];

/**
 * Checks if geographic coordinates fall within India's sovereign territory.
 */
export function isWithinIndiaBounds(lat: number, lon: number): boolean {
  return lat >= 6.5 && lat <= 37.5 && lon >= 68.0 && lon <= 97.5;
}

/**
 * Searches exclusively for Indian cities.
 * Strictly filters out any foreign or non-Indian cities from results.
 */
export async function searchCity(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  // 1. Search locally curated Indian cities first
  const localMatches = INDIAN_CITIES_CATALOG.filter((c) => {
    const matchName = c.name.toLowerCase().includes(trimmed);
    const matchAdmin = c.admin1 ? c.admin1.toLowerCase().includes(trimmed) : false;
    return matchName || matchAdmin;
  });

  // 2. Fetch from Open-Meteo Geocoding API for any other Indian city / municipality
  let remoteIndianMatches: GeocodingResult[] = [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=10&language=en&format=json`;

    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      if (data.results && Array.isArray(data.results)) {
        // STRICT FILTER: Only accept results belonging to India
        const filtered = data.results.filter((r: any) => {
          const isCountryIndia =
            r.country_code === 'IN' ||
            (r.country && r.country.toLowerCase() === 'india');
          const hasIndiaCoordinates = isWithinIndiaBounds(r.latitude, r.longitude);
          return isCountryIndia && hasIndiaCoordinates;
        });

        remoteIndianMatches = filtered.map((r: any) => {
          const latDelta = 0.06;
          const lonDelta = 0.06;
          return {
            id: r.id,
            name: r.name,
            latitude: r.latitude,
            longitude: r.longitude,
            country: 'India',
            admin1: r.admin1 || 'India',
            bbox: [
              r.latitude - latDelta,
              r.longitude - lonDelta,
              r.latitude + latDelta,
              r.longitude + lonDelta,
            ],
          };
        });
      }
    }
  } catch (err) {
    console.warn('Remote geocoding error:', err);
  }

  // 3. Merge matches, deduplicate by city name and admin1, preserving Indian cities only
  const seen = new Set<string>();
  const combined: GeocodingResult[] = [];

  for (const item of [...localMatches, ...remoteIndianMatches]) {
    const key = `${item.name.toLowerCase()}_${(item.admin1 || '').toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  return combined;
}

/**
 * Reverse geocodes coordinates to identify exact place, locality, and city within India.
 */
export async function reverseGeocodeLocation(
  lat: number,
  lon: number,
  accuracyMeters?: number
): Promise<UserLocationDetails> {
  const isInsideIndia = isWithinIndiaBounds(lat, lon);

  // Find closest city in INDIAN_CITIES_CATALOG
  let closest = INDIAN_CITIES_CATALOG[0];
  let minDistance = 999999;
  for (const c of INDIAN_CITIES_CATALOG) {
    const dist = Math.hypot(c.latitude - lat, c.longitude - lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = c;
    }
  }

  // Attempt Nominatim reverse geocode
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`;
    const resp = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'HeatShield-App-India/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      const addr = data.address || {};

      const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.commercial ||
        addr.industrial ||
        addr.village ||
        addr.road ||
        addr.city_district ||
        'Local Area';

      const resolvedCity =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.county ||
        addr.state_district ||
        closest.name;

      const stateName = addr.state || closest.admin1 || 'India';
      const postcode = addr.postcode || undefined;

      const placeName = `${locality}, ${resolvedCity}`;
      const fullAddress = data.display_name || `${placeName}, ${stateName}, India`;

      return {
        lat,
        lon,
        placeName,
        fullAddress,
        cityName: resolvedCity,
        stateName,
        postcode,
        isInsideIndia,
        accuracyMeters: accuracyMeters ? Math.round(accuracyMeters) : undefined,
      };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode error:', err);
  }

  // Fallback to closest Indian city in catalog
  const placeName = `Current Sector, ${closest.name}`;
  const fullAddress = `${placeName}, ${closest.admin1}, India`;

  return {
    lat,
    lon,
    placeName,
    fullAddress,
    cityName: closest.name,
    stateName: closest.admin1,
    isInsideIndia,
    accuracyMeters: accuracyMeters ? Math.round(accuracyMeters) : undefined,
  };
}
