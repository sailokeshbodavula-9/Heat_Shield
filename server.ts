/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Translation / Advisory endpoint using server-side Gemini API
app.post('/api/agent/translate', async (req, res) => {
  const { text, targetLang } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({
      translated: null,
      mode: 'template',
      message: 'Translation needs the LLM (GEMINI_API_KEY missing)',
    });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const langName = targetLang === 'kn' ? 'Kannada' : 'Hindi';

    const prompt = `Translate the following official emergency heat advisory into ${langName}.
CRITICAL CONSTRAINT: You must preserve EVERY single number in Latin Arabic digits (0-9). Do not translate numbers into regional numerals or change their values.

Advisory text:
"""
${text}
"""

Return only the translated advisory text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      translated: response.text?.trim() || null,
      mode: 'llm',
    });
  } catch (err: any) {
    console.warn('Gemini translation fallback:', err?.message);
    res.status(200).json({
      translated: null,
      mode: 'template',
      error: err?.message,
    });
  }
});

// In-memory cache for generated recommendations to deliver instant responses and prevent redundant API load
const recommendationsCache = new Map<string, any>();

function buildDeterministicServerRecommendations(params: any) {
  const {
    cityName = 'Bengaluru',
    peakApparentC = 38.0,
    severeCount = 0,
    totalWards = 12,
    scenario = 'live',
    elninoProfile = {},
    topWards = [],
    gridDemand = null,
    coolingSitesCount = 10,
  } = params;

  const topWardNames = (topWards || []).slice(0, 3).map((w: any) => w.name || w.ward_id || 'Core Zone');
  const wardListStr = topWardNames.length > 0 ? topWardNames.join(', ') : `${cityName} core sectors`;
  const isElNino = scenario === 'stress_plus_2c';
  const surge = elninoProfile?.cityProjectedSurgeC || 2.0;
  const ninoIndex = elninoProfile?.nino34_index || 1.2;
  const regZone = elninoProfile?.regionalZone || 'Urban Basin';

  return {
    executiveSummary: isElNino
      ? `${cityName} Municipal Administration must activate Stage-2 Heat Emergency protocols as NOAA Niño-3.4 (+${ninoIndex}°C) accelerates a projected +${surge}°C continental surge, putting ${severeCount} of ${totalWards} sectors under severe thermal stress.`
      : `${cityName} Municipal Administration must activate Stage-1 Live Urban Heat Response protocols. Current weather monitoring indicates peak feels-like temperatures reaching ${Number(peakApparentC).toFixed(1)}°C with ${severeCount} of ${totalWards} sectors facing severe multi-factor thermal risk.`,
    elninoSpecificDirectives: isElNino
      ? [
          {
            title: `Mitigate +${surge}°C El Niño Surge in ${regZone}`,
            description: `Execute thermal buffer protocols across ${cityName}: activate roadside high-pressure misting along arterial corridors and mandate reflective cool-roof coatings on all civic flat roofs before pre-monsoon heat peaks.`,
            timeframe: 'Immediate (0-24 Hours)',
            impact: 'Reduces localized urban surface temperature by up to 2.5°C in dense micro-clusters.',
          },
          {
            title: `Counteract ${elninoProfile?.drySpellProbabilityPct || 75}% Dry Spell Risk & Groundwater Depletion`,
            description: `With El Niño suppressing seasonal precipitation, pre-allocate dedicated municipal water tanker corridors for vulnerable settlements in ${wardListStr}. Ration non-essential commercial water extraction.`,
            timeframe: 'Next 48 Hours',
            impact: 'Secures baseline emergency hydration quota for at-risk populations.',
          },
          {
            title: 'Delayed Monsoon Contingency & Heat-Health Action Extension',
            description: `Extend operational readiness of public cooling centers through ${elninoProfile?.monsoonDelayRisk || 'Late Monsoon onset'}. Ensure hospital emergency wards maintain 20% reserved capacity for heat exhaustion triage.`,
            timeframe: '7-14 Day Horizon',
            impact: 'Prevents acute medical system congestion during peak heat-wave mortality windows.',
          },
        ]
      : [
          {
            title: `Rapid Urban Heat Island Mitigation in ${regZone}`,
            description: `Execute active thermal buffering across ${cityName}: deploy municipal misting cannons along arterial corridors and schedule reflective white-wash coating on low-income tin roofs in ${wardListStr}.`,
            timeframe: 'Immediate (0-24 Hours)',
            impact: 'Reduces localized surface temperatures by up to 2.0°C in high-exposure wards.',
          },
          {
            title: 'Urban Hydration & Public Transit Protection',
            description: `Establish dedicated municipal drinking water kiosks ('Pyaaos') and distribute oral rehydration salts (ORS) across major bus and metro stations serving ${wardListStr}.`,
            timeframe: 'Next 24 Hours',
            impact: 'Guarantees emergency hydration access for transit commuters and daily-wage laborers.',
          },
          {
            title: `Public Cooling Refuge Activation (${coolingSitesCount} Facilities)`,
            description: `Open and signpost ${coolingSitesCount} air-cooled public libraries, community halls, and civic facilities as walk-in heat shelters between 10:00 AM and 6:00 PM.`,
            timeframe: 'Immediate Operational',
            impact: 'Provides life-saving thermal relief to vulnerable individuals daily.',
          },
        ],
    problemSolvers: [
      {
        problem: `High Thermal Concentration in Dense Urban Wards (${wardListStr})`,
        solution: `Deploy mobile water misting tankers and install temporary shade canopies at high-density transit nodes and open marketplaces in ${wardListStr}.`,
        targetWardsOrSectors: topWardNames.length > 0 ? topWardNames : [`${cityName} Central`, `${cityName} Market Hub`],
        leadDepartment: 'Municipal Corporation (Disaster Management Cell)',
      },
      {
        problem: `Grid Cooling Stress Window (${gridDemand ? `${gridDemand.stressWindow} @ ${gridDemand.peak_mw} MW` : '14:00 - 17:00 Peak Demand'})`,
        solution: 'Issue voluntary load-shifting advisories to heavy industrial units, tech parks, and commercial complexes to pre-cool facilities before 13:00 and shift non-essential pumping to 21:00-05:00.',
        targetWardsOrSectors: ['Industrial Estates', 'Commercial Centers', 'Tech Corridors'],
        leadDepartment: 'State Electricity Supply Company (DISCOM)',
      },
      {
        problem: 'Extreme Exposure of Outdoor Laborers & Informal Commuters',
        solution: 'Strictly enforce mandatory work stoppage between 12:00 PM and 4:00 PM for construction and sanitation workers under State Heatwave Directives. Set up free Oral Rehydration Solution (ORS) booths at transit hubs.',
        targetWardsOrSectors: ['Construction Zones', 'Railway Stations', 'Bus Termini'],
        leadDepartment: 'Labour Welfare Commissioner & Transport Corporation',
      },
      {
        problem: `Under-Utilized Public Cooling Infrastructure (${coolingSitesCount} Candidate Sites)`,
        solution: 'Formally designate and signpost public libraries, community halls, and air-cooled government schools as walk-in cooling refuges equipped with drinking water and basic first aid.',
        targetWardsOrSectors: ['Public Libraries', 'Community Halls', 'Civic Schools'],
        leadDepartment: 'Department of Public Instruction & Social Welfare',
      },
    ],
    priorityActions24to48h: isElNino
      ? [
          `Issue official Heat Alert to all ward engineers in ${cityName} highlighting the +${surge}°C El Niño surge.`,
          `Inspect and activate ${coolingSitesCount} candidate cooling facilities with guaranteed uninterrupted power backup.`,
          'Mandate suspension of hazardous outdoor physical labor between 12:00 PM and 4:00 PM across all infrastructure sites.',
          'Coordinate with DISCOM to schedule transformer oil-cooling flushes in high-load commercial substations.',
          `Dispatch mobile health vans equipped with IV fluids, cold packs, and ORS to ${wardListStr}.`,
        ]
      : [
          `Issue immediate municipal heat health advisory across ${cityName} for current ${Number(peakApparentC).toFixed(1)}°C feels-like conditions.`,
          `Activate ${coolingSitesCount} designated public cooling centers with drinking water and air cooling from 10:00 AM to 6:00 PM.`,
          'Enforce mandatory outdoor work rest periods between 12:00 PM and 4:00 PM for construction and civic workers.',
          `Deploy mobile drinking water tankers and ORS distribution points to transit hubs in ${wardListStr}.`,
          'Alert emergency medical centers and PHCs to ready dedicated heat-stroke beds and IV hydration supplies.',
        ],
  };
}

// AI City Recommendations endpoint using server-side Gemini Flash
app.post('/api/agent/recommendations', async (req, res) => {
  const {
    cityName = 'Bengaluru',
    latitude,
    longitude,
    peakApparentC,
    severeCount,
    totalWards,
    scenario = 'live',
    elninoProfile,
    topWards,
    gridDemand,
    coolingSitesCount,
  } = req.body;

  // Check cache first for rapid sub-50ms response
  const cacheKey = `${String(cityName).toLowerCase()}_${scenario}_${Math.round(peakApparentC || 38)}`;
  if (recommendationsCache.has(cacheKey)) {
    return res.json(recommendationsCache.get(cacheKey));
  }

  if (!process.env.GEMINI_API_KEY) {
    const fallback = buildDeterministicServerRecommendations(req.body);
    const payload = {
      recommendation: fallback,
      mode: 'deterministic',
      message: 'GEMINI_API_KEY is not set. Using local deterministic city recommendations.',
    };
    recommendationsCache.set(cacheKey, payload);
    return res.status(200).json(payload);
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const isElNino = scenario === 'stress_plus_2c';
    const prompt = isElNino
      ? `You are the Lead Urban Heat & Disaster Management Senior Advisor for Indian Urban Local Bodies and National Disaster Management Authority (NDMA).
Generate an authoritative, highly specific, actionable Heat Action & El Niño Response Strategy tailored specifically for the city of "${cityName}" (Coordinates: ${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}).

CURRENT DIAGNOSTIC SNAPSHOT FOR ${cityName}:
- Peak Feels-Like Temperature: ${peakApparentC?.toFixed(1) || '38.0'} °C
- Severe Risk Sectors: ${severeCount || 0} of ${totalWards || 12} wards/zones
- Top High-Risk Wards/Areas: ${JSON.stringify(topWards || [])}
- Live El Niño Regional Zone: ${elninoProfile?.regionalZone || 'Continental Heat Basin'}
- El Niño Projected Anomaly Surge: +${elninoProfile?.cityProjectedSurgeC || '2.0'} °C
- Dry Spell Probability: ${elninoProfile?.drySpellProbabilityPct || 75}%
- Grid Cooling Strain Window: ${gridDemand?.stressWindow || '14:00 - 17:00'} (Peak: ${gridDemand?.peak_mw || '2850'} MW)
- Available Candidate Cooling Facilities: ${coolingSitesCount || 10} public buildings

TASK:
Provide structured, highly specific AI recommendations to solve EACH distinct problem faced by ${cityName}, with heavy focus on El Niño climate stress mitigation.
Address:
1. El Niño Compound Stress & Drought Directives (specific to ${cityName}'s climate zone, aquifer/water reserves, and projected surge).
2. Ward-Specific Tactical Solutions: Explicitly mention the top high-risk wards (${topWards?.map((w: any) => w.name).join(', ') || cityName + ' core'}) and how to mitigate their specific building density, lack of canopy, or heat retention.
3. Power Grid & Load Shifting Strategy: Concrete steps for electricity DISCOMs to prevent substation burnouts during the stress window.
4. Vulnerable Population & Outdoor Labor Protection: Mandatory work hours (e.g. 12-4 PM pause), ORS kiosks, hospital heat stroke beds.
5. Candidate Cooling Shelters Deployment: Activation of libraries, community halls, and schools for public relief.
6. Priority 24-48 Hour Action Checklist for the Municipal Commissioner.

Return ONLY a valid JSON object matching this schema:
{
  "executiveSummary": "Concise 2-sentence executive summary for the Municipal Commissioner of ${cityName}",
  "elninoSpecificDirectives": [
    {
      "title": "Directive title",
      "description": "Specific action addressing El Niño's +${elninoProfile?.cityProjectedSurgeC || '2.0'}°C surge and dry spell",
      "timeframe": "Immediate / Pre-monsoon / 72 hours",
      "impact": "Expected outcome"
    }
  ],
  "problemSolvers": [
    {
      "problem": "Name of the urban heat / grid / water / labor problem in ${cityName}",
      "solution": "Actionable micro-plan with target areas and specifications",
      "targetWardsOrSectors": ["Ward/Sector name 1", "Ward/Sector name 2"],
      "leadDepartment": "BBMP / MCD / BMC / DISCOM / Health Dept"
    }
  ],
  "priorityActions24to48h": [
    "Action item 1",
    "Action item 2",
    "Action item 3",
    "Action item 4",
    "Action item 5"
  ]
}`
      : `You are the Lead Urban Heat & Disaster Management Senior Advisor for Indian Urban Local Bodies and National Disaster Management Authority (NDMA).
Generate an authoritative, highly specific, actionable Live Heat Action Plan (HAP) & Urban Heat Island Mitigation Strategy tailored specifically for the city of "${cityName}" (Coordinates: ${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}).

CURRENT LIVE DIAGNOSTIC SNAPSHOT FOR ${cityName}:
- Current Peak Feels-Like Temperature: ${peakApparentC?.toFixed(1) || '38.0'} °C
- Severe Risk Sectors: ${severeCount || 0} of ${totalWards || 12} wards/zones
- Top High-Risk Wards/Areas: ${JSON.stringify(topWards || [])}
- Regional Climate Zone: ${elninoProfile?.regionalZone || 'Urban Basin'}
- Grid Cooling Strain Window: ${gridDemand?.stressWindow || '14:00 - 17:00'} (Peak: ${gridDemand?.peak_mw || '2850'} MW)
- Available Candidate Cooling Facilities: ${coolingSitesCount || 10} public buildings

TASK:
Provide structured, highly specific AI recommendations to solve EACH distinct problem faced by ${cityName} under current LIVE meteorological conditions and urban heat island (UHI) exposure.
Address:
1. Live Thermal Protection & Public Hydration Directives: Real-time interventions to protect citizens from current ${peakApparentC?.toFixed(1)}°C peak feels-like heat.
2. Ward-Specific Tactical Solutions: Explicitly mention the top high-risk wards (${topWards?.map((w: any) => w.name).join(', ') || cityName + ' core'}) and how to mitigate their specific building density, lack of canopy, or heat retention.
3. Power Grid & Load Shifting Strategy: Concrete steps for electricity DISCOMs to prevent substation burnouts during the peak stress window (${gridDemand?.stressWindow || '14:00 - 17:00'}).
4. Vulnerable Population & Outdoor Labor Protection: Mandatory work hours (e.g. 12-4 PM pause), ORS kiosks, hospital heat stroke beds.
5. Candidate Cooling Shelters Deployment: Immediate activation of ${coolingSitesCount || 10} libraries, community halls, and schools for public relief.
6. Priority 24-48 Hour Action Checklist for the Municipal Commissioner.

Return ONLY a valid JSON object matching this schema:
{
  "executiveSummary": "Concise 2-sentence executive summary for the Municipal Commissioner of ${cityName} regarding current live heatwave risks",
  "elninoSpecificDirectives": [
    {
      "title": "Live Heatwave Response Directive",
      "description": "Specific action addressing current heat levels and microclimate hotspots",
      "timeframe": "Immediate (0-24 Hours) / Next 48 Hours",
      "impact": "Expected outcome"
    }
  ],
  "problemSolvers": [
    {
      "problem": "Name of the urban heat / grid / water / labor problem in ${cityName}",
      "solution": "Actionable micro-plan with target areas and specifications",
      "targetWardsOrSectors": ["Ward/Sector name 1", "Ward/Sector name 2"],
      "leadDepartment": "BBMP / MCD / BMC / DISCOM / Health Dept"
    }
  ],
  "priorityActions24to48h": [
    "Action item 1",
    "Action item 2",
    "Action item 3",
    "Action item 4",
    "Action item 5"
  ]
}`;

    const callModel = async () => {
      return await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 1200,
        },
      });
    };

    // Extended 20s timeout to allow full generation without premature cutoff
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timeout')), 20000)
    );

    const response: any = await Promise.race([callModel(), timeoutPromise]);

    const parsed = JSON.parse(response.text || '{}');
    if (parsed && (parsed.executiveSummary || parsed.elninoSpecificDirectives)) {
      const payload = {
        recommendation: parsed,
        mode: 'llm',
      };
      recommendationsCache.set(cacheKey, payload);
      return res.json(payload);
    }

    // Fallback if returned JSON was empty
    const fallback = buildDeterministicServerRecommendations(req.body);
    const payload = {
      recommendation: fallback,
      mode: 'deterministic',
    };
    recommendationsCache.set(cacheKey, payload);
    return res.json(payload);
  } catch (err: any) {
    console.warn('Gemini recommendations gracefully switched to tailored fallback:', err?.message || 'timeout');
    const fallback = buildDeterministicServerRecommendations(req.body);
    const payload = {
      recommendation: fallback,
      mode: 'deterministic',
    };
    recommendationsCache.set(cacheKey, payload);
    return res.status(200).json(payload);
  }
});

// Main development / production server boot
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`HeatShield server listening on port ${port}`);
  });
}

startServer();
