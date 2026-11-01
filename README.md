# 🛡️ HeatShield: Autonomous Urban Heatwave Response & Hyperlocal Cooling Platform

> **AI-orchestrated municipal heat action planner and citizen early warning system for Indian metropolitan cities.**

HeatShield bridges the gap between planetary earth observation data (Copernicus Sentinel-2, Landsat, Google Earth Engine), real-time meteorological models (Open-Meteo), and urban morphology to protect vulnerable communities from extreme heatwaves. It combines an autonomous, verified AI agent with hyperlocal citizen safety tools, spatial facility optimizers, and power grid stress forecasting.

---

## 🌟 Key Features

* **Hyperlocal GPS "Current Location"**: Instantly detects your exact neighborhood and coordinates, reverse geocodes to your Indian administrative sector, and surfaces immediate heat metrics and the nearest cooling shelter.
* **Automatic Severe Condition Notification System**: Automatically triggers multi-channel emergency alerts (Web Audio siren chime, HTML5 desktop push notifications, and high-visibility alert banner) whenever your area breaches critical heat thresholds ($\ge 75/100$ or under El Niño surges).
* **Autonomous AI Municipal Action Planner**: Generates deterministic, hallucination-free field action plans with inspectable reasoning traces and a 3-tier validation pipeline ($V_1$ schema, $V_2$ numeric grounding, $V_3$ safety enforcement).
* **Optimal Public Cooling Center Placement**: Greedy maximal coverage algorithm solving for $k$ optimal cooling centers within straight-line walking radii ($1.5\text{ km}$) to protect high-risk populations.
* **Power Grid Demand & Thermal Stress Forecasting**: Ridge-regression cooling demand model ($\text{MW}/^\circ\text{C}$) calculating peak electrical risk windows ($[13:00, 17:00)$) and optimal load-shifting periods ($[18:00, 22:00)$).
* **El Niño Climate Teleconnection (+2 °C)**: Live NOAA CPC Niño-3.4 Pacific SST integration allowing one-click simulation of regional monsoon heatwave surges.
* **Earth Observation Telemetry**: High-resolution Copernicus Sentinel-2 10m NDVI canopy maps, Google Earth Engine thermal LST, and OpenStreetMap urban building footprints.

---

## 📖 How to Use the Application

### 1. Monitor Your Neighborhood with "Current Location"
1. In the top navigation bar, click the **Current Location** button (or click **Locate Me** in the map controls toolbar).
2. Allow browser location permissions when prompted.
3. HeatShield will:
   * Identify your exact Indian locality (e.g. *Gachibowli, Hyderabad* or *Koramangala, Bengaluru*).
   * Automatically switch the city if you are located in a different urban center.
   * Drop a pulsating blue radar marker on the map at your coordinates.
   * Open the **Current Location Details** modal showing your sector's Heat Risk Score, feels-like peak temperature, nearest cooling facility distance (in meters), danger window, and actionable safety guidance.

---

### 2. Receiving Severe Heat Emergency Notifications
* **Automatic Alerts**: If your area enters **Severe** condition (risk score $\ge 75/100$ or under an extreme temperature surge):
  * A dual-tone synthesized **acoustic chime** will sound ($587\text{ Hz} \to 880\text{ Hz}$).
  * An **HTML5 desktop notification** will be dispatched even if the tab is in the background.
  * A high-visibility **Critical Severe Heat Alert** banner will anchor to the bottom of your screen with direct buttons to **Locate Nearest Shelter** and **View Safety Plan**.
* **Managing Alerts**:
  * Click the **Bell Icon** in the top header to view the Alerts Center.
  * Toggle **Browser Notifications** (Enable / Disable).
  * Toggle **Alert Chime Sound** (Sound On / Muted).
  * Click **Test Severe Alert Notification** to test the siren, notification, and banner.

---

### 3. Exploring City Wards & Sectors
* **City Search**: Use the search bar in the top navigation bar to select or search across 30+ major Indian cities (Bengaluru, Hyderabad, Mumbai, Delhi, Chennai, Kolkata, Ahmedabad, Jaipur, Pune, etc.).
* **Interactive Choropleth Map**:
  * Click on any ward or grid cell on the map to open the **Ward Breakdown Drawer**.
  * View the 7-day feels-like temperature sparkline, Copernicus Sentinel-2 canopy coverage, Google Earth Engine thermal LST, and building density.
* **Map Layer Toggles** (Top-Right of Map):
  * **Color Modes**: Switch between **Risk** ($H \times E \times V$), **Heat** (Apparent Temperature), **Green** (Tree Canopy / NDVI), and **Density** (Building Footprint).
  * **OSM Sites**: Toggle verified candidate public cooling sites.
  * **Centres**: Toggle activated municipal cooling centers with walking radius overlays.
  * **Basemaps**: Switch between Dark Canvas and OpenStreetMap.

---

### 4. Generating an Autonomous Municipal Heat Action Plan
1. In the hero strip at the top, click **Run Autonomous Planner** (or navigate to the **Action Plan** tab).
2. The AI Agent executes inspectable tool-calling steps:
   * Evaluates 7-day weather forecasts and computes sector risk matrices.
   * Optimizes the placement of $k$ cooling facilities for maximum coverage.
   * Models power grid stress windows and non-essential load shifting.
   * Verifies data grounding ($V_1$, $V_2$, $V_3$ gates).
   * Generates localized emergency advisories in English, Hindi, and Kannada.
3. Review the generated plan, activated facilities, and high-risk ward priorities.

---

### 5. Simulating Climate Stress & El Niño (+2 °C)
1. In the top navigation header, click the **El Niño (+2 °C)** toggle.
2. The platform instantly recalculates the entire city's hazard score using state-specific regional teleconnection multipliers based on the NOAA CPC Niño-3.4 index.
3. Observe how moderate and high-risk wards escalate into the **Severe** category and see how cooling center coverage dynamically shifts.

---

### 6. Reviewing Power Grid Demand & Data Sources
* **Demand Tab**: View hourly electricity load forecasts, cooling demand sensitivity ($\text{MW}/^\circ\text{C}$), critical thermal stress hours, and recommended load-shifting windows.
* **Risk Ranking Tab**: Inspect the tabular ranking of all wards sorted by composite vulnerability and priority.
* **Sources Tab**: Check live health status, API latency, and metadata for all 7 underlying data feeds.
* **Settings Modal** (Gear Icon): Customize planning parameters like number of centers ($k$), walking radius ($km$), hazard temperature thresholds, and weights for Hazard, Exposure, and Vulnerability.

---

## 🏗️ Technical Architecture & Data Feeds

| Layer | Source / Standard | Purpose |
| :--- | :--- | :--- |
| **Meteorological Forecasts** | Open-Meteo High-Resolution API | Hourly apparent temperature, relative humidity, wind speed |
| **Vegetation & Canopy** | Copernicus Sentinel-2 MSI (10m) | High-res NDVI (B4/B8) vegetation health & canopy coverage |
| **Surface Temperature** | NASA/USGS Landsat-9 & Google Earth Engine | Thermal Infrared Sensor (TIRS) Land Surface Temperature (LST) |
| **Cooling Infrastructure** | OpenStreetMap Overpass API | Verified public halls, schools, clinics, and transit shelters |
| **Urban Morphology** | OpenStreetMap Building Polygons | Building footprint density and heat trapping surface area |
| **Climate Oscillation** | NOAA Climate Prediction Center (CPC) | Niño-3.4 SST index and regional Indian teleconnections |
| **Electrical Grid Load** | OGD India (data.gov.in) & POSOCO/CEA | State load despatch baseload and summer elasticity coefficients |

---

## 💻 Local Development & Installation

### Prerequisites
* Node.js 18+ or Node.js 20+
* npm or pnpm

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/your-username/heatshield.git
cd heatshield

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Verification & Testing
```bash
# Run TypeScript compilation & linting
npm run lint

# Run automated mathematical acceptance test suite (T1 - T9)
npx tsx tests/engine.test.ts

# Production build
npm run build
```

---

## 📜 License
Distributed under the Apache-2.0 License.
