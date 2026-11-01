/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  CheckCircle2,
  Eye,
  EyeOff,
  TreePine,
  Building,
  Flame,
  Shield,
  Maximize2,
  Navigation,
} from 'lucide-react';
import { CentrePlacement, RiskResult, Site, UserLocationDetails, Ward } from '../types/index.ts';

interface MapProps {
  wards: Ward[];
  risks: RiskResult[];
  candidateSites: Site[];
  selectedCentres: CentrePlacement[];
  coveragePct: number;
  uncoveredWardIds: string[];
  theme: 'dark' | 'light';
  onSelectWard: (wardId: string) => void;
  selectedWardId: string | null;
  radiusKm: number;
  cityCenter: [number, number];
  cityBbox?: [number, number, number, number];
  cityName?: string;
  userLocation?: UserLocationDetails | null;
  isUserInCity?: boolean;
  centerTarget?: { lat: number; lon: number; zoom?: number; ts: number } | null;
  onLocateUser?: () => void;
  isLocatingUser?: boolean;
  onOpenLocationDetails?: () => void;
}

const RISK_COLORS = {
  severe: '#DC2626',
  high: '#F97316',
  moderate: '#FBBF24',
  low: '#2DD4BF',
};

export const MapView: React.FC<MapProps> = ({
  wards,
  risks,
  candidateSites,
  selectedCentres,
  coveragePct,
  uncoveredWardIds,
  theme,
  onSelectWard,
  selectedWardId,
  radiusKm,
  cityCenter,
  cityBbox,
  cityName,
  userLocation,
  isUserInCity = true,
  centerTarget = null,
  onLocateUser,
  isLocatingUser = false,
  onOpenLocationDetails,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer Groups
  const wardGeoJsonGroupRef = useRef<L.GeoJSON | null>(null);
  const candidateSitesGroupRef = useRef<L.LayerGroup | null>(null);
  const selectedCentresGroupRef = useRef<L.LayerGroup | null>(null);
  const radiusCirclesGroupRef = useRef<L.LayerGroup | null>(null);
  const userLocationGroupRef = useRef<L.LayerGroup | null>(null);

  // Layer Toggles
  const [showRiskLayer, setShowRiskLayer] = useState(true);
  const [showCandidateSites, setShowCandidateSites] = useState(true);
  const [showSelectedCentres, setShowSelectedCentres] = useState(true);
  const [highlightUncovered, setHighlightUncovered] = useState(false);
  const [colorMode, setColorMode] = useState<'risk' | 'heat' | 'greenery' | 'buildings'>('risk');
  const [basemapStyle, setBasemapStyle] = useState<'canvas' | 'osm'>('canvas');

  const getTileUrl = (style: 'canvas' | 'osm', isDark: boolean) => {
    if (style === 'osm') {
      return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    return isDark
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: cityCenter,
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const isDark = theme === 'dark';
    const tileUrl = getTileUrl(basemapStyle, isDark);

    const tiles = L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = tiles;
    candidateSitesGroupRef.current = L.layerGroup().addTo(map);
    selectedCentresGroupRef.current = L.layerGroup().addTo(map);
    radiusCirclesGroupRef.current = L.layerGroup().addTo(map);
    userLocationGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tiles on Theme or Basemap Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const isDark = theme === 'dark';
    const tileUrl = getTileUrl(basemapStyle, isDark);
    tileLayerRef.current.setUrl(tileUrl);
  }, [theme, basemapStyle]);

  // Pan or fit to city when it changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (cityBbox) {
      mapInstanceRef.current.fitBounds(
        [
          [cityBbox[0], cityBbox[1]],
          [cityBbox[2], cityBbox[3]],
        ],
        { padding: [24, 24], maxZoom: 13, animate: true }
      );
    } else if (cityCenter) {
      mapInstanceRef.current.flyTo(cityCenter, 12, { duration: 1.0 });
    }
  }, [cityName, cityCenter?.[0], cityCenter?.[1], cityBbox?.[0], cityBbox?.[1], cityBbox?.[2], cityBbox?.[3]]);

  // Fly to explicit target (e.g. user location or selected shelter)
  useEffect(() => {
    if (!mapInstanceRef.current || !centerTarget) return;
    mapInstanceRef.current.flyTo([centerTarget.lat, centerTarget.lon], centerTarget.zoom || 14, { duration: 1.0 });
  }, [centerTarget]);

  // Render Ward Polygons
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (wardGeoJsonGroupRef.current) {
      mapInstanceRef.current.removeLayer(wardGeoJsonGroupRef.current);
      wardGeoJsonGroupRef.current = null;
    }

    if (!showRiskLayer || wards.length === 0) return;

    const riskMap = new Map<string, RiskResult>();
    risks.forEach((r) => riskMap.set(r.ward_id, r));

    const uncoveredSet = new Set(uncoveredWardIds);

    const geoJsonData: any = {
      type: 'FeatureCollection',
      features: wards.map((w) => ({
        type: 'Feature',
        id: w.ward_id,
        geometry: w.polygon,
        properties: {
          ward_id: w.ward_id,
          name: w.name,
          is_grid_cell: w.is_grid_cell,
          area_km2: w.area_km2,
        },
      })),
    };

    const layer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const wardId = feature?.properties?.ward_id;
        const risk = riskMap.get(wardId);
        const isSelected = selectedWardId === wardId;
        const isUncovered = highlightUncovered && uncoveredSet.has(wardId);

        let fillColor = '#60A5FA';
        if (colorMode === 'risk') {
          fillColor = risk ? RISK_COLORS[risk.risk_class] : '#60A5FA';
        } else if (colorMode === 'heat') {
          // Heat scale: yellow to red
          const h = risk ? risk.hazard : 0.5;
          fillColor = h > 0.7 ? '#EF4444' : h > 0.4 ? '#F59E0B' : '#10B981';
        } else if (colorMode === 'greenery') {
          fillColor = '#10B981'; // Green
        } else if (colorMode === 'buildings') {
          fillColor = '#8B5CF6'; // Purple
        }

        if (isUncovered) {
          fillColor = '#DC2626'; // Highlight uncovered high risk
        }

        return {
          fillColor,
          fillOpacity: isUncovered ? 0.85 : isSelected ? 0.8 : 0.6,
          weight: isSelected ? 3 : isUncovered ? 2.5 : 1,
          color: isSelected ? '#FFFFFF' : isUncovered ? '#F87171' : '#374151',
          dashArray: isUncovered ? '4, 4' : undefined,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const wardId = feature.properties.ward_id;
        const wardName = feature.properties.name;
        const isGrid = feature.properties.is_grid_cell;
        const risk = riskMap.get(wardId);

        // Hover tooltip with mini factor bars
        const factorsHtml = risk?.top_factors
          ? risk.top_factors
              .map(
                (f) =>
                  `<div style="display:flex;justify-content:space-between;gap:8px;font-size:10px;margin-top:2px;">
                    <span style="opacity:0.8;">${f}</span>
                    <span style="font-family:monospace;font-weight:bold;">High</span>
                  </div>`
              )
              .join('')
          : '';

        const tooltipContent = `
          <div style="font-family:sans-serif;min-width:140px;color:#fff;background:#121821;padding:8px;border-radius:8px;border:1px solid #1F2937;">
            <div style="font-weight:bold;font-size:12px;margin-bottom:2px;">${wardName}</div>
            <div style="font-size:10px;color:#94a3b8;margin-bottom:6px;">${isGrid ? '1km² Grid Cell' : 'Official Ward'}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:11px;font-weight:600;text-transform:uppercase;color:${
                risk ? RISK_COLORS[risk.risk_class] : '#60a5fa'
              };">${risk ? risk.risk_class : 'unscored'}</span>
              <span style="font-family:monospace;font-weight:bold;font-size:13px;color:#fff;">${
                risk ? risk.risk_score.toFixed(1) : '--'
              }</span>
            </div>
            ${factorsHtml}
            <div style="margin-top:6px;font-size:9px;color:#60a5fa;border-top:1px solid #334155;padding-top:4px;">Click to view full breakdown →</div>
          </div>
        `;

        featureLayer.bindTooltip(tooltipContent, {
          sticky: true,
          className: 'heatshield-custom-tooltip',
          direction: 'top',
        });

        featureLayer.on({
          click: () => onSelectWard(wardId),
          mouseover: (e: any) => {
            const l = e.target;
            l.setStyle({ weight: 2.5, color: '#60A5FA' });
          },
          mouseout: (e: any) => {
            layer.resetStyle(e.target);
          },
        });
      },
    }).addTo(mapInstanceRef.current);

    wardGeoJsonGroupRef.current = layer;
  }, [wards, risks, showRiskLayer, colorMode, selectedWardId, highlightUncovered, uncoveredWardIds]);

  // Render Candidate Sites & Selected Centres with Soft Pulse & Radius
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear previous markers
    candidateSitesGroupRef.current?.clearLayers();
    selectedCentresGroupRef.current?.clearLayers();
    radiusCirclesGroupRef.current?.clearLayers();

    const selectedIds = new Set(selectedCentres.map((c) => c.site_id));

    // Candidate Sites (non-selected)
    if (showCandidateSites && candidateSitesGroupRef.current) {
      for (const site of candidateSites) {
        if (selectedIds.has(site.site_id)) continue;

        const iconHtml = `<div style="background:#3B82F6;width:8px;height:8px;border-radius:50%;border:1.5px solid #FFFFFF;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`;
        const marker = L.marker([site.lat, site.lon], {
          icon: L.divIcon({
            html: iconHtml,
            className: 'candidate-site-icon',
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          }),
        });

        marker.bindTooltip(
          `<div style="font-size:11px;font-family:sans-serif;padding:4px;">
            <strong>${site.name || 'Public Facility'}</strong><br/>
            <span style="opacity:0.75;text-transform:capitalize;">${site.type.replace('_', ' ')} (OSM)</span>
          </div>`,
          { direction: 'top' }
        );

        candidateSitesGroupRef.current.addLayer(marker);
      }
    }

    // Selected Cooling Centres with pulsating indicator & dashed service radius
    if (showSelectedCentres && selectedCentresGroupRef.current && radiusCirclesGroupRef.current) {
      for (const centre of selectedCentres) {
        // Dashed Radius Circle
        const circle = L.circle([centre.lat, centre.lon], {
          radius: radiusKm * 1000,
          color: '#3B82F6',
          weight: 1.5,
          dashArray: '5, 5',
          fillColor: '#3B82F6',
          fillOpacity: 0.08,
        });

        circle.bindTooltip(
          `<strong>${centre.name || 'Cooling Centre'}</strong>: ${radiusKm} km Walking Radius (${centre.newly_covered_pct}% new coverage)`,
          { sticky: true }
        );
        radiusCirclesGroupRef.current.addLayer(circle);

        // Pulsing Marker
        const pulseHtml = `
          <div style="position:relative;width:24px;height:24px;">
            <div style="position:absolute;inset:0;background:#3B82F6;border-radius:50%;animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;opacity:0.4;"></div>
            <div style="position:relative;width:24px;height:24px;background:#2563EB;border:2.5px solid #FFFFFF;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.6);">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
          </div>
        `;

        const marker = L.marker([centre.lat, centre.lon], {
          icon: L.divIcon({
            html: pulseHtml,
            className: 'selected-centre-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        });

        marker.bindTooltip(
          `<div style="font-family:sans-serif;padding:6px;min-width:160px;background:#121821;color:#fff;border-radius:8px;border:1px solid #1F2937;">
            <div style="font-weight:bold;font-size:12px;color:#60A5FA;">✓ Active Cooling Centre</div>
            <div style="font-size:11px;margin-top:2px;">${centre.name || 'Public Facility'}</div>
            <div style="font-size:10px;color:#94a3b8;text-transform:capitalize;">${centre.type.replace('_', ' ')}</div>
            <div style="margin-top:4px;font-size:10px;font-family:monospace;color:#34D399;">+${centre.newly_covered_pct}% high-risk wards covered</div>
            <div style="font-size:9px;color:#cbd5e1;margin-top:2px;">Radius: ${radiusKm} km straight-line</div>
          </div>`,
          { direction: 'top', className: 'heatshield-custom-tooltip' }
        );

        selectedCentresGroupRef.current.addLayer(marker);
      }
    }
  }, [candidateSites, selectedCentres, showCandidateSites, showSelectedCentres, radiusKm]);

  // Render User Location Pulsing Marker & Accuracy Circle
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocationGroupRef.current) return;

    userLocationGroupRef.current.clearLayers();

    // Only render user pin on the map if user is located and within the active city
    if (!userLocation || isUserInCity === false) return;

    // Draw accuracy circle
    const accuracy = Math.max(40, userLocation.accuracyMeters || 80);
    const circle = L.circle([userLocation.lat, userLocation.lon], {
      radius: accuracy,
      color: '#3B82F6',
      weight: 1.5,
      fillColor: '#3B82F6',
      fillOpacity: 0.12,
      dashArray: '3, 4',
    });
    circle.bindTooltip(`GPS Accuracy: ±${Math.round(accuracy)}m`, { sticky: true });
    userLocationGroupRef.current.addLayer(circle);

    // Pulsing custom marker
    const pulseIcon = L.divIcon({
      html: `
        <div style="position:relative;width:28px;height:28px;cursor:pointer;">
          <div style="position:absolute;inset:0;background:#3B82F6;border-radius:50%;animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;opacity:0.6;"></div>
          <div style="position:relative;width:28px;height:28px;background:#2563EB;border:3px solid #FFFFFF;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.5);">
            <div style="width:8px;height:8px;background:#FFFFFF;border-radius:50%;"></div>
          </div>
        </div>
      `,
      className: 'user-location-pin',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([userLocation.lat, userLocation.lon], { icon: pulseIcon });
    marker.bindTooltip(
      `<div style="font-family:sans-serif;padding:6px;min-width:180px;background:#121821;color:#fff;border-radius:8px;border:1px solid #3B82F6;">
        <div style="font-weight:bold;font-size:11px;color:#60A5FA;">📍 You Are Here</div>
        <div style="font-size:11px;margin-top:2px;font-weight:600;">${userLocation.placeName}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:2px;">${userLocation.fullAddress}</div>
        <div style="font-size:9px;color:#34D399;margin-top:4px;">Click to view all heat &amp; safety details →</div>
      </div>`,
      { direction: 'top', className: 'heatshield-custom-tooltip' }
    );

    marker.on('click', () => {
      if (onOpenLocationDetails) {
        onOpenLocationDetails();
      }
    });

    userLocationGroupRef.current.addLayer(marker);
  }, [userLocation, isUserInCity, onOpenLocationDetails]);

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col bg-slate-900 overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Floating Coverage Chip */}
      {selectedCentres.length > 0 && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#121821]/95 text-white backdrop-blur border border-[#1F2937] px-3 py-1.5 rounded-xl shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <div className="text-xs">
            <span className="font-bold font-mono text-emerald-400">{coveragePct}%</span>{' '}
            <span className="text-slate-300">Coverage of High-Risk Wards</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">({selectedCentres.length} centres)</span>
        </div>
      )}

      {/* Map Layer Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end">
        <div className="bg-[#121821]/95 backdrop-blur border border-[#1F2937] p-1.5 rounded-xl shadow-xl flex flex-wrap gap-1 text-xs">
          <button
            onClick={() => setColorMode('risk')}
            aria-label="Color map by risk score"
            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              colorMode === 'risk' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Risk</span>
          </button>
          <button
            onClick={() => setColorMode('heat')}
            aria-label="Color map by heat index"
            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              colorMode === 'heat' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heat</span>
          </button>
          <button
            onClick={() => setColorMode('greenery')}
            aria-label="Color map by greenery"
            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              colorMode === 'greenery' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TreePine className="w-3.5 h-3.5" />
            <span>Green</span>
          </button>
          <button
            onClick={() => setColorMode('buildings')}
            aria-label="Color map by building density"
            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              colorMode === 'buildings' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Density</span>
          </button>
        </div>

        {/* Visibility Toggles & With/Without Plan Toggle */}
        <div className="bg-[#121821]/95 backdrop-blur border border-[#1F2937] px-2 py-1.5 rounded-xl shadow-xl flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowCandidateSites(!showCandidateSites)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
              showCandidateSites ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle OpenStreetMap candidate sites"
          >
            <MapPin className="w-3 h-3 text-blue-400" />
            <span>OSM Sites</span>
          </button>

          <button
            onClick={() => setShowSelectedCentres(!showSelectedCentres)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
              showSelectedCentres ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle activated cooling centres"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Centres</span>
          </button>

          {/* Basemap Switcher (Canvas / OSM) */}
          <button
            onClick={() => setBasemapStyle(basemapStyle === 'canvas' ? 'osm' : 'canvas')}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1 border border-slate-700"
            title="Toggle between Canvas and OpenStreetMap basemaps"
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>{basemapStyle === 'canvas' ? 'Dark Canvas' : 'OpenStreetMap'}</span>
          </button>

          {/* Locate Me Map Button */}
          {onLocateUser && (
            <button
              onClick={onLocateUser}
              disabled={isLocatingUser}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 border ${
                userLocation
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Locate my position in this city"
            >
              <Navigation className={`w-3 h-3 ${isLocatingUser ? 'animate-spin text-blue-300' : 'text-blue-400'}`} />
              <span>{isLocatingUser ? 'Locating...' : 'Locate Me'}</span>
            </button>
          )}

          {/* With / Without Plan Toggle */}
          <button
            onClick={() => setHighlightUncovered(!highlightUncovered)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
              highlightUncovered ? 'bg-red-500 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Highlight uncovered high-risk wards (Without Plan view)"
          >
            <span>{highlightUncovered ? 'Uncovered Wards' : 'With/Without Plan'}</span>
          </button>
        </div>
      </div>

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 bg-[#121821]/95 backdrop-blur border border-[#1F2937] p-2 rounded-xl text-[11px] shadow-xl">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">
          Heat Risk Classification
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]"></span>
            <span className="text-slate-300">Severe (≥75)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F97316]"></span>
            <span className="text-slate-300">High (55-75)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#FBBF24]"></span>
            <span className="text-slate-300">Mod (35-55)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2DD4BF]"></span>
            <span className="text-slate-300">Low (&lt;35)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
