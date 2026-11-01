/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Flame,
  Search,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Activity,
  AlertTriangle,
  RefreshCw,
  Navigation,
  MapPin,
  Bell,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AppSettings, Scenario, SourceStatus, UserLocationDetails } from '../types/index.ts';
import { searchCity, GeocodingResult, INDIAN_CITIES_CATALOG } from '../services/geocoding.ts';
import { HeatAlert, requestNotificationPermission } from '../services/notificationService.ts';

interface HeaderProps {
  currentCity: string;
  onSelectCity: (city: GeocodingResult) => void;
  scenario: Scenario;
  onToggleScenario: (s: Scenario) => void;
  sources: SourceStatus[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  isLoadingCity: boolean;
  onLocateUser?: () => void;
  isLocatingUser?: boolean;
  userLocation?: UserLocationDetails | null;
  onOpenLocationDetails?: () => void;
  activeAlert?: HeatAlert | null;
  onOpenAlert?: () => void;
  onTestAlert?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onReplayIntro?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCity,
  onSelectCity,
  scenario,
  onToggleScenario,
  sources,
  theme,
  onToggleTheme,
  onOpenSettings,
  isLoadingCity,
  onLocateUser,
  isLocatingUser = false,
  userLocation = null,
  onOpenLocationDetails,
  activeAlert = null,
  onOpenAlert,
  onTestAlert,
  isMuted = false,
  onToggleMute,
  onReplayIntro,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showHealthPopover, setShowHealthPopover] = useState(false);
  const [showAlertPopover, setShowAlertPopover] = useState(false);
  const [hasNotifPermission, setHasNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const searchRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setShowAlertPopover(false);
      }
      if (healthRef.current && !healthRef.current.contains(e.target as Node)) {
        setShowHealthPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchError(null);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchCity(query);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError('Only Indian cities supported (e.g., Bengaluru, Mumbai, Chennai, Kolkata, Hyderabad, Jaipur, Lucknow, Patna).');
      }
    } catch (err: any) {
      setSearchError('Geocoding service unavailable.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        onSelectCity(searchResults[0]);
        setIsSearchOpen(false);
        setSearchQuery('');
      } else if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchCity(searchQuery.trim());
          if (results.length > 0) {
            onSelectCity(results[0]);
            setIsSearchOpen(false);
            setSearchQuery('');
          } else {
            setSearchError('Only Indian cities supported (e.g., Bengaluru, Mumbai, Chennai, Kolkata, Hyderabad, Jaipur, Lucknow, Patna).');
          }
        } catch {
          setSearchError('Geocoding service unavailable.');
        } finally {
          setIsSearching(false);
        }
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const isSimulated = scenario === 'stress_plus_2c';

  return (
    <header
      className={`border-b transition-colors relative z-30 ${
        theme === 'dark' ? 'bg-[#0B0F14] border-[#1F2937]' : 'bg-slate-50 border-slate-200'
      } ${isSimulated ? (theme === 'dark' ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50/70 border-amber-300') : ''}`}
    >
      {/* El Niño Status Ribbon - Only when changed to El Niño mode */}
      {isSimulated && (
        <div className="bg-amber-500 text-black px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex flex-wrap items-center justify-center gap-2 shadow-sm">
          <Flame className="w-4 h-4 fill-black text-black" />
          <span>EL NIÑO CLIMATE STRESS MODE: {currentCity.toUpperCase()} (+2.0 °C HEAT SURGE ACTIVE)</span>
          <span className="text-[10px] bg-black text-amber-300 px-2 py-0.5 rounded font-bold tracking-normal animate-pulse">
            CRITICAL UPCOMING CONCERN • ACTION REQUIRED
          </span>
          <span className="text-[10px] font-normal opacity-95 hidden lg:inline">
            • Authoritative:
            <a
              href="https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml"
              target="_blank"
              rel="noreferrer"
              className="underline font-bold ml-1 hover:text-white"
            >
              NOAA CPC Niño-3.4 (+1.2 °C) &amp; WMO Guidance ↗
            </a>
          </span>
        </div>
      )}

      <div className="max-w-[1700px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div
          onClick={onReplayIntro}
          className={`flex items-center gap-3 ${onReplayIntro ? 'cursor-pointer group select-none' : ''}`}
          title={onReplayIntro ? 'Click to replay HeatShield intro animation' : undefined}
        >
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:border-cyan-400 group-hover:shadow-cyan-500/30 transition-all shrink-0">
            <img
              src="/logo.png"
              alt="HeatShield Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/favicon.svg';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5 dark:text-white light:text-slate-900 group-hover:text-cyan-300 transition-colors">
                HeatShield
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Decision Support
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              City heatwave response &amp; cooling planner for Indian urban centers
            </p>
          </div>
        </div>

        {/* City Search Bar & Current Location Button (F1) */}
        <div className="flex items-center gap-2 flex-1 max-w-sm sm:max-w-md">
          <div className="relative flex-1" ref={searchRef}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                aria-label="Search Indian city"
                placeholder={isLoadingCity ? 'Resolving city...' : `Search Indian city (Current: ${currentCity})`}
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border transition-all outline-none ${
                  theme === 'dark'
                    ? 'bg-[#121821] border-[#1F2937] text-slate-200 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {isSearching && (
                <RefreshCw className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
              )}
            </div>

            {searchError && (
              <p className="text-[11px] text-red-400 mt-1 font-mono">{searchError}</p>
            )}

            {/* Autocomplete Dropdown: Exclusively Indian Cities */}
            {isSearchOpen && (
              <div
                className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto ${
                  theme === 'dark' ? 'bg-[#121821] border-[#1F2937]' : 'bg-white border-slate-200'
                }`}
              >
                {searchResults.length > 0 ? (
                  <div>
                    <div className="px-3 py-1.5 border-b border-slate-700/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Indian Cities Matching Query</span>
                      <span className="text-blue-400 font-bold">India Only</span>
                    </div>
                    {searchResults.map((res) => (
                      <button
                        key={res.id}
                        onClick={() => {
                          onSelectCity(res);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-[#1A2332] text-slate-200'
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <span className="font-medium">{res.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {res.admin1 ? `${res.admin1}, ` : ''}India
                        </span>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim().length < 2 ? (
                  <div>
                    <div className="px-3 py-1.5 border-b border-slate-700/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Select an Indian City</span>
                      <span className="text-emerald-400 font-bold">India Directory</span>
                    </div>
                    {INDIAN_CITIES_CATALOG.slice(0, 16).map((city) => (
                      <button
                        key={city.id}
                        onClick={() => {
                          onSelectCity(city);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-[#1A2332] text-slate-200'
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <span className="font-medium">{city.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {city.admin1}, India
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Current Location Button */}
          {onLocateUser && (
            <button
              type="button"
              onClick={onLocateUser}
              disabled={isLocatingUser}
              title="Locate my place in the city and show all heat & safety details"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                isLocatingUser
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 animate-pulse'
                  : userLocation
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-sm'
                  : theme === 'dark'
                  ? 'bg-[#121821] hover:bg-[#1A2332] border-[#1F2937] text-blue-400 hover:text-blue-300'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-blue-600 hover:text-blue-500'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLocatingUser ? 'Locating...' : 'Current Location'}</span>
            </button>
          )}

          {/* Active User Location Pill */}
          {userLocation && onOpenLocationDetails && (
            <button
              type="button"
              onClick={onOpenLocationDetails}
              title={`View local details for ${userLocation.placeName}`}
              className="hidden lg:flex px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono items-center gap-1 transition shrink-0"
            >
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="max-w-[110px] truncate">{userLocation.placeName}</span>
            </button>
          )}
        </div>

        {/* Right Section: Scenario Control, Source Health, Theme, Settings */}
        <div className="flex items-center gap-2.5">
          {/* Scenario Toggle Segmented Control */}
          <div
            className={`p-0.5 rounded-lg border flex items-center text-xs font-medium ${
              theme === 'dark' ? 'bg-[#121821] border-[#1F2937]' : 'bg-slate-200/70 border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => onToggleScenario('live')}
              className={`px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1.5 ${
                scenario === 'live'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Live</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleScenario('stress_plus_2c')}
              title={`Simulate El Niño Climate Stress for ${currentCity} (+2 °C surge)`}
              className={`px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1.5 ${
                scenario === 'stress_plus_2c'
                  ? 'bg-amber-500 text-black shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>El Niño (+2 °C)</span>
            </button>
          </div>

          {/* Source Data Health Dots */}
          <div className="relative" ref={healthRef}>
            <button
              onClick={() => setShowHealthPopover(!showHealthPopover)}
              aria-label="Data source health indicators"
              className={`p-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                theme === 'dark'
                  ? 'bg-[#121821] border-[#1F2937] hover:bg-[#1A2332]'
                  : 'bg-white border-slate-300 hover:bg-slate-100'
              }`}
              title="Data feed health status"
            >
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-1">
                {sources.slice(0, 5).map((s) => (
                  <span
                    key={s.source_id}
                    className={`w-2 h-2 rounded-full ${
                      s.status === 'live'
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50'
                        : s.status === 'user_uploaded'
                        ? 'bg-blue-400'
                        : s.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-slate-600'
                    }`}
                    title={`${s.name}: ${s.status}`}
                  />
                ))}
              </div>
            </button>

            {/* Health Popover */}
            {showHealthPopover && (
              <div
                className={`absolute right-0 top-full mt-2 w-80 rounded-xl p-3 border shadow-2xl z-50 text-xs ${
                  theme === 'dark' ? 'bg-[#121821] border-[#1F2937] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="font-semibold text-xs border-b border-slate-700/50 pb-1.5 mb-2 flex items-center justify-between">
                  <span>Data Feed Health &amp; Standards</span>
                  <span className="text-[10px] text-slate-400">{sources.length} Connected</span>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {sources.map((s) => {
                    let shortName = s.name;
                    if (s.source_id === 'open_meteo_forecast') shortName = 'Open-Meteo (Forecast)';
                    else if (s.source_id === 'open_meteo_archive') shortName = 'Open-Meteo (Archive)';
                    else if (s.source_id === 'noaa_enso') shortName = 'NOAA CPC (Niño-3.4 Index)';
                    else if (s.source_id === 'imd_mausam') shortName = 'IMD Mausam (Heat Standards)';
                    else if (s.source_id === 'wmo_climate') shortName = 'WMO (El Niño Climate)';
                    else if (s.source_id === 'data_gov_in') shortName = 'OGD India (data.gov.in)';
                    else if (s.source_id === 'osm_sites') shortName = 'OSM (Cooling Sites)';
                    else if (s.source_id === 'osm_buildings') shortName = 'OSM (Urban Fabric)';
                    else if (s.source_id === 'planetary_computer_stac') shortName = 'Planetary Computer (Sat)';
                    else if (s.source_id === 'google_earth_engine') shortName = 'Earth Engine (Thermal LST)';
                    else if (s.source_id === 'sentinel2_vegetation') shortName = 'Sentinel-2 (Tree Cover 10m)';
                    else if (s.source_id === 'ward_boundaries') shortName = 'Ward Geography (Grid)';
                    else if (s.source_id === 'demand_history') shortName = 'Official Grid Demand';

                    return (
                      <div key={s.source_id} className="flex items-center justify-between text-[11px] py-0.5">
                        <span className="truncate pr-2 font-medium text-slate-300">{shortName}</span>
                        <span
                          className={`font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                            s.status === 'live'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : s.status === 'user_uploaded'
                              ? 'bg-blue-500/20 text-blue-400'
                              : s.status === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-slate-700/50 text-slate-400'
                          }`}
                        >
                          {s.status === 'not_loaded' ? 'Awaiting Upload' : s.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Heat Alerts & Severe Notification Center */}
          <div className="relative" ref={alertRef}>
            <button
              onClick={() => setShowAlertPopover(!showAlertPopover)}
              aria-label="Heat emergency alerts center"
              className={`p-1.5 rounded-lg border relative transition-colors ${
                activeAlert
                  ? 'bg-red-500/20 border-red-500/60 text-red-400 hover:bg-red-500/30'
                  : theme === 'dark'
                  ? 'bg-[#121821] border-[#1F2937] hover:bg-[#1A2332] text-slate-300'
                  : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
              title={activeAlert ? 'CRITICAL: Severe Heat Emergency Active in Your Area' : 'Severe heat condition notifications'}
            >
              <Bell className="w-4 h-4" />
              {activeAlert && (
                <>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black" />
                </>
              )}
            </button>

            {/* Alerts Center Popover */}
            {showAlertPopover && (
              <div
                className={`absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl p-4 border shadow-2xl z-50 text-xs ${
                  theme === 'dark' ? 'bg-[#121821] border-[#1F2937] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="font-semibold text-xs border-b border-slate-700/50 pb-2 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span className="font-bold text-sm">Heat Emergency Alerts</span>
                  </div>
                  {activeAlert && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 uppercase font-bold animate-pulse">
                      Severe Active
                    </span>
                  )}
                </div>

                {/* Current Area Status Card */}
                {activeAlert ? (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-white space-y-2 mb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-red-400" />
                          <span>Severe Condition in Your Area</span>
                        </div>
                        <h4 className="font-bold text-sm text-white mt-0.5">
                          {activeAlert.placeName}
                        </h4>
                      </div>
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-red-600 text-white">
                        {activeAlert.riskScore.toFixed(1)} / 100
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      Feels-like heat has surged to <strong className="text-amber-400">{activeAlert.apparentTempC.toFixed(1)}°C</strong>.
                      Immediate protection directives and cooling facilities are active.
                    </p>

                    {onOpenAlert && (
                      <button
                        onClick={() => {
                          onOpenAlert();
                          setShowAlertPopover(false);
                        }}
                        className="w-full mt-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                      >
                        <span>Open Severe Heat Emergency Directive</span>
                      </button>
                    )}
                  </div>
                ) : userLocation ? (
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 mb-3 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block">
                      Current Area Status: Safe / Normal
                    </span>
                    <p className="text-xs text-white font-medium">
                      {userLocation.placeName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Heat risk is currently below the severe emergency threshold (&lt;75 / 100). We will immediately alert you if conditions escalate.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 mb-3 space-y-1.5">
                    <span className="text-[10px] font-mono text-blue-400 uppercase font-semibold block">
                      Hyperlocal Severe Monitoring
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Press <strong>Current Location</strong> in the header so HeatShield can monitor your exact neighborhood and alert you the second severe heat thresholds are breached.
                    </p>
                  </div>
                )}

                {/* Settings & Toggles */}
                <div className="space-y-2 pt-1 border-t border-slate-800 text-xs">
                  {/* Browser Push Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300 font-medium block">Browser Notifications</span>
                      <span className="text-[10px] text-slate-400">Receive alerts even in background</span>
                    </div>
                    {hasNotifPermission ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          const res = await requestNotificationPermission();
                          setHasNotifPermission(res === 'granted');
                        }}
                        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition"
                      >
                        Enable
                      </button>
                    )}
                  </div>

                  {/* Audio Emergency Chime */}
                  {onToggleMute && (
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-slate-300 font-medium block">Alert Chime Sound</span>
                        <span className="text-[10px] text-slate-400">Audible siren tone on severe heat</span>
                      </div>
                      <button
                        onClick={onToggleMute}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition ${
                          isMuted
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span>{isMuted ? 'Muted' : 'Sound On'}</span>
                      </button>
                    </div>
                  )}

                  {/* Manual Test Severe Alert */}
                  {onTestAlert && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          onTestAlert();
                          setShowAlertPopover(false);
                        }}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px] transition flex items-center justify-center gap-1.5"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Test Severe Alert Notification</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className={`p-1.5 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'bg-[#121821] border-[#1F2937] text-slate-300 hover:text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:text-black'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Open settings"
            className={`p-1.5 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'bg-[#121821] border-[#1F2937] text-slate-300 hover:text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:text-black'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
