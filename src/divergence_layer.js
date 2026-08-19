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

// Indian Agricultural Catchments Dataset across Kharif Paddy & Commodity Belts
const agroCatchmentData = {
  karnal: {
    key: 'karnal',
    name: "Karnal Depot (Haryana) — Basmati Belt",
    depotName: "Karnal Central Depot (Haryana)",
    center: [29.6857, 76.9907],
    zoom: 10,
    regionTag: "HARYANA BASMATI BELT",
    bounds: [[29.45, 76.75], [29.90, 77.25]],
    
    // Box 1: Distribution & Inventory Positioning
    b1: {
      catchmentAcreage: "68,400 ha",
      sowingP25: "Jun 14",
      sowingMedian: "Jun 26",
      sowingP75: "Jul 08",
      appWindow: "Jul 16 – Jul 26",
      tolerance: "±3 days",
      leadTime: "12 Days",
      leadPriority: "High Stocking Priority",
      stage: "Active Tillering Peak",
      stageColor: "#059669",
      soilMoisture: "32.4% (Adequate)",
      readinessScore: "92.4%",
      readinessBadge: "Optimal Stocking",
      badgeClass: "badge-success",
      narrative: "Sowing front progression indicates peak tillering window opening in 12 days. Catchment capacity warrants immediate SKU placement.",
      confidence: "96.8%",
      recList: [
        "Dispatch SKU batch #KRN-48 to Karnal Depot within 8 days.",
        "Prioritize early tillering micro-catchments in western sub-district.",
        "Review 7-day soil moisture forecast before final shipment dispatch."
      ]
    },

    // Box 2: Demand Sensing & Forecasting
    b2: {
      districtAcreage: "194,200 ha",
      baselineDelta: "-8.4% vs Baseline",
      baselineDeltaNum: -8.4,
      ciBand: "95% Confidence Band: [186,000 ha – 202,000 ha]",
      mixPaddy: "68%",
      mixPaddyShift: "-6% Shift",
      mixCotton: "22%",
      mixCottonShift: "+4% Shift",
      mixPulses: "10%",
      mixPulsesShift: "+2% Shift",
      ceilingPct: "34.2%",
      stressAnomaly: "-0.42σ (Moderate Anomaly)",
      divergenceScore: "-8.4%",
      divergenceBadge: "Deficit Variance",
      badgeClass: "badge-warning",
      narrative: "District acreage displays an 8.4% deficit below 5-year historical normal due to delayed monsoon onset in western blocks.",
      confidence: "94.2%",
      recList: [
        "Adjust regional channel supply forecast down by -8.4% to prevent inventory glut.",
        "Reallocate surplus buffer stock towards Guntur cluster (+12.4% expansion).",
        "Ingest distributor sell-through and credit terms to raise explanatory ceiling."
      ]
    },

    // Box 3: Collection & Credit Planning
    b3: {
      stressRank: "Rank 2 / 5",
      stressRankNum: 2,
      stressRankLabel: "Moderate-High Scrutiny",
      prodAnomaly: "-4.8% Relative Biomass Anomaly",
      harvestWindow: "Oct 08 – Oct 22",
      cropConcentration: "HHI 0.82 (High Monoculture Risk)",
      mandiPrice: "₹2,380 / quintal (+5.1% WoW)",
      creditScore: "Rank 2 / 5",
      creditBadge: "Elevated Scrutiny",
      badgeClass: "badge-warning",
      narrative: "High monoculture concentration and early moisture stress position Karnal catchment under Rank 2 credit scrutiny.",
      confidence: "93.5%",
      recList: [
        "Flag Rank 2 dealer catchments for tightened 30-day credit settlement terms.",
        "Align collection milestones with peak mandi arrivals beginning Oct 12.",
        "Track Agmarknet arrival price floor to verify farmer cash liquidity."
      ]
    }
  },

  ludhiana: {
    key: 'ludhiana',
    name: "Ludhiana Central Depot (Punjab) — Kharif Paddy",
    depotName: "Ludhiana Central Hub (Punjab)",
    center: [30.9010, 75.8573],
    zoom: 10,
    regionTag: "PUNJAB PADDY BELT",
    bounds: [[30.70, 75.60], [31.10, 76.10]],
    
    b1: {
      catchmentAcreage: "84,200 ha",
      sowingP25: "Jun 18",
      sowingMedian: "Jun 30",
      sowingP75: "Jul 12",
      appWindow: "Jul 20 – Jul 30",
      tolerance: "±4 days",
      leadTime: "16 Days",
      leadPriority: "Medium-High Priority",
      stage: "Early Tillering",
      stageColor: "#10B981",
      soilMoisture: "35.1% (High Irrigation)",
      readinessScore: "95.1%",
      readinessBadge: "Stage Aligned",
      badgeClass: "badge-success",
      narrative: "Canal irrigation resilience keeps Punjab sowing front aligned with planned dealer delivery windows.",
      confidence: "98.1%",
      recList: [
        "Initiate phased transit of herbicide and nutrient SKUs to Ludhiana railhead.",
        "Coordinate with primary cooperative dealers across Jagraon and Khanna.",
        "Track Sentinel-1 SAR flood coherence in low-lying riparian zones."
      ]
    },

    b2: {
      districtAcreage: "242,000 ha",
      baselineDelta: "-4.2% vs Baseline",
      baselineDeltaNum: -4.2,
      ciBand: "95% Confidence Band: [234,000 ha – 250,000 ha]",
      mixPaddy: "82%",
      mixPaddyShift: "-2% Shift",
      mixCotton: "12%",
      mixCottonShift: "+1% Shift",
      mixPulses: "6%",
      mixPulsesShift: "+1% Shift",
      ceilingPct: "37.8%",
      stressAnomaly: "-0.18σ (Near Baseline)",
      divergenceScore: "-4.2%",
      divergenceBadge: "Stable Baseline",
      badgeClass: "badge-success",
      narrative: "Paddy acreage holds steady against baseline with slight diversification towards maize in peripheral blocks.",
      confidence: "96.4%",
      recList: [
        "Maintain baseline distribution volume across Tier-1 distributor channels.",
        "Target specialized nutrient packs to emerging maize clusters (+1%).",
        "Monitor tubewell electricity load hours as auxiliary vigor signal."
      ]
    },

    b3: {
      stressRank: "Rank 4 / 5",
      stressRankNum: 4,
      stressRankLabel: "Strong Liquidity",
      prodAnomaly: "+1.2% Normal Biomass",
      harvestWindow: "Oct 14 – Oct 28",
      cropConcentration: "HHI 0.88 (Heavy Paddy Specialization)",
      mandiPrice: "₹2,420 / quintal (+3.8% WoW)",
      creditScore: "Rank 4 / 5",
      creditBadge: "Low Risk",
      badgeClass: "badge-success",
      narrative: "Assured procurement infrastructure and stable biomass indices support robust credit repayment confidence.",
      confidence: "95.8%",
      recList: [
        "Offer standard 60-day commercial terms to accredited Ludhiana dealer tier.",
        "Set post-harvest collection reconciliation starting Oct 24.",
        "Track MSP mandi arrival volumes across Ludhiana grain markets."
      ]
    }
  },

  guntur: {
    key: 'guntur',
    name: "Guntur Agro-Cluster (Andhra Pradesh) — Heading",
    depotName: "Guntur Agro-Hub (Andhra Pradesh)",
    center: [16.3067, 80.4365],
    zoom: 10,
    regionTag: "COASTAL ANDHRA DELTA",
    bounds: [[16.10, 80.20], [16.50, 80.65]],
    
    b1: {
      catchmentAcreage: "52,600 ha",
      sowingP25: "Jun 02",
      sowingMedian: "Jun 14",
      sowingP75: "Jun 28",
      appWindow: "Jul 04 – Jul 14",
      tolerance: "±3 days",
      leadTime: "Active / Stocked",
      leadPriority: "Window Active",
      stage: "Heading / Panicle Initiation",
      stageColor: "#0284C7",
      soilMoisture: "38.6% (Moist/Surplus)",
      readinessScore: "97.6%",
      readinessBadge: "Stocked / Complete",
      badgeClass: "badge-success",
      narrative: "Early coastal monsoon sowing has progressed into heading stage. Secondary fungicide application window is active.",
      confidence: "97.4%",
      recList: [
        "Complete secondary placement of panicle-stage bio-stimulants.",
        "Reallocate unused vegetative stock to northern delayed sowing zones.",
        "Monitor IMD coastal low-pressure radar for localized inundation."
      ]
    },

    b2: {
      districtAcreage: "162,000 ha",
      baselineDelta: "+12.4% vs Baseline",
      baselineDeltaNum: 12.4,
      ciBand: "95% Confidence Band: [154,000 ha – 170,000 ha]",
      mixPaddy: "58%",
      mixPaddyShift: "+6% Shift",
      mixCotton: "32%",
      mixCottonShift: "-4% Shift",
      mixPulses: "10%",
      mixPulsesShift: "-2% Shift",
      ceilingPct: "39.4%",
      stressAnomaly: "+0.64σ (High Vigor Surge)",
      divergenceScore: "+12.4%",
      divergenceBadge: "Acreage Expansion",
      badgeClass: "badge-success",
      narrative: "Significant acreage expansion (+12.4% over 5-year baseline) driven by abundant reservoir storage in Krishna delta.",
      confidence: "97.1%",
      recList: [
        "Increase regional demand allocation by +12.4% across coastal retail touchpoints.",
        "Deploy additional field agronomy advisory for crop protection during heading.",
        "Partner with major fertilizer cooperatives to capture expanded market share."
      ]
    },

    b3: {
      stressRank: "Rank 5 / 5",
      stressRankNum: 5,
      stressRankLabel: "Optimal Liquidity",
      prodAnomaly: "+6.8% Biomass Surge",
      harvestWindow: "Sep 28 – Oct 12",
      cropConcentration: "HHI 0.62 (Diversified Chili/Paddy)",
      mandiPrice: "₹2,510 / quintal (+6.2% DoD)",
      creditScore: "Rank 5 / 5",
      creditBadge: "Optimal Solvency",
      badgeClass: "badge-success",
      narrative: "Surge in vegetative biomass and early harvest calendar provide highest liquidity and earliest collection cycle in India.",
      confidence: "98.2%",
      recList: [
        "Authorize flexible credit limits for top-performing dealer catchments.",
        "Schedule first-tier collection repayments starting Oct 02.",
        "Integrate Agmarknet Guntur chili & paddy daily mandi price indices."
      ]
    }
  },

  muzaffarpur: {
    key: 'muzaffarpur',
    name: "Muzaffarpur District (Bihar) — Deficit Anomaly",
    depotName: "Muzaffarpur Regional Depot (Bihar)",
    center: [26.1209, 85.3647],
    zoom: 10,
    regionTag: "EASTERN GANGETIC PLAIN",
    bounds: [[25.95, 85.15], [26.30, 85.55]],
    
    b1: {
      catchmentAcreage: "41,200 ha",
      sowingP25: "May 28",
      sowingMedian: "Jun 10",
      sowingP75: "Jun 24",
      appWindow: "Jun 28 – Jul 08",
      tolerance: "±4 days",
      leadTime: "2 Days Remaining",
      leadPriority: "Urgent Placement",
      stage: "Vegetative Emergence",
      stageColor: "#10B981",
      soilMoisture: "22.8% (Deficit Moisture)",
      readinessScore: "81.2%",
      readinessBadge: "Urgent Recheck",
      badgeClass: "badge-warning",
      narrative: "Rainfall deficit in North Bihar has slowed paddy transplantation. Target application windows condensed into 2 days.",
      confidence: "91.8%",
      recList: [
        "Expedite drought-stress foliar spray shipments to Muzaffarpur hub.",
        "Alert field teams to delayed seedling nursery mortality risk.",
        "Cross-reference IMD gridded deficit rainfall before extending distributor credit."
      ]
    },

    b2: {
      districtAcreage: "118,000 ha",
      baselineDelta: "-16.8% vs Baseline",
      baselineDeltaNum: -16.8,
      ciBand: "95% Confidence Band: [110,000 ha – 126,000 ha]",
      mixPaddy: "48%",
      mixPaddyShift: "-12% Shift",
      mixCotton: "38%",
      mixCottonShift: "+8% Shift (Maize)",
      mixPulses: "14%",
      mixPulsesShift: "+4% Shift",
      ceilingPct: "31.6%",
      stressAnomaly: "-0.86σ (Severe Deficit Anomaly)",
      divergenceScore: "-16.8%",
      divergenceBadge: "Critical Deficit",
      badgeClass: "badge-danger",
      narrative: "Major crop mix shift: Farmers switched 12% of intended paddy acreage to maize/pulses due to prolonged dry spells.",
      confidence: "93.4%",
      recList: [
        "Cut paddy pesticide shipment quotas by -16.8% to avert major unsold returns.",
        "Ramp up maize and pulse seed treatments and drought alleviation products.",
        "Ingest local distributor credit terms to establish commercial recovery plan."
      ]
    },

    b3: {
      stressRank: "Rank 1 / 5",
      stressRankNum: 1,
      stressRankLabel: "Critical Stress Risk",
      prodAnomaly: "-14.2% Severe Deficit",
      harvestWindow: "Oct 20 – Nov 04",
      cropConcentration: "HHI 0.54 (Fragmented Mixed Basin)",
      mandiPrice: "₹2,180 / quintal (-2.4% DoD)",
      creditScore: "Rank 1 / 5",
      creditBadge: "High Credit Risk",
      badgeClass: "badge-danger",
      narrative: "Severe biomass deficit and depressed mandi arrivals elevate collection default risk across North Bihar dealers.",
      confidence: "92.0%",
      recList: [
        "Place Muzaffarpur and Darbhanga dealer network on Rank 1 strict credit hold.",
        "Implement collateralized or advance-payment terms for secondary orders.",
        "Track delayed crop harvest window (Nov 04) for debt restructuring."
      ]
    }
  },

  surat_hazira: {
    key: 'surat_hazira',
    name: "Surat / Hazira Basin (Gujarat) — Mixed Crop",
    depotName: "Surat Central Depot (Gujarat)",
    center: [21.1702, 72.8311],
    zoom: 10,
    regionTag: "GUJARAT AGRO-INDUSTRIAL",
    bounds: [[21.00, 72.65], [21.35, 73.00]],
    
    b1: {
      catchmentAcreage: "38,900 ha",
      sowingP25: "Jun 20",
      sowingMedian: "Jul 02",
      sowingP75: "Jul 16",
      appWindow: "Jul 22 – Aug 02",
      tolerance: "±5 days",
      leadTime: "18 Days",
      leadPriority: "Normal Staging",
      stage: "Early Vegetative",
      stageColor: "#10B981",
      soilMoisture: "31.2% (Adequate)",
      readinessScore: "90.6%",
      readinessBadge: "Staging Active",
      badgeClass: "badge-success",
      narrative: "Sowing across South Gujarat is pacing normally. Canal deliveries from Tapi basin ensure steady vegetative growth.",
      confidence: "95.6%",
      recList: [
        "Stage dual-purpose cotton & paddy crop protection inventory at Surat hub.",
        "Verify dealer warehouse capacity ahead of early August peak demand.",
        "Cross-check soil salinity metrics in coastal Hazira buffer parcels."
      ]
    },

    b2: {
      districtAcreage: "146,000 ha",
      baselineDelta: "-7.1% vs Baseline",
      baselineDeltaNum: -7.1,
      ciBand: "95% Confidence Band: [138,000 ha – 154,000 ha]",
      mixPaddy: "36%",
      mixPaddyShift: "-4% Shift",
      mixCotton: "52%",
      mixCottonShift: "+3% Shift",
      mixPulses: "12%",
      mixPulsesShift: "+1% Shift",
      ceilingPct: "35.1%",
      stressAnomaly: "-0.32σ (Slight Anomaly)",
      divergenceScore: "-7.1%",
      divergenceBadge: "Moderate Deficit",
      badgeClass: "badge-warning",
      narrative: "Modest acreage shift towards cotton and sugarcane reflects market price incentives in western Gujarat.",
      confidence: "94.8%",
      recList: [
        "Rebalance portfolio allocation: Reduce paddy SKUs by -4%, expand cotton bollworm packs by +3%.",
        "Coordinate with Surat sugar cooperative mills for bulk deliveries.",
        "Ingest client promotional calendar to refine local demand forecast."
      ]
    },

    b3: {
      stressRank: "Rank 3 / 5",
      stressRankNum: 3,
      stressRankLabel: "Neutral / Moderate",
      prodAnomaly: "-2.9% Near Baseline",
      harvestWindow: "Oct 10 – Oct 24",
      cropConcentration: "HHI 0.68 (Cotton Dominant)",
      mandiPrice: "₹2,360 / quintal (+2.9% WoW)",
      creditScore: "Rank 3 / 5",
      creditBadge: "Neutral Risk",
      badgeClass: "badge-warning",
      narrative: "Diversified industrial economy and mixed cropping balance credit exposure within normal tolerance limits.",
      confidence: "94.2%",
      recList: [
        "Maintain standard 45-day dealer settlement cycles across Gujarat network.",
        "Monitor cotton arrival price trends on Surat and Bharuch APMC mandis.",
        "Schedule credit audit post-Diwali harvest sales peak."
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

  // Show default Karnal catchment
  updateMapFocus('karnal');

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
  const data = agroCatchmentData[key] || agroCatchmentData.karnal;

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
  const selectedKey = facilitySelect?.value || 'karnal';
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

  // Initial population with default Karnal catchment
  populateCatchmentData('karnal');

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
