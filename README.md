<div align="center">

<img src="./public/logo.png" alt="HeatShield Logo" width="180" height="180" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(6, 182, 212, 0.3);" />

# 🛡️ HeatShield
### Autonomous Urban Heatwave Intelligence & Hyperlocal Cooling Platform

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Open-Meteo](https://img.shields.io/badge/Open--Meteo-High--Res_API-FF6B6B)](https://open-meteo.com/)
[![Copernicus Sentinel](https://img.shields.io/badge/Copernicus-Sentinel--2_10m-005B94)](https://dataspace.copernicus.eu/)

*An AI-orchestrated municipal heat action planner and citizen early warning system for Indian metropolitan cities.*

---

</div>

## 📌 Executive Overview

During extreme summer heatwaves in India, surface and air temperatures routinely surpass **44°C to 48°C**, triggering deadly heat stress, water shortages, and electrical grid peak brownouts. Informal settlements, outdoor laborers, and densely built urban sectors bear the brunt of the **Urban Heat Island (UHI)** effect.

**HeatShield** is an autonomous decision-support system built for city authorities, disaster management agencies (NDMA/SDMA), and municipal commissioners. It combines high-resolution planetary earth observation, real-time meteorological models, and spatial facility optimization to tell authorities **where to act first** and gives citizens **instant, verified shelter and survival guidance**.

---

## 🌟 Key Capabilities

### 1. 📍 Hyperlocal "Current Location" Sector Profiling
* **Instant GPS Resolution**: Uses browser geolocation and reverse geocoding to identify your exact municipal ward or grid cell (e.g., *Indiranagar, Bengaluru* or *Gachibowli, Hyderabad*).
* **Automated Metropolitan Switching**: Seamlessly switches city boundaries and telemetry feeds if your physical device is located in a different urban center.
* **Proximity Radar Marker**: Drops a pulsating blue radar pin on the Leaflet map with GPS accuracy rings and walking distance to the nearest public cooling shelter.

### 2. 🚨 Automatic Severe Condition Emergency Alerting
* **Automated Multi-Channel Broadcast**: Fires immediate alerts when an area breaches critical thresholds ($\ge 75/100$ risk or under severe El Niño surges).
* **Dual-Tone Acoustic Siren**: Synthesizes an emergency acoustic chime ($587\text{ Hz} \to 880\text{ Hz}$) via the Web Audio API without external audio file dependencies.
* **HTML5 Desktop Push Notifications**: Alerts workers and residents even when the application tab is running in the background.
* **Persistent Emergency Banner**: High-visibility lower banner with 1-click **Locate Nearest Shelter** and **Open Safety Directive** actions.
* **Notification Control Center**: Accessible via the header bell icon with sound mute toggles and simulated alert test runners.

### 3. 🤖 Autonomous AI Municipal Action Planner
* **Deterministic Tool Calling**: Executes inspectable reasoning loops without hallucinations:
  1. `get_weather_forecast(days=7)` — Analyzes apparent feels-like peak temperatures and sustained heatwave streaks.
  2. `compute_ward_risks(weights)` — Computes composite Hazard $\times$ Exposure $\times$ Vulnerability matrices.
  3. `optimize_cooling_centers(k, radius_km)` — Solves the greedy maximal coverage facility location problem.
  4. `model_grid_demand()` — Forecasts electricity peak surge and specifies thermal load-shifting windows.
* **3-Tier Verification Gate**:
  * **$V_1$ Schema Validation**: Structural completeness of JSON response payload.
  * **$V_2$ Numeric Grounding**: Strict check ensuring temperature, MW values, and percentages match raw sensor telemetry.
  * **$V_3$ Safety & Equity**: Verifies zero-cost access, water availability, and priority coverage for high-risk wards.
* **Multilingual Advisories**: Formulates localized operational field directives in English, Hindi, and Kannada.

### 4. 🏢 Optimal Public Cooling Center Placement
* **Maximal Coverage Optimizer**: Solves for $k$ optimal public cooling centers within straight-line walking radii ($1.5\text{ km}$) using verified OpenStreetMap civic facilities (schools, community halls, transit hubs, clinics).
* **Spatial Interactive Overlays**: Visualizes service coverage circles, pulsing active shelters, and highlights uncovered vulnerable zones in high-contrast red.

### 5. ⚡ Power Grid Demand & Thermal Stress Forecasting
* **Cooling Demand Sensitivity**: Ridge-regression model ($\text{MW}/^\circ\text{C}$) calculating peak electrical risk windows ($[13:00, 17:00)$).
* **Load Shifting Strategy**: Specifies optimal non-essential water pumping and appliance shift windows ($[18:00, 22:00)$) to prevent localized transformer fires and rolling blackouts.

### 6. 🌊 Live El Niño Climate Teleconnection (+2 °C)
* **NOAA CPC Niño-3.4 Index**: Real-time integration of equatorial Pacific sea surface temperature anomalies.
* **One-Click Stress Simulation**: Toggle "+2.0 °C El Niño Stress Mode" to simulate regional heat surge multipliers across northern plains, coastal peninsular, and central plateau zones.

### 7. 🛰️ Planetary Earth Observation Telemetry
* **Copernicus Sentinel-2 (10m)**: Real-time multispectral vegetation reflectance and ESA WorldCover tree canopy coverage.
* **Google Earth Engine & Landsat-9 TIRS**: Thermal infrared radiometric Land Surface Temperature (LST) and emissivity profiling.
* **OpenStreetMap Urban Morphology**: Building density count per $\text{km}^2$ and impervious surface heat trapping.

---

## 🎨 Identity, Logo & Opening Animation

* **Emblem**: Modern geometric shield deflecting fiery amber thermal waves with a radiant cyan-blue cooling barrier.
* **Favicon**: Crisp vector SVG (`/public/favicon.svg`) with fallback PNG (`/public/logo.png`) that renders razor-sharp across all browser tabs, bookmarks, and mobile home screens.
* **Opening Splash Animation**:
  * An ambient intro sequence with glowing shield pulse and expanding protective wave ripples.
  * Step-by-step telemetry progress indicator displaying sensor and satellite calibration.
  * Instant "Skip" button and header logo replay trigger.

---

## 🏛️ Technical Architecture

```
                                  ┌───────────────────────────────────────────────┐
                                  │           Planetary Data Feeds                │
                                  ├───────────────────────┬───────────────────────┤
                                  │ Open-Meteo High-Res   │ Copernicus Sentinel-2 │
                                  │ NOAA Niño-3.4 SST     │ Landsat-9 TIRS (GEE)  │
                                  │ Overpass OSM Sites    │ Grid-India / CEA Data │
                                  └───────────┬───────────┴───────────┬───────────┘
                                              │                       │
                                              ▼                       ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   HeatShield Core Engine                                │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│    Risk Model (H×E×V)    │  Cooling Center Optimizer   │      Grid Demand Model        │
│   Normalized Composite   │  Greedy Maximal Coverage    │      Ridge Elasticity         │
│   Ward Heat Vulnerability│  k facilities, 1.5km radius │      Thermal Stress Window    │
└──────────────────────────┴──────────────┬──────────────┴───────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Autonomous AI Agent & Verifier Pipeline                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Tools: get_weather, compute_risks, optimize_centers, forecast_demand, make_plan       │
│  Verification Gates: V1 Schema ──► V2 Numeric Grounding ──► V3 Safety Directives       │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  Interactive User UI                                   │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Leaflet Choropleth Map   │ Hyperlocal GPS Location     │ Multi-Channel Alert Engine    │
│ Dynamic Layer Toggles    │ City Autocomplete Search    │ Ward Breakdown Drawer         │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

---

## 📊 Data Feeds & Standards

| Source / Telemetry | Endpoint / Protocol | Refresh Frequency | Standards Compliance |
| :--- | :--- | :--- | :--- |
| **Open-Meteo High-Res** | `api.open-meteo.com/v1/forecast` | Hourly / 7-Day | WMO standards, apparent feels-like $T_{\text{max}}$ |
| **NOAA CPC Niño-3.4** | `cpc.ncep.noaa.gov` | Weekly SST Anomaly | Global ENSO Advisory classification |
| **Copernicus Sentinel-2** | Microsoft Planetary STAC | 5-day orbital pass | 10m Normalized Difference Vegetation Index (NDVI) |
| **Google Earth Engine** | Landsat-9 TIRS Collection 2 | 8-day satellite pass | Radiative surface thermal emission (LST in °C) |
| **OpenStreetMap Facilities**| Overpass API (`overpass-api.de`)| On-demand Bbox | Verified public schools, halls, clinics, shelters |
| **National Grid Load** | Grid-India (POSOCO) / CEA | Seasonal baseload | State load despatch summer elasticity coefficients |
| **IMD Mausam Standards** | Indian Meteorological Dept | Baseline classification | Heatwave: $\ge 40^\circ\text{C}$ plains, departure $\ge 4.5^\circ\text{C}$ |

---

## 🚀 Quick Start & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm** or **pnpm**

### 1. Clone & Install
```bash
git clone https://github.com/your-username/heatshield.git
cd heatshield
npm install
```

### 2. Environment Variables
Create a `.env` file from the example:
```bash
cp .env.example .env
```
*(Optional: Provide a `GEMINI_API_KEY` for server-side generative translation and dynamic advisory enhancements).*

### 3. Launch Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🧪 Testing & Verification

HeatShield includes a mathematical test suite verifying all mathematical models:

```bash
# Run TypeScript compilation and static lint check
npm run lint

# Run the automated engine test suite (T1 - T9)
npx tsx tests/engine.test.ts

# Production optimized build
npm run build
```

---

## 🏙️ Supported Indian Metropolitan Catalog

HeatShield includes native geographic boundaries, historical baselines, and peak centers for 30+ major Indian municipal corporations:

* **Northern & Central**: Delhi NCT, Jaipur, Lucknow, Kanpur, Patna, Bhopal, Indore, Chandigarh, Varanasi.
* **Western**: Mumbai, Pune, Ahmedabad, Surat, Nagpur, Vadodara, Nashik.
* **Southern**: Bengaluru, Hyderabad, Chennai, Kochi, Thiruvananthapuram, Coimbatore, Visakhapatnam, Madurai.
* **Eastern**: Kolkata, Bhubaneswar, Ranchi, Guwahati, Cuttack.

---

## 📜 License
Distributed under the **Apache-2.0 License**. See `LICENSE` for details.
