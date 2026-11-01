/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Settings, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { AppSettings } from '../types/index.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  theme: 'dark' | 'light';
}

const DEFAULT_SETTINGS: AppSettings = {
  wardGeoJsonUrl: '',
  k: 5,
  radius_km: 1.5,
  weights: {
    w_hazard: 0.4,
    w_exposure: 0.4,
    w_vulnerability: 0.2,
  },
  hazard_low_c: 32,
  hazard_high_c: 46,
  language: 'en_hi',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  theme,
}) => {
  const [form, setForm] = useState<AppSettings>(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const handleReset = () => {
    setForm(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#121821] text-slate-100 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Planner Configuration</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
          {/* Custom Ward GeoJSON URL (F2) */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Ward Boundary GeoJSON URL (Optional, max 15 MB)
            </label>
            <input
              type="url"
              placeholder="e.g. https://example.org/bengaluru-wards.geojson"
              value={form.wardGeoJsonUrl}
              onChange={(e) => setForm({ ...form, wardGeoJsonUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-blue-500 font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Leave blank to automatically synthesize 1 km² regular grid sectors across the city bounding box.
            </p>
          </div>

          {/* Cooling Centre Optimiser Parameters: k & radius_km */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Centres to Activate (k): 1 - 20
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.k}
                onChange={(e) =>
                  setForm({ ...form, k: Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 5)) })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Walking Radius (km): 0.5 - 5.0
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5.0"
                value={form.radius_km}
                onChange={(e) =>
                  setForm({
                    ...form,
                    radius_km: Math.max(0.5, Math.min(5.0, parseFloat(e.target.value) || 1.5)),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Hazard Thresholds: Low and High feels-like C */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Hazard Baseline Temp (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={form.hazard_low_c}
                onChange={(e) => setForm({ ...form, hazard_low_c: parseFloat(e.target.value) || 32 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Severe Hazard Ceiling (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={form.hazard_high_c}
                onChange={(e) => setForm({ ...form, hazard_high_c: parseFloat(e.target.value) || 46 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Regional Advisory Language Choice */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Advisory Regional Translation Language
            </label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
            >
              <option value="en_hi">English + Hindi (हिन्दी) - National Standard</option>
              <option value="en">English (Official National)</option>
              <option value="en_kn">English + Kannada (ಕನ್ನಡ)</option>
            </select>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
