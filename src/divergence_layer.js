/**
 * Divergence Layer Logic & Agri-Intelligence Presets
 * One engine (Sentinel-1 SAR + Sentinel-2 MSI), Three Operational Readings:
 * - Box 1: Distribution & Inventory Positioning (Proposed Pilot Scope)
 * - Box 2: Demand Sensing & Forecasting (Deviation from Baseline)
 * - Box 3: Collection & Credit Planning (Composite Stress Rank & Agmarknet)
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

let divergenceMap = null;
let baseSatelliteLayer = null;
let agroPolygonsLayer = null;
let depotMarkersLayer = null;
let activePreset = 'box1'; // 'box1', 'box2', or 'box3'
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
      narrative: "Mettur reservoir canal releases have stabilized Kuruvai/Samba paddy transplantation. Catchment enters peak tillering with 14 days lead time.",
      confidence: "97.6%",
      recList: [
        "Dispatch SKU batch #TN-CAU-90 to Thanjavur and Tiruvarur railheads within 6 days.",
        "Target micro-catchments in Grand Anicut canal branch for tillering nutrients.",
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
        "Increase regional demand allocation by +8.2% across delta retail touchpoints.",
        "Expand crop protection portfolio for blast and leaf folder resistance.",
        "Ingest distributor channel inventory and settlement terms to raise ceiling."
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
      narrative: "Assured canal irrigation and high vegetative biomass indices support strong credit solvency across Thanjavur and Nagapattinam dealers.",
      confidence: "97.2%",
      recList: [
        "Authorize standard 60-day commercial terms to accredited Cauvery dealer tier.",
        "Set post-harvest collection reconciliation starting Nov 20.",
        "Track direct procurement center (DPC) paddy arrival volumes across Tamil Nadu mandis."
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
        "Expedite localized heading-stage fungicide shipments to Armoor and Jagtial hubs.",
        "Alert field teams to unseasonal brown planthopper (BPH) favourability spikes.",
        "Cross-verify Sriram Sagar Project (SRSP) water level before secondary dispatch."
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
        "Cut paddy pesticide shipment quotas by -11.6% to avert major distributor deadstock.",
        "Ramp up cotton bollworm protection and drought foliar bio-stimulants (+6%).",
        "Ingest dealer credit limits and promotional schedules to recalibrate forecast."
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
      narrative: "Groundwater drawdown and biomass deficit elevate credit scrutiny across Telangana dealer catchments.",
      confidence: "93.8%",
      recList: [
        "Place Nizamabad and Karimnagar dealer network on Rank 2 tightened 30-day settlement terms.",
        "Implement collateralized or advance-payment requirements for secondary orders.",
        "Align debt collection milestones with peak cotton and paddy mandi arrivals in early November."
      ]
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
 * Renders dynamic map layers based on the active preset:
 * - Box 1: Coloured by Current Crop Stage + Overlaid Depots
 * - Box 2: Coloured by Deviation from Baseline (Red = Below, Blue = Above)
 * - Box 3: Coloured by Composite Stress Rank (1 to 5)
 */
function renderMapLayers() {
  if (!agroPolygonsLayer || !depotMarkersLayer) return;
  agroPolygonsLayer.clearLayers();
  depotMarkersLayer.clearLayers();

  Object.values(agroCatchmentData).forEach(item => {
    let polygonColor = '#10B981';
    let polygonFillOpacity = 0.22;
    let polygonLabel = item.name;

    if (activePreset === 'box1') {
      // Box 1: Stage Phenology
      polygonColor = item.b1.stageColor;
      polygonLabel = `${item.name} — Stage: ${item.b1.stage}`;
    } else if (activePreset === 'box2') {
      // Box 2: Divergence from Baseline
      if (item.b2.baselineDeltaNum < -10) {
        polygonColor = '#DC2626'; // Deep Red for severe deficit
        polygonFillOpacity = 0.35;
      } else if (item.b2.baselineDeltaNum < 0) {
        polygonColor = '#F59E0B'; // Amber/Red for moderate deficit
        polygonFillOpacity = 0.25;
      } else {
        polygonColor = '#2563EB'; // Blue for acreage expansion
        polygonFillOpacity = 0.35;
      }
      polygonLabel = `${item.name} — Baseline Delta: ${item.b2.baselineDelta}`;
    } else if (activePreset === 'box3') {
      // Box 3: Composite Stress Rank (1 to 5)
      const rank = item.b3.stressRankNum;
      if (rank === 1) polygonColor = '#DC2626';
      else if (rank === 2) polygonColor = '#EA580C';
      else if (rank === 3) polygonColor = '#D97706';
      else if (rank === 4) polygonColor = '#059669';
      else polygonColor = '#2563EB';
      polygonLabel = `${item.name} — Composite Stress: ${item.b3.stressRank}`;
    }

    // Catchment Polygon Boundary
    if (item.bounds) {
      const rect = L.rectangle(item.bounds, {
        color: polygonColor,
        weight: 2,
        dashArray: activePreset === 'box2' ? '4, 4' : undefined,
        fillColor: polygonColor,
        fillOpacity: polygonFillOpacity
      }).addTo(agroPolygonsLayer);

      rect.bindTooltip(polygonLabel, { direction: 'top', className: 'map-catchment-tooltip' });
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
  const data = agroCatchmentData[key] || agroCatchmentData.karnal;
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
 * Populates all 3 sub-windows & analytics cards with data from the active catchment
 */
function populateCatchmentData(key) {
  const data = agroCatchmentData[key] || agroCatchmentData.cauvery_delta;

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

  if (b2Acreage) b2Acreage.textContent = data.b2.districtAcreage;
  if (b2Delta) {
    b2Delta.textContent = data.b2.baselineDelta;
    b2Delta.style.color = data.b2.baselineDeltaNum < 0 ? '#DC2626' : '#2563EB';
  }
  if (b2Ci) b2Ci.textContent = data.b2.ciBand;
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
  if (b3Anomaly) b3Anomaly.textContent = data.b3.prodAnomaly;
  if (b3Harvest) b3Harvest.textContent = data.b3.harvestWindow;
  if (b3Concentration) b3Concentration.textContent = data.b3.cropConcentration;
  if (b3Mandi) b3Mandi.textContent = data.b3.mandiPrice;

  // 4. Update Right Column (Decision Analytics Score & Prescriptive Action)
  updateRightColumnAnalytics(data);

  // 5. Update Map Viewport & Polygons
  updateMapFocus(key);
  renderMapLayers();
}

/**
 * Updates Area 4 (Right Column) based on active preset and selected catchment
 */
function updateRightColumnAnalytics(data) {
  const rTitle = document.getElementById('rcol-title');
  const rSub = document.getElementById('rcol-sub');
  const rMetricLabel = document.getElementById('rcol-metric-label');
  const rMetricNumber = document.getElementById('rcol-metric-number');
  const rMetricBadge = document.getElementById('rcol-metric-badge');
  const rNarrative = document.getElementById('rcol-narrative');
  const rConfPct = document.getElementById('rcol-conf-pct');
  const rConfFill = document.getElementById('rcol-conf-fill');
  const rRecList = document.getElementById('rcol-rec-list');

  const var1Name = document.getElementById('rcol-var1-name');
  const var1Val = document.getElementById('rcol-var1-val');
  const var2Name = document.getElementById('rcol-var2-name');
  const var2Val = document.getElementById('rcol-var2-val');
  const var3Name = document.getElementById('rcol-var3-name');
  const var3Val = document.getElementById('rcol-var3-val');
  const var4Name = document.getElementById('rcol-var4-name');
  const var4Val = document.getElementById('rcol-var4-val');

  if (activePreset === 'box1') {
    if (rTitle) rTitle.textContent = "Placement & Decision Score";
    if (rSub) rSub.textContent = "Optimal SKU stocking window & lead time";
    if (rMetricLabel) rMetricLabel.textContent = "PLACEMENT READINESS INDEX";
    if (rMetricNumber) rMetricNumber.textContent = data.b1.readinessScore;
    if (rMetricBadge) {
      rMetricBadge.textContent = data.b1.readinessBadge;
      rMetricBadge.className = `score-badge ${data.b1.badgeClass}`;
    }
    if (rNarrative) rNarrative.textContent = data.b1.narrative;
    if (rConfPct) rConfPct.textContent = data.b1.confidence;
    if (rConfFill) rConfFill.style.width = data.b1.confidence;

    if (var1Name) var1Name.textContent = "Phenology Stage Progress";
    if (var1Val) var1Val.textContent = data.b1.stage;
    if (var2Name) var2Name.textContent = "Soil Moisture (0–7cm)";
    if (var2Val) var2Val.textContent = data.b1.soilMoisture;
    if (var3Name) var3Name.textContent = "Application Lead Time";
    if (var3Val) var3Val.textContent = data.b1.leadTime;
    if (var4Name) var4Name.textContent = "Catchment Buffer Acreage";
    if (var4Val) var4Val.textContent = data.b1.catchmentAcreage;

    if (rRecList) {
      rRecList.innerHTML = data.b1.recList.map(item => `<li>${item}</li>`).join('');
    }
  } else if (activePreset === 'box2') {
    if (rTitle) rTitle.textContent = "Demand Divergence Assessment";
    if (rSub) rSub.textContent = "Deviation from historical multi-year normal";
    if (rMetricLabel) rMetricLabel.textContent = "NET FORECAST DIVERGENCE";
    if (rMetricNumber) rMetricNumber.textContent = data.b2.divergenceScore;
    if (rMetricBadge) {
      rMetricBadge.textContent = data.b2.divergenceBadge;
      rMetricBadge.className = `score-badge ${data.b2.badgeClass}`;
    }
    if (rNarrative) rNarrative.textContent = data.b2.narrative;
    if (rConfPct) rConfPct.textContent = data.b2.confidence;
    if (rConfFill) rConfFill.style.width = data.b2.confidence;

    if (var1Name) var1Name.textContent = "District Acreage vs Baseline";
    if (var1Val) var1Val.textContent = data.b2.baselineDelta;
    if (var2Name) var2Name.textContent = "Vegetation Stress Anomaly";
    if (var2Val) var2Val.textContent = data.b2.stressAnomaly;
    if (var3Name) var3Name.textContent = "Agronomic Explanatory Ceiling";
    if (var3Val) var3Val.textContent = `${data.b2.ceilingPct} Error Explained`;
    if (var4Name) var4Name.textContent = "Dominant Crop Mix Shift";
    if (var4Val) var4Val.textContent = `Paddy ${data.b2.mixPaddyShift}`;

    if (rRecList) {
      rRecList.innerHTML = data.b2.recList.map(item => `<li>${item}</li>`).join('');
    }
  } else if (activePreset === 'box3') {
    if (rTitle) rTitle.textContent = "Collection & Credit Risk Rating";
    if (rSub) rSub.textContent = "Composite stress ranking & liquidity timing";
    if (rMetricLabel) rMetricLabel.textContent = "COMPOSITE STRESS RATING";
    if (rMetricNumber) rMetricNumber.textContent = data.b3.creditScore;
    if (rMetricBadge) {
      rMetricBadge.textContent = data.b3.creditBadge;
      rMetricBadge.className = `score-badge ${data.b3.badgeClass}`;
    }
    if (rNarrative) rNarrative.textContent = data.b3.narrative;
    if (rConfPct) rConfPct.textContent = data.b3.confidence;
    if (rConfFill) rConfFill.style.width = data.b3.confidence;

    if (var1Name) var1Name.textContent = "Relative Biomass Anomaly";
    if (var1Val) var1Val.textContent = data.b3.prodAnomaly;
    if (var2Name) var2Name.textContent = "Estimated Harvest Window";
    if (var2Val) var2Val.textContent = data.b3.harvestWindow;
    if (var3Name) var3Name.textContent = "Catchment HHI Concentration";
    if (var3Val) var3Val.textContent = data.b3.cropConcentration;
    if (var4Name) var4Name.textContent = "Mandi Price Trend (Agmarknet)";
    if (var4Val) var4Val.textContent = data.b3.mandiPrice;

    if (rRecList) {
      rRecList.innerHTML = data.b3.recList.map(item => `<li>${item}</li>`).join('');
    }
  }
}

/**
 * Updates map titles, badges, and legend when switching presets
 */
function updateMapLensUI() {
  const mapTitle = document.getElementById('map-lens-title');
  const mapSub = document.getElementById('map-lens-sub');
  const mapBadgeText = document.getElementById('map-active-badge-text');
  const mapLegendStrip = document.getElementById('matrix-legend-strip');

  if (activePreset === 'box1') {
    if (mapTitle) mapTitle.textContent = "Agri-Spatial Map & Sowing Front Lens";
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
  } else if (activePreset === 'box2') {
    if (mapTitle) mapTitle.textContent = "District Divergence & Deviation Lens";
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
  } else if (activePreset === 'box3') {
    if (mapTitle) mapTitle.textContent = "Composite Stress & Mandi Risk Lens";
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
  }

  // Re-render map layer styling
  renderMapLayers();
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

  // Initialize Map
  initDivergenceMap();

  // Initial population with default Cauvery Delta catchment
  populateCatchmentData('cauvery_delta');

  // Preset Box Buttons
  document.getElementById('btn-layer-box1')?.addEventListener('click', () => switchAgriPreset('box1'));
  document.getElementById('btn-layer-box2')?.addEventListener('click', () => switchAgriPreset('box2'));
  document.getElementById('btn-layer-box3')?.addEventListener('click', () => switchAgriPreset('box3'));

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
