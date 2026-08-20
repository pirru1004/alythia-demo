/**
 * Divergence Layer Logic & Agri-Intelligence Presets
 * One engine (Sentinel-1 SAR + Sentinel-2 MSI), Three Operational Readings:
 * - Box 1: Distribution & Inventory Positioning (Proposed Pilot Scope)
 * - Box 2: Demand Sensing & Forecasting (Deviation from Baseline)
 * - Box 3: Collection & Credit Planning (Composite Stress Rank & Agmarknet)
 *
 * Feature Expansion:
 * - Multi-Year Observation Slider (2021 – 2026)
 * - Dynamic Data Layer / Satellite Source Switcher (Fusion, SAR, Optical, Weather, Divergence, Mandi)
 * - Pixel Footprint Telemetry Inspector with Acquisition Dates from All Sources
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

let divergenceMap = null;
let baseSatelliteLayer = null;
let agroPolygonsLayer = null;
let depotMarkersLayer = null;
let activePreset = 'box1'; // 'box1', 'box2', or 'box3'
let activeDataSource = 'fusion'; // 'fusion', 'sar', 'optical', 'weather', 'divergence', 'agristack'
let selectedYear = 2026;
let currentSweepStep = 2; // Scrubber index (0 to 5)

// Indian Agricultural Comparison Regions for Divergence Layer Demo
const agroCatchmentData = {
  cauvery_delta: {
    key: 'cauvery_delta',
    name: "Cauvery Delta (Tamil Nadu) — Paddy Rice Bowl",
    depotName: "Thanjavur Central Depot (Cauvery Delta)",
    center: [10.7870, 79.1378],
    zoom: 9,
    regionTag: "TAMIL NADU CAUVERY DELTA",
    bounds: [[10.45, 78.85], [11.15, 79.85]],
    
    // Box 1: Distribution & Inventory Positioning (The Pilot)
    b1: {
      catchmentAcreage: "94,600 ha",
      sowingP25: "Jul 04",
      sowingMedian: "Jul 18",
      sowingP75: "Aug 02",
      appWindow: "Aug 04 – Aug 16",
      tolerance: "±3 days",
      leadTime: "14 Days",
      leadPriority: "High Stocking Priority",
      stage: "Active Tillering Peak",
      stageColor: "#059669",
      soilMoisture: "36.8% (Mettur Canal Active)",
      readinessScore: "94.2%",
      readinessBadge: "Optimal Stocking",
      badgeClass: "badge-success",
      narrative: "Mettur reservoir canal releases have stabilized Kuruvai/Samba paddy transplantation. Depot buffer capacity warrants immediate SKU dispatch with 14 days lead time.",
      confidence: "97.6%",
      recList: [
        "Dispatch SKU batch #TN-CAU-90 to Thanjavur and Tiruvarur depots within 6 days.",
        "Stage vegetative foliar packs across Grand Anicut dealer network to prevent stockouts.",
        "Review 7-day Northeast monsoon onset forecast before final batch transit."
      ]
    },

    // Box 2: Demand Sensing & Forecasting (Acreage Expansion — Blue Visual)
    b2: {
      districtAcreage: "248,000 ha",
      baselineDelta: "+8.2% vs Baseline",
      baselineDeltaNum: 8.2,
      ciBand: "95% Confidence Band: [238,000 ha – 258,000 ha]",
      mixPaddy: "84%",
      mixPaddyShift: "+5% Shift",
      mixCotton: "11%",
      mixCottonShift: "-3% Shift (Pulses)",
      mixPulses: "5%",
      mixPulsesShift: "-2% Shift (Sugarcane)",
      ceilingPct: "38.6%",
      stressAnomaly: "+0.52σ (Reservoir Surplus)",
      divergenceScore: "+8.2%",
      divergenceBadge: "Acreage Expansion",
      badgeClass: "badge-success",
      narrative: "Acreage expansion (+8.2% above 5-year baseline) driven by timely water release from Cauvery basin reservoirs and favorable sowing moisture.",
      confidence: "96.8%",
      recList: [
        "Increase regional demand allocation by +8.2% across delta dealer touchpoints.",
        "Expand crop protection SKU allocation for blast and leaf folder resistance.",
        "Ingest distributor channel inventory and promotional terms to raise explanatory ceiling."
      ]
    },

    // Box 3: Collection & Credit Planning (Strong Liquidity / Low Risk)
    b3: {
      stressRank: "Rank 4 / 5",
      stressRankNum: 4,
      stressRankLabel: "Strong Liquidity",
      prodAnomaly: "+3.4% Relative Biomass Surge",
      harvestWindow: "Nov 12 – Nov 28",
      cropConcentration: "HHI 0.86 (High Paddy Monoculture)",
      mandiPrice: "₹2,480 / quintal (+4.6% WoW)",
      creditScore: "Rank 4 / 5",
      creditBadge: "Low Credit Risk",
      badgeClass: "badge-success",
      narrative: "Assured canal irrigation and high vegetative biomass indices support standard 60-day DSO terms across Thanjavur and Nagapattinam dealers.",
      confidence: "97.2%",
      recList: [
        "Authorize standard 60-day commercial terms to accredited Cauvery dealer tier.",
        "Set post-harvest collection reconciliation starting Nov 20.",
        "Track direct procurement center (DPC) paddy arrival volumes across Tamil Nadu mandis to time cash collections."
      ]
    }
  },

  nizamabad_karimnagar: {
    key: 'nizamabad_karimnagar',
    name: "Nizamabad–Karimnagar Belt (Telangana) — Deficit Anomaly",
    depotName: "Nizamabad–Karimnagar Agro Hub (Telangana)",
    center: [18.7300, 78.6800],
    zoom: 9,
    regionTag: "TELANGANA AGRO-CLUSTERS",
    bounds: [[18.25, 77.90], [19.10, 79.45]],
    
    // Box 1: Distribution & Inventory Positioning (Urgent Placement)
    b1: {
      catchmentAcreage: "76,200 ha",
      sowingP25: "Jun 12",
      sowingMedian: "Jun 25",
      sowingP75: "Jul 09",
      appWindow: "Jul 14 – Jul 26",
      tolerance: "±4 days",
      leadTime: "6 Days Remaining",
      leadPriority: "Urgent Placement",
      stage: "Heading / Panicle Initiation",
      stageColor: "#0284C7",
      soilMoisture: "27.4% (Groundwater Dependent)",
      readinessScore: "88.5%",
      readinessBadge: "Urgent Recheck",
      badgeClass: "badge-warning",
      narrative: "Tubewell groundwater dependency and delayed canal lift irrigation have condensed vegetative application windows into 6 days.",
      confidence: "94.8%",
      recList: [
        "Expedite heading-stage fungicide SKU shipments to Armoor and Jagtial depots.",
        "Alert field sales teams: 6 days of lead time remaining before application window closes.",
        "Cross-verify Sriram Sagar Project (SRSP) reservoir lift hours before secondary dispatch."
      ]
    },

    // Box 2: Demand Sensing & Forecasting (Critical Deficit — Red Visual)
    b2: {
      districtAcreage: "186,400 ha",
      baselineDelta: "-11.6% vs Baseline",
      baselineDeltaNum: -11.6,
      ciBand: "95% Confidence Band: [178,000 ha – 194,000 ha]",
      mixPaddy: "52%",
      mixPaddyShift: "-9% Shift",
      mixCotton: "34%",
      mixCottonShift: "+6% Shift",
      mixPulses: "14%",
      mixPulsesShift: "+3% Shift (Red Gram)",
      ceilingPct: "35.4%",
      stressAnomaly: "-0.68σ (Deficit Anomaly)",
      divergenceScore: "-11.6%",
      divergenceBadge: "Critical Deficit",
      badgeClass: "badge-danger",
      narrative: "Major crop mix shift: Farmers switched 9% of intended paddy acreage into cotton & red gram due to canal rationing and groundwater power constraints.",
      confidence: "95.1%",
      recList: [
        "Cut paddy pesticide SKU quotas by -11.6% to avert distributor deadstock and unsold returns.",
        "Ramp up cotton bollworm SKU allocation and drought foliar bio-stimulants (+6%).",
        "Ingest dealer credit limits and promotional schedules to recalibrate demand forecast."
      ]
    },

    // Box 3: Collection & Credit Planning (Elevated Scrutiny)
    b3: {
      stressRank: "Rank 2 / 5",
      stressRankNum: 2,
      stressRankLabel: "Moderate-High Scrutiny",
      prodAnomaly: "-6.2% Relative Biomass Anomaly",
      harvestWindow: "Oct 18 – Nov 02",
      cropConcentration: "HHI 0.64 (Mixed Cotton/Paddy)",
      mandiPrice: "₹2,310 / quintal (-1.8% DoD)",
      creditScore: "Rank 2 / 5",
      creditBadge: "Elevated Scrutiny",
      badgeClass: "badge-warning",
      narrative: "Groundwater drawdown and biomass deficit elevate credit scrutiny and DSO default risk across Telangana dealer catchments.",
      confidence: "93.8%",
      recList: [
        "Place Nizamabad and Karimnagar dealer network on Rank 2 tightened 30-day DSO settlement terms.",
        "Implement collateralized or advance-payment requirements for secondary SKU orders.",
        "Align debt collection milestones with peak cotton and paddy mandi arrivals in early November."
      ]
    }
  }
};

// Multi-Year Telemetry & Observation Metadata across Connected Satellite & Ground Ingests
const agroYearlyTelemetryData = {
  cauvery_delta: {
    2026: {
      label: "2026 (Live Kharif)",
      acreage: "248,000 ha",
      delta: "+8.2% vs Baseline",
      deltaNum: 8.2,
      ci: "95% CI: [238k – 258k ha]",
      s1Date: "2026-07-18",
      s1Val: "-13.4 dB (VH/VV Coherent)",
      s1Sub: "Orbit 128 Ascending · 10m GSD",
      s2Date: "2026-07-22",
      s2Val: "NDVI: 0.76 (Active Canopy)",
      s2Sub: "Tile 44PNB · 1.8% Cloud Cover",
      era5Date: "2026-07-26",
      era5Val: "Soil Moisture: 36.8%",
      era5Sub: "Precip: +4.2% LPA · 28.4°C",
      mandiDate: "2026-07-28",
      mandiVal: "₹2,480 / q (+4.6% WoW)",
      mandiSub: "Thanjavur APMC · Registry Synced"
    },
    2025: {
      label: "2025 (Near-Normal)",
      acreage: "234,000 ha",
      delta: "+2.1% vs Baseline",
      deltaNum: 2.1,
      ci: "95% CI: [226k – 242k ha]",
      s1Date: "2025-07-16",
      s1Val: "-14.1 dB (Normal Tillering)",
      s1Sub: "Orbit 128 Ascending · Coherent",
      s2Date: "2025-07-20",
      s2Val: "NDVI: 0.71 (Normal Canopy)",
      s2Sub: "Tile 44PNB · 4.2% Cloud Cover",
      era5Date: "2025-07-25",
      era5Val: "Soil Moisture: 33.2%",
      era5Sub: "Precip: +1.1% LPA · 29.1°C",
      mandiDate: "2025-07-28",
      mandiVal: "₹2,320 / q (Baseline)",
      mandiSub: "Thanjavur APMC · Finalized"
    },
    2024: {
      label: "2024 (Transitional)",
      acreage: "226,000 ha",
      delta: "-1.4% vs Baseline",
      deltaNum: -1.4,
      ci: "95% CI: [218k – 234k ha]",
      s1Date: "2024-07-17",
      s1Val: "-14.8 dB (Delayed Sowing)",
      s1Sub: "Orbit 128 Ascending · 10m GSD",
      s2Date: "2024-07-21",
      s2Val: "NDVI: 0.64 (Emergence Delay)",
      s2Sub: "Tile 44PNB · 2.1% Cloud Cover",
      era5Date: "2024-07-25",
      era5Val: "Soil Moisture: 29.8%",
      era5Sub: "Precip: -3.8% LPA · 30.2°C",
      mandiDate: "2024-07-27",
      mandiVal: "₹2,240 / q (-2.1%)",
      mandiSub: "Thanjavur APMC · Historical"
    },
    2023: {
      label: "2023 (El Niño Deficit)",
      acreage: "198,000 ha",
      delta: "-13.6% vs Baseline",
      deltaNum: -13.6,
      ci: "95% CI: [190k – 206k ha]",
      s1Date: "2023-07-15",
      s1Val: "-18.2 dB (Low Backscatter / Dry)",
      s1Sub: "Orbit 128 Ascending · Drought",
      s2Date: "2023-07-19",
      s2Val: "NDVI: 0.48 (Severe Water Stress)",
      s2Sub: "Tile 44PNB · 0.9% Cloud Cover",
      era5Date: "2023-07-24",
      era5Val: "Soil Moisture: 21.4%",
      era5Sub: "Precip: -22.4% LPA (Critical)",
      mandiDate: "2023-07-28",
      mandiVal: "₹2,150 / q (-8.4%)",
      mandiSub: "Thanjavur APMC · Drought Record"
    },
    2022: {
      label: "2022 (Normal Monsoon)",
      acreage: "236,000 ha",
      delta: "+3.0% vs Baseline",
      deltaNum: 3.0,
      ci: "95% CI: [228k – 244k ha]",
      s1Date: "2022-07-18",
      s1Val: "-13.9 dB (Healthy Tillering)",
      s1Sub: "Orbit 128 Ascending · 10m GSD",
      s2Date: "2022-07-22",
      s2Val: "NDVI: 0.73 (Good Canopy)",
      s2Sub: "Tile 44PNB · 3.8% Cloud Cover",
      era5Date: "2022-07-26",
      era5Val: "Soil Moisture: 35.1%",
      era5Sub: "Precip: +3.2% LPA · 28.9°C",
      mandiDate: "2022-07-28",
      mandiVal: "₹2,080 / q",
      mandiSub: "Thanjavur APMC · Historical"
    },
    2021: {
      label: "2021 (La Niña Surge)",
      acreage: "252,000 ha",
      delta: "+10.0% vs Baseline",
      deltaNum: 10.0,
      ci: "95% CI: [244k – 260k ha]",
      s1Date: "2021-07-19",
      s1Val: "-12.8 dB (High Soil Moisture)",
      s1Sub: "Orbit 128 Ascending · Water Surge",
      s2Date: "2021-07-23",
      s2Val: "NDVI: 0.79 (Vigorous Canopy)",
      s2Sub: "Tile 44PNB · 5.1% Cloud Cover",
      era5Date: "2021-07-27",
      era5Val: "Soil Moisture: 41.2%",
      era5Sub: "Precip: +14.8% LPA (Surplus)",
      mandiDate: "2021-07-29",
      mandiVal: "₹1,960 / q",
      mandiSub: "Thanjavur APMC · High Supply"
    }
  },

  nizamabad_karimnagar: {
    2026: {
      label: "2026 (Live Kharif)",
      acreage: "186,400 ha",
      delta: "-11.6% vs Baseline",
      deltaNum: -11.6,
      ci: "95% CI: [178k – 194k ha]",
      s1Date: "2026-07-12",
      s1Val: "-16.2 dB (Canal Rationing)",
      s1Sub: "Orbit 70 Descending · 10m GSD",
      s2Date: "2026-07-16",
      s2Val: "NDVI: 0.58 (Mixed Cotton/Paddy)",
      s2Sub: "Tile 44QKB · 3.4% Cloud Cover",
      era5Date: "2026-07-22",
      era5Val: "Soil Moisture: 27.4%",
      era5Sub: "Precip: -8.6% LPA · 31.2°C",
      mandiDate: "2026-07-28",
      mandiVal: "₹2,310 / q (-1.8% DoD)",
      mandiSub: "Nizamabad APMC · Registry Synced"
    },
    2025: {
      label: "2025 (Moderate Variance)",
      acreage: "198,000 ha",
      delta: "-6.0% vs Baseline",
      deltaNum: -6.0,
      ci: "95% CI: [190k – 206k ha]",
      s1Date: "2025-07-14",
      s1Val: "-15.4 dB (Partial Lift)",
      s1Sub: "Orbit 70 Descending",
      s2Date: "2025-07-18",
      s2Val: "NDVI: 0.65 (Moderate Canopy)",
      s2Sub: "Tile 44QKB · 2.8% Cloud Cover",
      era5Date: "2025-07-23",
      era5Val: "Soil Moisture: 30.1%",
      era5Sub: "Precip: -2.1% LPA · 30.5°C",
      mandiDate: "2025-07-27",
      mandiVal: "₹2,220 / q",
      mandiSub: "Nizamabad APMC"
    },
    2024: {
      label: "2024 (Baseline Level)",
      acreage: "206,000 ha",
      delta: "-2.2% vs Baseline",
      deltaNum: -2.2,
      ci: "95% CI: [198k – 214k ha]",
      s1Date: "2024-07-13",
      s1Val: "-15.1 dB (Normal Lift)",
      s1Sub: "Orbit 70 Descending",
      s2Date: "2024-07-17",
      s2Val: "NDVI: 0.68",
      s2Sub: "Tile 44QKB · 1.9% Cloud Cover",
      era5Date: "2024-07-22",
      era5Val: "Soil Moisture: 32.4%",
      era5Sub: "Precip: +0.4% LPA · 29.8°C",
      mandiDate: "2024-07-26",
      mandiVal: "₹2,160 / q",
      mandiSub: "Nizamabad APMC"
    },
    2023: {
      label: "2023 (Severe El Niño Drought)",
      acreage: "164,000 ha",
      delta: "-22.2% vs Baseline",
      deltaNum: -22.2,
      ci: "95% CI: [156k – 172k ha]",
      s1Date: "2023-07-11",
      s1Val: "-19.4 dB (Severe Groundwater Stress)",
      s1Sub: "Orbit 70 Descending · Drought",
      s2Date: "2023-07-15",
      s2Val: "NDVI: 0.42 (Stunted Emergence)",
      s2Sub: "Tile 44QKB · 0.6% Cloud Cover",
      era5Date: "2023-07-21",
      era5Val: "Soil Moisture: 18.2%",
      era5Sub: "Precip: -28.6% LPA (Deficit)",
      mandiDate: "2023-07-28",
      mandiVal: "₹2,040 / q (-12.2%)",
      mandiSub: "Nizamabad APMC · Drought Failure"
    },
    2022: {
      label: "2022 (Surplus Monsoon)",
      acreage: "218,000 ha",
      delta: "+3.4% vs Baseline",
      deltaNum: 3.4,
      ci: "95% CI: [210k – 226k ha]",
      s1Date: "2022-07-15",
      s1Val: "-14.6 dB (Full Canal Supply)",
      s1Sub: "Orbit 70 Descending",
      s2Date: "2022-07-19",
      s2Val: "NDVI: 0.72",
      s2Sub: "Tile 44QKB · 4.1% Cloud Cover",
      era5Date: "2022-07-24",
      era5Val: "Soil Moisture: 34.6%",
      era5Sub: "Precip: +6.2% LPA · 29.2°C",
      mandiDate: "2022-07-28",
      mandiVal: "₹1,980 / q",
      mandiSub: "Nizamabad APMC"
    },
    2021: {
      label: "2021 (Favorable Kharif)",
      acreage: "224,000 ha",
      delta: "+6.2% vs Baseline",
      deltaNum: 6.2,
      ci: "95% CI: [216k – 232k ha]",
      s1Date: "2021-07-16",
      s1Val: "-13.8 dB (High Surface Water)",
      s1Sub: "Orbit 70 Descending",
      s2Date: "2021-07-20",
      s2Val: "NDVI: 0.75",
      s2Sub: "Tile 44QKB · 3.9% Cloud Cover",
      era5Date: "2021-07-25",
      era5Val: "Soil Moisture: 37.8%",
      era5Sub: "Precip: +11.4% LPA · 28.7°C",
      mandiDate: "2021-07-29",
      mandiVal: "₹1,880 / q",
      mandiSub: "Nizamabad APMC"
    }
  }
};

/**
 * Initializes the Leaflet map centered in India with Sentinel-1/2 fusion connection
 */
function initDivergenceMap() {
  const container = document.getElementById('divergence-map');
  if (!container || divergenceMap) return;

  // Center on India [21.7679° N, 78.8718° E] with zoom 5
  divergenceMap = L.map('divergence-map', {
    center: [21.7679, 78.8718],
    zoom: 5,
    minZoom: 3,
    maxZoom: 18,
    zoomControl: true,
    attributionControl: true
  });

  // Base Satellite Layer
  baseSatelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Sentinel-1 SAR + Sentinel-2 MSI Fusion &mdash; Alythia Agri-Engine',
    maxZoom: 18,
    zIndex: 10
  }).addTo(divergenceMap);

  agroPolygonsLayer = L.layerGroup().addTo(divergenceMap);
  depotMarkersLayer = L.layerGroup().addTo(divergenceMap);

  // Render India Agro-Depot pins & catchment polygons
  renderMapLayers();

  // Show default Cauvery Delta catchment
  updateMapFocus('cauvery_delta');

  // Track coordinate HUD on mouse move
  divergenceMap.on('mousemove', (e) => {
    const latElem = document.getElementById('divergence-lat');
    const lngElem = document.getElementById('divergence-lng');
    if (latElem) latElem.textContent = `${e.latlng.lat.toFixed(4)}° N`;
    if (lngElem) lngElem.textContent = `${e.latlng.lng.toFixed(4)}° E`;
  });
}

/**
 * Renders dynamic map layers based on the active preset & selected data layer source:
 */
function renderMapLayers() {
  if (!agroPolygonsLayer || !depotMarkersLayer) return;
  agroPolygonsLayer.clearLayers();
  depotMarkersLayer.clearLayers();

  const facilitySelect = document.getElementById('divergence-facility-select');
  const activeKey = facilitySelect?.value || 'cauvery_delta';

  Object.values(agroCatchmentData).forEach(item => {
    let polygonColor = '#10B981';
    let polygonFillOpacity = 0.25;
    let polygonLabel = item.name;
    const yearData = agroYearlyTelemetryData[item.key]?.[selectedYear] || agroYearlyTelemetryData[item.key]?.[2026];

    if (activeDataSource === 'sar') {
      // Sentinel-1 C-Band SAR Mode
      polygonColor = '#0EA5E9';
      polygonFillOpacity = 0.35;
      polygonLabel = `${item.name} · S1 SAR: ${yearData.s1Val} (${yearData.s1Date})`;
    } else if (activeDataSource === 'optical') {
      // Sentinel-2 Optical NDVI Mode
      polygonColor = '#10B981';
      polygonFillOpacity = 0.38;
      polygonLabel = `${item.name} · S2 Optical: ${yearData.s2Val} (${yearData.s2Date})`;
    } else if (activeDataSource === 'weather') {
      // ERA5 / IMD Gridded Weather Mode
      polygonColor = yearData.deltaNum < -10 ? '#EF4444' : '#3B82F6';
      polygonFillOpacity = 0.32;
      polygonLabel = `${item.name} · ERA5 Weather: ${yearData.era5Val} (${yearData.era5Date})`;
    } else if (activeDataSource === 'divergence' || activePreset === 'box2') {
      // Divergence Mode
      if (yearData.deltaNum < -10) {
        polygonColor = '#DC2626'; // Red for severe deficit
        polygonFillOpacity = 0.40;
      } else if (yearData.deltaNum < 0) {
        polygonColor = '#F59E0B'; // Amber for moderate deficit
        polygonFillOpacity = 0.28;
      } else {
        polygonColor = '#2563EB'; // Blue for acreage expansion
        polygonFillOpacity = 0.38;
      }
      polygonLabel = `${item.name} · Baseline Variance [${selectedYear}]: ${yearData.delta}`;
    } else if (activeDataSource === 'agristack' || activePreset === 'box3') {
      // Mandi & Stress Ranking Mode
      const rank = item.b3.stressRankNum;
      if (rank === 1) polygonColor = '#DC2626';
      else if (rank === 2) polygonColor = '#EA580C';
      else if (rank === 3) polygonColor = '#D97706';
      else if (rank === 4) polygonColor = '#059669';
      else polygonColor = '#2563EB';
      polygonLabel = `${item.name} · Mandi Price: ${yearData.mandiVal} (${yearData.mandiDate})`;
    } else {
      // Default Box 1: Stage Phenology Fusion
      polygonColor = item.b1.stageColor;
      polygonLabel = `${item.name} — Stage: ${item.b1.stage} (${selectedYear})`;
    }

    // Catchment Polygon Boundary (The Square Footprint)
    if (item.bounds) {
      const isSelectedRegion = item.key === activeKey;
      const rect = L.rectangle(item.bounds, {
        color: polygonColor,
        weight: isSelectedRegion ? 3 : 1.5,
        dashArray: activeDataSource === 'divergence' ? '4, 4' : undefined,
        fillColor: polygonColor,
        fillOpacity: isSelectedRegion ? Math.min(polygonFillOpacity + 0.1, 0.5) : polygonFillOpacity
      }).addTo(agroPolygonsLayer);

      // Bind detailed tooltip with acquisition dates
      const popupHtml = `
        <div style="font-family: sans-serif; font-size: 0.76rem; min-width: 220px; line-height: 1.4;">
          <strong style="color: #0F172A; font-size: 0.82rem;">${item.name}</strong><br>
          <span style="color: #64748B;">Observation Year: <strong>${selectedYear}</strong></span>
          <hr style="margin: 4px 0; border: none; border-top: 1px solid #E2E8F0;">
          <div>📡 <strong>S1 SAR (${yearData.s1Date}):</strong> ${yearData.s1Val}</div>
          <div>🌿 <strong>S2 MSI (${yearData.s2Date}):</strong> ${yearData.s2Val}</div>
          <div>🌧️ <strong>ERA5 (${yearData.era5Date}):</strong> ${yearData.era5Val}</div>
          <div>🌾 <strong>Mandi (${yearData.mandiDate}):</strong> ${yearData.mandiVal}</div>
        </div>
      `;
      rect.bindTooltip(polygonLabel, { direction: 'top', className: 'map-catchment-tooltip' });
      rect.bindPopup(popupHtml);

      rect.on('click', () => {
        const select = document.getElementById('divergence-facility-select');
        if (select) {
          select.value = item.key;
          select.dispatchEvent(new Event('change'));
        }
      });
    }

    // Depot & Dealer Network Pin
    const pinHtml = `
      <div class="div-pulse-wrapper">
        <div class="div-pulse-ring" style="border-color:${polygonColor};"></div>
        <div class="div-pulse-dot" style="background:${polygonColor};"></div>
        <div class="div-pin-tooltip">${item.depotName}</div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'custom-divergence-pin',
      html: pinHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker(item.center, { icon: customIcon }).addTo(depotMarkersLayer);
    marker.on('click', () => {
      const select = document.getElementById('divergence-facility-select');
      if (select) {
        select.value = item.key;
        select.dispatchEvent(new Event('change'));
      }
    });
  });
}

/**
 * Updates map focus when selecting a new catchment region
 */
function updateMapFocus(key) {
  const data = agroCatchmentData[key] || agroCatchmentData.cauvery_delta;
  if (!divergenceMap) return;

  // Smooth fly-to
  divergenceMap.flyTo(data.center, data.zoom, {
    duration: 1.2,
    easeLinearity: 0.25
  });

  // Update Coordinates HUD
  const latElem = document.getElementById('divergence-lat');
  const lngElem = document.getElementById('divergence-lng');
  const regionTag = document.getElementById('divergence-region-tag');
  if (latElem) latElem.textContent = `${data.center[0].toFixed(4)}° N`;
  if (lngElem) lngElem.textContent = `${data.center[1].toFixed(4)}° E`;
  if (regionTag) regionTag.textContent = data.regionTag;
}

/**
 * Populates all 3 sub-windows & analytics cards with data from the active catchment & year
 */
function populateCatchmentData(key) {
  const data = agroCatchmentData[key] || agroCatchmentData.cauvery_delta;
  const yearData = agroYearlyTelemetryData[data.key]?.[selectedYear] || agroYearlyTelemetryData[data.key]?.[2026];

  // 1. Sub-Window 1 (Box 1 · Distribution & Inventory Positioning)
  const b1Acreage = document.getElementById('b1-catchment-acreage');
  const b1Depot = document.getElementById('b1-depot-name');
  const b1P25 = document.getElementById('b1-sowing-p25');
  const b1Median = document.getElementById('b1-sowing-median');
  const b1P75 = document.getElementById('b1-sowing-p75');
  const b1AppWindow = document.getElementById('b1-app-window');
  const b1LeadTime = document.getElementById('b1-lead-time');

  if (b1Acreage) b1Acreage.textContent = data.b1.catchmentAcreage;
  if (b1Depot) b1Depot.textContent = data.depotName;
  if (b1P25) b1P25.textContent = data.b1.sowingP25;
  if (b1Median) b1Median.textContent = data.b1.sowingMedian;
  if (b1P75) b1P75.textContent = data.b1.sowingP75;
  if (b1AppWindow) b1AppWindow.textContent = data.b1.appWindow;
  if (b1LeadTime) b1LeadTime.textContent = data.b1.leadTime;

  // 2. Sub-Window 2 (Box 2 · Demand Sensing & Forecasting)
  const b2Acreage = document.getElementById('b2-district-acreage');
  const b2Delta = document.getElementById('b2-baseline-delta');
  const b2Ci = document.getElementById('b2-ci-band');
  const b2Paddy = document.getElementById('b2-mix-paddy');
  const b2PaddyShift = document.getElementById('b2-mix-paddy-shift');
  const b2Cotton = document.getElementById('b2-mix-cotton');
  const b2CottonShift = document.getElementById('b2-mix-cotton-shift');
  const b2Pulses = document.getElementById('b2-mix-pulses');
  const b2PulsesShift = document.getElementById('b2-mix-pulses-shift');
  const b2Ceiling = document.getElementById('b2-ceiling-pct');

  if (b2Acreage) b2Acreage.textContent = yearData.acreage;
  if (b2Delta) {
    b2Delta.textContent = yearData.delta;
    b2Delta.style.color = yearData.deltaNum < 0 ? '#DC2626' : '#2563EB';
  }
  if (b2Ci) b2Ci.textContent = yearData.ci;
  if (b2Paddy) b2Paddy.textContent = data.b2.mixPaddy;
  if (b2PaddyShift) b2PaddyShift.textContent = data.b2.mixPaddyShift;
  if (b2Cotton) b2Cotton.textContent = data.b2.mixCotton;
  if (b2CottonShift) b2CottonShift.textContent = data.b2.mixCottonShift;
  if (b2Pulses) b2Pulses.textContent = data.b2.mixPulses;
  if (b2PulsesShift) b2PulsesShift.textContent = data.b2.mixPulsesShift;
  if (b2Ceiling) b2Ceiling.textContent = data.b2.ceilingPct;

  // 3. Sub-Window 3 (Box 3 · Collection & Credit Planning)
  const b3Rank = document.getElementById('b3-stress-rank');
  const b3Anomaly = document.getElementById('b3-prod-anomaly');
  const b3Harvest = document.getElementById('b3-harvest-window');
  const b3Concentration = document.getElementById('b3-crop-concentration');
  const b3Mandi = document.getElementById('b3-mandi-price');

  if (b3Rank) b3Rank.textContent = data.b3.stressRank;
  if (b3Anomaly) b3Anomaly.textContent = `${yearData.deltaNum >= 0 ? '+' : ''}${yearData.deltaNum}% Biomass Delta`;
  if (b3Harvest) b3Harvest.textContent = data.b3.harvestWindow;
  if (b3Concentration) b3Concentration.textContent = data.b3.cropConcentration;
  if (b3Mandi) b3Mandi.textContent = yearData.mandiVal;

  // 4. Update Pixel Footprint Telemetry HUD (All Sources with Dates)
  updatePixelTelemetryHUD(data, yearData);

  // 5. Update Right Column (Decision Analytics Score & Prescriptive Action)
  updateRightColumnAnalytics(data, yearData);

  // 6. Update Map Viewport & Polygons
  updateMapFocus(key);
  renderMapLayers();
}

/**
 * Updates the floating Pixel Footprint Telemetry Inspector HUD with dates from all connected sources
 */
function updatePixelTelemetryHUD(regionData, yearData) {
  const squareName = document.getElementById('hud-square-name');
  const squareCoords = document.getElementById('hud-square-coords');
  const yearChip = document.getElementById('hud-year-chip');

  const s1Date = document.getElementById('hud-s1-date');
  const s1Val = document.getElementById('hud-s1-val');
  const s1Sub = document.getElementById('hud-s1-sub');

  const s2Date = document.getElementById('hud-s2-date');
  const s2Val = document.getElementById('hud-s2-val');
  const s2Sub = document.getElementById('hud-s2-sub');

  const era5Date = document.getElementById('hud-era5-date');
  const era5Val = document.getElementById('hud-era5-val');
  const era5Sub = document.getElementById('hud-era5-sub');

  const mandiDate = document.getElementById('hud-mandi-date');
  const mandiVal = document.getElementById('hud-mandi-val');
  const mandiSub = document.getElementById('hud-mandi-sub');

  if (squareName) squareName.textContent = `${regionData.name.split('—')[0].trim()} Square`;
  if (squareCoords && regionData.bounds) {
    squareCoords.textContent = `Bounds: ${regionData.bounds[0][0]}°–${regionData.bounds[1][0]}°N, ${regionData.bounds[0][1]}°–${regionData.bounds[1][1]}°E`;
  }
  if (yearChip) yearChip.textContent = `${selectedYear} (${selectedYear === 2026 ? 'Live' : 'Historical'})`;

  if (s1Date) s1Date.textContent = `📅 ${yearData.s1Date}`;
  if (s1Val) s1Val.textContent = yearData.s1Val;
  if (s1Sub) s1Sub.textContent = yearData.s1Sub;

  if (s2Date) s2Date.textContent = `📅 ${yearData.s2Date}`;
  if (s2Val) s2Val.textContent = yearData.s2Val;
  if (s2Sub) s2Sub.textContent = yearData.s2Sub;

  if (era5Date) era5Date.textContent = `📅 ${yearData.era5Date}`;
  if (era5Val) era5Val.textContent = yearData.era5Val;
  if (era5Sub) era5Sub.textContent = yearData.era5Sub;

  if (mandiDate) mandiDate.textContent = `📅 ${yearData.mandiDate}`;
  if (mandiVal) mandiVal.textContent = yearData.mandiVal;
  if (mandiSub) mandiSub.textContent = yearData.mandiSub;

  // Highlight active source card in HUD
  const cards = {
    sar: document.getElementById('card-src-sar'),
    optical: document.getElementById('card-src-optical'),
    weather: document.getElementById('card-src-weather'),
    agristack: document.getElementById('card-src-agristack')
  };

  Object.entries(cards).forEach(([srcKey, card]) => {
    if (card) {
      if (srcKey === activeDataSource) card.classList.add('highlighted');
      else card.classList.remove('highlighted');
    }
  });
}

/**
 * Updates Area 4 (Right Column) based on active preset and selected catchment/year
 */
function updateRightColumnAnalytics(data, yearData) {
  const rTitle = document.getElementById('rcol-title');
  const rSub = document.getElementById('rcol-sub');
  const rMetricLabel = document.getElementById('rcol-metric-label');
  const rMetricNumber = document.getElementById('rcol-metric-number');
  const rMetricBadge = document.getElementById('rcol-metric-badge');
  const rNarrative = document.getElementById('rcol-narrative');
  const rConfPct = document.getElementById('rcol-conf-pct');
  const rConfFill = document.getElementById('rcol-conf-fill');
  const rRecList = document.getElementById('rcol-rec-list');
  const rBreakdownTitle = document.getElementById('rcol-breakdown-title');

  const var1Name = document.getElementById('rcol-var1-name');
  const var1Val = document.getElementById('rcol-var1-val');
  const var2Name = document.getElementById('rcol-var2-name');
  const var2Val = document.getElementById('rcol-var2-val');
  const var3Name = document.getElementById('rcol-var3-name');
  const var3Val = document.getElementById('rcol-var3-val');
  const var4Name = document.getElementById('rcol-var4-name');
  const var4Val = document.getElementById('rcol-var4-val');

  if (rBreakdownTitle) rBreakdownTitle.textContent = "What we're seeing";

  if (activePreset === 'box1') {
    if (rTitle) rTitle.textContent = `Dispatch & Stocking Decision (${selectedYear})`;
    if (rSub) rSub.textContent = "Depot buffer stocking & application window lead time";
    if (rMetricLabel) rMetricLabel.textContent = "DEPOT READINESS INDEX";
    if (rMetricNumber) rMetricNumber.textContent = data.b1.readinessScore;
    if (rMetricBadge) {
      rMetricBadge.textContent = data.b1.readinessBadge;
      rMetricBadge.className = `score-badge ${data.b1.badgeClass}`;
    }
    if (rNarrative) rNarrative.textContent = data.b1.narrative;
    if (rConfPct) rConfPct.textContent = data.b1.confidence;
    if (rConfFill) rConfFill.style.width = data.b1.confidence;

    if (var1Name) var1Name.textContent = "Application Window Progress";
    if (var1Val) var1Val.textContent = data.b1.stage;
    if (var2Name) var2Name.textContent = "Soil Moisture & Canal Flow";
    if (var2Val) var2Val.textContent = yearData.era5Val;
    if (var3Name) var3Name.textContent = "Stockout Lead Time Remaining";
    if (var3Val) var3Val.textContent = data.b1.leadTime;
    if (var4Name) var4Name.textContent = "Catchment Observed Acreage";
    if (var4Val) var4Val.textContent = data.b1.catchmentAcreage;

    if (rRecList) {
      rRecList.innerHTML = data.b1.recList.map(item => `<li>${item}</li>`).join('');
    }
  } else if (activePreset === 'box2') {
    if (rTitle) rTitle.textContent = `Demand Divergence Assessment (${selectedYear})`;
    if (rSub) rSub.textContent = "District demand shift vs multi-year normal";
    if (rMetricLabel) rMetricLabel.textContent = "NET DEMAND DIVERGENCE";
    if (rMetricNumber) rMetricNumber.textContent = yearData.delta;
    if (rMetricBadge) {
      rMetricBadge.textContent = yearData.deltaNum < 0 ? 'Deficit Variance' : 'Acreage Expansion';
      rMetricBadge.className = `score-badge ${yearData.deltaNum < 0 ? 'badge-danger' : 'badge-success'}`;
    }
    if (rNarrative) rNarrative.textContent = data.b2.narrative;
    if (rConfPct) rConfPct.textContent = data.b2.confidence;
    if (rConfFill) rConfFill.style.width = data.b2.confidence;

    if (var1Name) var1Name.textContent = "District Demand vs Baseline";
    if (var1Val) var1Val.textContent = yearData.delta;
    if (var2Name) var2Name.textContent = "Vegetation Stress Anomaly";
    if (var2Val) var2Val.textContent = yearData.s2Val;
    if (var3Name) var3Name.textContent = "Agronomic Explanatory Ceiling";
    if (var3Val) var3Val.textContent = `${data.b2.ceilingPct} Error Explained`;
    if (var4Name) var4Name.textContent = "Dominant Crop Mix Shift";
    if (var4Val) var4Val.textContent = `Paddy ${data.b2.mixPaddyShift}`;

    if (rRecList) {
      rRecList.innerHTML = data.b2.recList.map(item => `<li>${item}</li>`).join('');
    }
  } else if (activePreset === 'box3') {
    if (rTitle) rTitle.textContent = `DSO & Collection Risk Score (${selectedYear})`;
    if (rSub) rSub.textContent = "Dealer stress rank, Mandi liquidity & settlement terms";
    if (rMetricLabel) rMetricLabel.textContent = "DSO & COLLECTION RISK SCORE";
    if (rMetricNumber) rMetricNumber.textContent = data.b3.creditScore;
    if (rMetricBadge) {
      rMetricBadge.textContent = data.b3.creditBadge;
      rMetricBadge.className = `score-badge ${data.b3.badgeClass}`;
    }
    if (rNarrative) rNarrative.textContent = data.b3.narrative;
    if (rConfPct) rConfPct.textContent = data.b3.confidence;
    if (rConfFill) rConfFill.style.width = data.b3.confidence;

    if (var1Name) var1Name.textContent = "Relative Biomass Anomaly";
    if (var1Val) var1Val.textContent = `${yearData.deltaNum >= 0 ? '+' : ''}${yearData.deltaNum}% vs Normal`;
    if (var2Name) var2Name.textContent = "Estimated Harvest Window";
    if (var2Val) var2Val.textContent = data.b3.harvestWindow;
    if (var3Name) var3Name.textContent = "Dealer Catchment Concentration";
    if (var3Val) var3Val.textContent = data.b3.cropConcentration;
    if (var4Name) var4Name.textContent = "Mandi Arrival Price (Agmarknet)";
    if (var4Val) var4Val.textContent = yearData.mandiVal;

    if (rRecList) {
      rRecList.innerHTML = data.b3.recList.map(item => `<li>${item}</li>`).join('');
    }
  }
}

/**
 * Updates map titles, badges, and legend when switching presets or data layers
 */
function updateMapLensUI() {
  const mapTitle = document.getElementById('map-lens-title');
  const mapSub = document.getElementById('map-lens-sub');
  const mapBadgeText = document.getElementById('map-active-badge-text');
  const mapLegendStrip = document.getElementById('matrix-legend-strip');

  if (activeDataSource === 'sar') {
    if (mapTitle) mapTitle.textContent = `Sentinel-1 C-Band SAR Backscatter (${selectedYear})`;
    if (mapSub) mapSub.textContent = "VV/VH coherent radar scatter · Day/night all-weather canopy penetration";
    if (mapBadgeText) mapBadgeText.textContent = "S1 SAR Active";
    if (mapLegendStrip) {
      mapLegendStrip.innerHTML = `
        <div class="legend-item"><span class="legend-swatch" style="background:#0EA5E9;"></span> High Backscatter (&gt; -12 dB)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#38BDF8;"></span> Medium (-14 dB to -16 dB)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#64748B;"></span> Low Backscatter (&lt; -18 dB)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#D97706; border-radius:50%;"></span> Depot &amp; Dealer Hub</div>
      `;
    }
  } else if (activeDataSource === 'optical') {
    if (mapTitle) mapTitle.textContent = `Sentinel-2 Optical NDVI Canopy Vigor (${selectedYear})`;
    if (mapSub) mapSub.textContent = "10m VNIR/SWIR false-color reflectance · Cloud-masked vegetation index";
    if (mapBadgeText) mapBadgeText.textContent = "S2 Optical Active";
    if (mapLegendStrip) {
      mapLegendStrip.innerHTML = `
        <div class="legend-item"><span class="legend-swatch" style="background:#059669;"></span> High Vigor (NDVI &gt; 0.75)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#10B981;"></span> Moderate (NDVI 0.60 – 0.75)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#F59E0B;"></span> Water Stress (NDVI &lt; 0.50)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#D97706; border-radius:50%;"></span> Depot &amp; Dealer Hub</div>
      `;
    }
  } else if (activeDataSource === 'weather') {
    if (mapTitle) mapTitle.textContent = `ERA5 / IMD Gridded Weather & Soil (${selectedYear})`;
    if (mapSub) mapSub.textContent = "0.05° reanalysis precip departure & 0–7cm soil moisture";
    if (mapBadgeText) mapBadgeText.textContent = "ERA5 / IMD Active";
    if (mapLegendStrip) {
      mapLegendStrip.innerHTML = `
        <div class="legend-item"><span class="legend-swatch" style="background:#2563EB;"></span> Rainfall Surplus (&gt; +5% LPA)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#3B82F6;"></span> Normal (±5% LPA)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#EF4444;"></span> Deficit Inundation (&lt; -10%)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#D97706; border-radius:50%;"></span> Depot &amp; Dealer Hub</div>
      `;
    }
  } else if (activeDataSource === 'divergence' || activePreset === 'box2') {
    if (mapTitle) mapTitle.textContent = `District Divergence & Deviation Lens (${selectedYear})`;
    if (mapSub) mapSub.textContent = "Coloured by deviation from own historical baseline (Red = Below, Blue = Above)";
    if (mapBadgeText) mapBadgeText.textContent = "Baseline Divergence Active";
    if (mapLegendStrip) {
      mapLegendStrip.innerHTML = `
        <div class="legend-item"><span class="legend-swatch" style="background:#DC2626;"></span> Deficit vs Baseline (&lt; -10%)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#F59E0B;"></span> Moderate Deficit (-1% to -10%)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#2563EB;"></span> Acreage Expansion (&gt; +5%)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#D97706; border-radius:50%;"></span> Depot &amp; Dealer Hub</div>
      `;
    }
  } else if (activeDataSource === 'agristack' || activePreset === 'box3') {
    if (mapTitle) mapTitle.textContent = `Composite Stress & Mandi Risk Lens (${selectedYear})`;
    if (mapSub) mapSub.textContent = "Dealers coloured by composite stress rank (Rank 1 to 5), not by yield";
    if (mapBadgeText) mapBadgeText.textContent = "Stress Ranking Active";
    if (mapLegendStrip) {
      mapLegendStrip.innerHTML = `
        <div class="legend-item"><span class="legend-swatch" style="background:#DC2626;"></span> Rank 1 (High Credit Risk)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#EA580C;"></span> Rank 2 (Scrutiny)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#D97706;"></span> Rank 3 (Neutral)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#059669;"></span> Rank 4 (Good)</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#2563EB;"></span> Rank 5 (Optimal Liquidity)</div>
      `;
    }
  } else {
    if (mapTitle) mapTitle.textContent = `Agri-Spatial Map & Sowing Front Lens (${selectedYear})`;
    if (mapSub) mapSub.textContent = "Coloured by current crop stage · Depots overlaid · Scrubber drives sowing sweep";
    if (mapBadgeText) mapBadgeText.textContent = "Stage Phenology Active";
    if (mapLegendStrip) {
      mapLegendStrip.innerHTML = `
        <div class="legend-item"><span class="legend-swatch" style="background:#10B981;"></span> Sowing / Vegetative</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#059669;"></span> Active Tillering Peak</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#0284C7;"></span> Heading / Flowering</div>
        <div class="legend-item"><span class="legend-swatch" style="background:#D97706; border-radius:50%;"></span> Depot &amp; Dealer Hub</div>
      `;
    }
  }

  // Re-render map layer styling
  renderMapLayers();
}

/**
 * Switches the active Satellite Data Layer / Sensor Source
 */
function switchMapDataSource(sourceKey) {
  activeDataSource = sourceKey;

  // Update button active classes
  document.querySelectorAll('.source-layer-btn').forEach(btn => {
    if (btn.dataset.source === sourceKey) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  updateMapLensUI();

  const facilitySelect = document.getElementById('divergence-facility-select');
  const selectedKey = facilitySelect?.value || 'cauvery_delta';
  populateCatchmentData(selectedKey);
}

/**
 * Switches the active observation year (2021 to 2026)
 */
function switchObservationYear(year) {
  selectedYear = parseInt(year, 10);

  // Update Year Slider UI
  const slider = document.getElementById('divergence-year-slider');
  if (slider) slider.value = selectedYear;

  const yearLabel = document.getElementById('year-slider-active-label');
  if (yearLabel) {
    if (selectedYear === 2026) yearLabel.textContent = "2026 (Live Kharif)";
    else if (selectedYear === 2023) yearLabel.textContent = "2023 (El Niño Drought)";
    else yearLabel.textContent = `${selectedYear} (Historical)`;
  }

  document.querySelectorAll('.year-mark').forEach(mark => {
    if (parseInt(mark.dataset.year, 10) === selectedYear) mark.classList.add('active');
    else mark.classList.remove('active');
  });

  updateMapLensUI();

  const facilitySelect = document.getElementById('divergence-facility-select');
  const selectedKey = facilitySelect?.value || 'cauvery_delta';
  populateCatchmentData(selectedKey);
}

/**
 * Switches the active Agri-Intelligence Preset (Box 1, Box 2, Box 3)
 */
function switchAgriPreset(presetKey) {
  activePreset = presetKey;

  // Toggle button active states
  const presetBtns = {
    box1: document.getElementById('btn-layer-box1'),
    box2: document.getElementById('btn-layer-box2'),
    box3: document.getElementById('btn-layer-box3')
  };

  Object.entries(presetBtns).forEach(([key, btn]) => {
    if (btn) {
      if (key === presetKey) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  // Toggle sub-panel active states
  const panels = {
    box1: document.getElementById('panel-layer-box1'),
    box2: document.getElementById('panel-layer-box2'),
    box3: document.getElementById('panel-layer-box3')
  };

  Object.entries(panels).forEach(([key, panel]) => {
    if (panel) {
      if (key === presetKey) {
        panel.classList.remove('hidden');
        panel.classList.add('active');
      } else {
        panel.classList.add('hidden');
        panel.classList.remove('active');
      }
    }
  });

  // Update Map UI & Right Column
  updateMapLensUI();

  const facilitySelect = document.getElementById('divergence-facility-select');
  const selectedKey = facilitySelect?.value || 'cauvery_delta';
  populateCatchmentData(selectedKey);
}

/**
 * Invalidates size when view becomes visible to prevent grey tile bugs
 */
export function resizeDivergenceMap() {
  if (divergenceMap) {
    setTimeout(() => {
      divergenceMap.invalidateSize();
    }, 250);
  } else {
    setTimeout(initDivergenceMap, 100);
  }
}

/**
 * Initializes all event listeners and controllers in the Divergence Layer
 */
export function initDivergenceLayer() {
  const facilitySelect = document.getElementById('divergence-facility-select');
  const recalibrateBtn = document.getElementById('btn-recalibrate-divergence');
  const exportBtn = document.getElementById('btn-export-divergence');
  const syncBtn = document.getElementById('btn-sync-registry');
  const timelineTicks = document.querySelectorAll('#timeline-scrubber-ticks .tick-btn');
  const yearSlider = document.getElementById('divergence-year-slider');
  const yearMarks = document.querySelectorAll('.year-mark');
  const sourceButtons = document.querySelectorAll('.source-layer-btn');

  // Initialize Map
  initDivergenceMap();

  // Initial population with default Cauvery Delta catchment
  populateCatchmentData('cauvery_delta');

  // Preset Box Buttons
  document.getElementById('btn-layer-box1')?.addEventListener('click', () => switchAgriPreset('box1'));
  document.getElementById('btn-layer-box2')?.addEventListener('click', () => switchAgriPreset('box2'));
  document.getElementById('btn-layer-box3')?.addEventListener('click', () => switchAgriPreset('box3'));

  // Source Layer Switcher Buttons
  sourceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.source;
      if (src) switchMapDataSource(src);
    });
  });

  // Year Slider input listener
  yearSlider?.addEventListener('input', (e) => {
    switchObservationYear(e.target.value);
  });

  yearMarks.forEach(mark => {
    mark.addEventListener('click', () => {
      const y = mark.dataset.year;
      if (y) switchObservationYear(y);
    });
  });

  // Facility change listener
  facilitySelect?.addEventListener('change', (e) => {
    populateCatchmentData(e.target.value);
  });

  // Timeline Scrubber (East to West Sowing Front Sweep)
  timelineTicks.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      timelineTicks.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSweepStep = index;

      // Simulate sowing sweep progression
      const rangeBar = document.getElementById('b1-sowing-range-bar');
      if (rangeBar) {
        const leftOffsets = ['5%', '12%', '20%', '35%', '55%', '75%'];
        const rightOffsets = ['60%', '45%', '25%', '15%', '8%', '2%'];
        rangeBar.style.left = leftOffsets[index] || '20%';
        rangeBar.style.right = rightOffsets[index] || '25%';
      }

      // Re-render polygons with swept progress
      renderMapLayers();
    });
  });

  // Recalibrate animation
  recalibrateBtn?.addEventListener('click', () => {
    recalibrateBtn.textContent = 'Recalibrating S1/S2 Fusion...';
    recalibrateBtn.disabled = true;
    setTimeout(() => {
      recalibrateBtn.textContent = 'Phenology Synced ✓';
      setTimeout(() => {
        recalibrateBtn.textContent = 'Recalibrate Sensors';
        recalibrateBtn.disabled = false;
      }, 1500);
    }, 800);
  });

  // Data Connections Modal
  const openConnBtn = document.getElementById('btn-open-connections-settings');
  const closeConnBtn = document.getElementById('btn-close-connections-modal');
  const closeConnFooterBtn = document.getElementById('btn-close-connections-modal-footer');
  const connModal = document.getElementById('divergence-connections-modal');

  const openModal = () => {
    if (connModal) {
      connModal.classList.remove('hidden');
      connModal.style.display = 'flex';
    }
  };

  const closeModal = () => {
    if (connModal) {
      connModal.classList.add('hidden');
      connModal.style.display = 'none';
    }
  };

  openConnBtn?.addEventListener('click', openModal);
  closeConnBtn?.addEventListener('click', closeModal);
  closeConnFooterBtn?.addEventListener('click', closeModal);

  // Close when clicking modal backdrop
  connModal?.addEventListener('click', (e) => {
    if (e.target === connModal) closeModal();
  });

  // Ping test buttons
  document.querySelectorAll('.test-conn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const origText = btn.textContent;
      btn.textContent = 'Pinging...';
      btn.disabled = true;
      btn.style.color = 'var(--ink-2)';

      setTimeout(() => {
        btn.textContent = '✓ 200 OK';
        btn.style.color = '#047857';
        btn.style.borderColor = '#A7F3D0';
        setTimeout(() => {
          btn.textContent = origText;
          btn.disabled = false;
          btn.style.color = '';
          btn.style.borderColor = '';
        }, 2000);
      }, 450);
    });
  });

  // Export action
  exportBtn?.addEventListener('click', () => {
    alert('Agri-Spatial Operational Dossier exported successfully to PDF.');
  });

  syncBtn?.addEventListener('click', () => {
    alert('Divergence Layer synchronized with AgriStack Crop Sown Registry.');
  });
}
