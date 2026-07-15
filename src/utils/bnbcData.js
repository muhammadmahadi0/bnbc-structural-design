/**
 * 🏗️ BNBC 2020 — Building Structural Design Database
 * --------------------------------------------------------------------------
 * Reference: Bangladesh National Building Code 2020
 * Contains all material properties, load data, seismic/wind parameters,
 * rebar schedules, and design coefficients per BNBC 2020 / ACI 318-19.
 */

// ──────────────────────────────────────────────
// 1.  CONCRETE GRADES (BNBC 2020 Table 6.2.1)
// ──────────────────────────────────────────────
export const CONCRETE_GRADES = [
  { label: 'C-16 / 3000 psi', fc: 16 },
  { label: 'C-20 / 3000 psi', fc: 20.7 },
  { label: 'C-24 / 3500 psi', fc: 24.1 },
  { label: 'C-28 / 4000 psi', fc: 27.6 },
  { label: 'C-32 / 4500 psi', fc: 31.6 },
  { label: 'C-35 / 5000 psi', fc: 34.5 },
  { label: 'C-40 / 5500 psi', fc: 41.4 },
];

// ──────────────────────────────────────────────
// 2.  STEEL GRADES (BNBC 2020 Table 6.2.2)
// ──────────────────────────────────────────────
export const STEEL_GRADES = [
  { label: 'GR-300 (300 MPa)', fy: 300 },
  { label: 'GR-400 (400 MPa)', fy: 400 },
  { label: 'GR-420 (420 MPa) — 60ksi', fy: 420 },
  { label: 'GR-500 (500 MPa)', fy: 500 },
  { label: 'GR-550 (550 MPa)', fy: 550 },
];

// ──────────────────────────────────────────────
// 3.  STEEL MODULUS & UNIT WEIGHTS
// ──────────────────────────────────────────────
export const STEEL_MODULUS = 200000; // MPa
export const UNIT_WEIGHT_CONCRETE = 24; // kN/m³ (normal weight)
export const UNIT_WEIGHT_STEEL = 78.5; // kN/m³
export const UNIT_WEIGHT_BRICK = 19.0; // kN/m³
export const UNIT_WEIGHT_SAND = 16.0; // kN/m³
export const UNIT_WEIGHT_WATER = 9.81; // kN/m³

// ──────────────────────────────────────────────
// 4.  CLEAR COVER (BNBC 2020 Table 6.2.6)
// ──────────────────────────────────────────────
export const COVER_OPTIONS = [
  { label: 'Slab — 20 mm (interior, mild exp)', value: 20 },
  { label: 'Slab — 25 mm (exterior mild exp)', value: 25 },
  { label: 'Beam — 30 mm (interior)', value: 30 },
  { label: 'Beam — 35 mm (exterior mild)', value: 35 },
  { label: 'Column — 40 mm (interior)', value: 40 },
  { label: 'Column — 50 mm (exterior severe)', value: 50 },
  { label: 'Foundation — 50 mm (against earth)', value: 50 },
  { label: 'Foundation — 75 mm (concrete on earth)', value: 75 },
];

// ──────────────────────────────────────────────
// 5.  OCCUPANCY — LIVE LOADS (BNBC 2020 Table 6.2.10)
// ──────────────────────────────────────────────
export const OCCUPANCY_LOADS = [
  { occupancy: 'Residential — General', ll: 2.0, sdl: 1.0 },
  { occupancy: 'Residential — Balcony', ll: 3.0, sdl: 1.0 },
  { occupancy: 'Residential — Stairs', ll: 5.0, sdl: 1.0 },
  { occupancy: 'Office — General', ll: 2.5, sdl: 1.0 },
  { occupancy: 'Office — Corridors & Lobbies', ll: 4.0, sdl: 1.0 },
  { occupancy: 'Commercial — Retail', ll: 4.0, sdl: 1.2 },
  { occupancy: 'Commercial — Warehouse (light)', ll: 6.0, sdl: 1.5 },
  { occupancy: 'Commercial — Warehouse (heavy)', ll: 12.0, sdl: 2.0 },
  { occupancy: 'Educational — Classrooms', ll: 2.0, sdl: 1.0 },
  { occupancy: 'Educational — Corridors', ll: 4.0, sdl: 1.0 },
  { occupancy: 'Hospital — Wards', ll: 2.0, sdl: 1.0 },
  { occupancy: 'Hospital — Operating Rooms', ll: 3.0, sdl: 1.0 },
  { occupancy: 'Hotel — Guest Rooms', ll: 2.0, sdl: 1.0 },
  { occupancy: 'Hotel — Corridors', ll: 4.0, sdl: 1.0 },
  { occupancy: 'Assembly — Fixed Seats', ll: 3.0, sdl: 1.0 },
  { occupancy: 'Assembly — Movable Seats', ll: 5.0, sdl: 1.2 },
  { occupancy: 'Parking — Car (light)', ll: 2.5, sdl: 1.0 },
  { occupancy: 'Parking — Car (heavy)', ll: 5.0, sdl: 1.5 },
  { occupancy: 'Roof — Flat (accessible)', ll: 1.5, sdl: 0.5 },
  { occupancy: 'Roof — Flat (non-accessible)', ll: 0.75, sdl: 0.5 },
  { occupancy: 'Industrial — Light', ll: 5.0, sdl: 1.5 },
  { occupancy: 'Industrial — Heavy', ll: 10.0, sdl: 2.0 },
  { occupancy: 'Stadium — Bleachers', ll: 5.0, sdl: 1.0 },
];

// ──────────────────────────────────────────────
// 6.  FINISH & PARTITION LOADS
// ──────────────────────────────────────────────
export const FINISH_LOADS = [
  { label: 'Tile flooring (20 mm)', load: 0.5 },
  { label: 'Tile flooring (40 mm)', load: 0.8 },
  { label: 'Marble flooring (20 mm)', load: 0.6 },
  { label: 'Marble flooring (40 mm)', load: 1.0 },
  { label: 'Cement screed (20 mm)', load: 0.4 },
  { label: 'Cement screed (40 mm)', load: 0.8 },
  { label: 'Terrazzo (25 mm)', load: 0.7 },
  { label: 'Wood flooring (25 mm)', load: 0.15 },
  { label: 'Vinyl flooring', load: 0.1 },
  { label: 'Waterproofing membrane', load: 0.15 },
  { label: 'Brick tile on roof', load: 1.5 },
  { label: 'Mud/earth filling (100 mm)', load: 1.6 },
  { label: 'Mud/earth filling (150 mm)', load: 2.4 },
  { label: 'Custom', load: 'custom' },
];

export const PARTITION_LOADS = [
  { label: '4" brick wall (100 mm)', load: 2.0 },  // kN/m² per m height
  { label: '5" brick wall (125 mm)', load: 2.5 },
  { label: '10" brick wall (250 mm)', load: 4.5 },
  { label: 'Concrete block wall (100 mm)', load: 1.5 },
  { label: 'Concrete block wall (150 mm)', load: 2.2 },
  { label: 'Glass partition (framed)', load: 0.5 },
  { label: 'Timber stud partition', load: 0.4 },
  { label: 'Custom', load: 'custom' },
];

// ──────────────────────────────────────────────
// 7.  WIND LOAD PARAMETERS (BNBC 2020 Sec 2.4)
// ──────────────────────────────────────────────
export const WIND_SPEED_ZONES = [
  { label: 'Zone 1 — ≤ 160 km/h (Most of Bangladesh)', value: 160 },
  { label: 'Zone 2 — ≤ 180 km/h (Coastal belt, ≤ 50 km)', value: 180 },
  { label: 'Zone 3 — ≤ 210 km/h (Cox\'s Bazar, St. Martin)', value: 210 },
];

export const EXPOSURE_CATEGORIES = [
  { label: 'A — Large city centers; ≥ 50% of buildings > 20 m', value: 'A' },
  { label: 'B — Urban/suburban; wooded areas', value: 'B' },
  { label: 'C — Open terrain; grassland, water', value: 'C' },
  { label: 'D — Flat, unobstructed coastal areas', value: 'D' },
];

export const TOPOGRAPHY_FACTORS = [
  { label: 'Flat / level terrain (Kzt = 1.0)', kzt: 1.0 },
  { label: 'Hillside / escarpment (Kzt = 1.2)', kzt: 1.2 },
  { label: 'Steep ridge / cliff (Kzt = 1.4)', kzt: 1.4 },
];

// Velocity pressure exposure coefficients Kz (per BNBC Table)
export const KZ_TABLE = {
  A: [
    { h: 4.6, kz: 0.70 },
    { h: 6.1, kz: 0.70 },
    { h: 7.6, kz: 0.72 },
    { h: 9.1, kz: 0.76 },
    { h: 12.2, kz: 0.84 },
    { h: 15.2, kz: 0.90 },
    { h: 18.3, kz: 0.95 },
    { h: 21.3, kz: 0.99 },
    { h: 24.4, kz: 1.03 },
    { h: 27.4, kz: 1.06 },
    { h: 30.5, kz: 1.09 },
  ],
  B: [
    { h: 4.6, kz: 0.85 },
    { h: 6.1, kz: 0.85 },
    { h: 7.6, kz: 0.88 },
    { h: 9.1, kz: 0.91 },
    { h: 12.2, kz: 0.97 },
    { h: 15.2, kz: 1.02 },
    { h: 18.3, kz: 1.06 },
    { h: 21.3, kz: 1.09 },
    { h: 24.4, kz: 1.12 },
    { h: 27.4, kz: 1.15 },
    { h: 30.5, kz: 1.17 },
  ],
  C: [
    { h: 4.6, kz: 1.00 },
    { h: 6.1, kz: 1.00 },
    { h: 7.6, kz: 1.03 },
    { h: 9.1, kz: 1.06 },
    { h: 12.2, kz: 1.11 },
    { h: 15.2, kz: 1.15 },
    { h: 18.3, kz: 1.19 },
    { h: 21.3, kz: 1.22 },
    { h: 24.4, kz: 1.25 },
    { h: 27.4, kz: 1.28 },
    { h: 30.5, kz: 1.30 },
  ],
  D: [
    { h: 4.6, kz: 1.10 },
    { h: 6.1, kz: 1.10 },
    { h: 7.6, kz: 1.14 },
    { h: 9.1, kz: 1.17 },
    { h: 12.2, kz: 1.22 },
    { h: 15.2, kz: 1.27 },
    { h: 18.3, kz: 1.31 },
    { h: 21.3, kz: 1.34 },
    { h: 24.4, kz: 1.37 },
    { h: 27.4, kz: 1.40 },
    { h: 30.5, kz: 1.43 },
  ],
};

// Directionality factor Kd
export const KD_FACTOR = {
  'Buildings — MWFRS': 0.85,
  'Buildings — C&C': 0.85,
  'Roof projections': 0.90,
};

// Gust effect factor G (simplified, rigid structures)
export const GUST_FACTOR = 0.85;

// Internal pressure coefficient GCpi
export const GCPI = {
  'Enclosed building': 0.18,
  'Partially enclosed': 0.55,
};

// Pressure coefficients Cp (Windward / Leeward / Side walls)
// BNBC Table 6.2.16 — simplified
export const CP_WALLS = {
  windward: 0.80,
  leeward: -0.50,
  side: -0.70,
};

export const CP_ROOF = {
  flat_windward: -0.70,
  flat_leeward: -0.70,
};

// ──────────────────────────────────────────────
// 8.  SEISMIC PARAMETERS (BNBC 2020 Sec 2.5/6.2)
// ──────────────────────────────────────────────
export const SEISMIC_REGIONS = [
  { label: 'Dhaka / Narayanganj / Gazipur', ss: 0.36, s1: 0.13 },
  { label: 'Comilla / Chandpur / Brahmanbaria', ss: 0.36, s1: 0.13 },
  { label: 'Chittagong / Cox\'s Bazar', ss: 0.50, s1: 0.18 },
  { label: 'Sylhet / Moulvibazar / Hobiganj', ss: 0.64, s1: 0.22 },
  { label: 'Rajshahi / Pabna / Natore', ss: 0.28, s1: 0.10 },
  { label: 'Khulna / Bagerhat / Satkhira', ss: 0.28, s1: 0.10 },
  { label: 'Barisal / Patuakhali / Bhola', ss: 0.28, s1: 0.10 },
  { label: 'Rangpur / Dinajpur / Bogra', ss: 0.36, s1: 0.13 },
  { label: 'Mymensingh / Jamalpur / Sherpur', ss: 0.36, s1: 0.13 },
  { label: 'Tangail / Manikganj', ss: 0.36, s1: 0.13 },
];

export const SITE_CLASSES = [
  { label: 'SA — Hard Rock', value: 'SA', fa: 0.8, fv: 0.8 },
  { label: 'SB — Rock', value: 'SB', fa: 1.0, fv: 1.0 },
  { label: 'SC — Very Dense Soil / Soft Rock', value: 'SC', fa: null, fv: null },
  { label: 'SD — Stiff Soil', value: 'SD', fa: null, fv: null },
  { label: 'SE — Soft Soil', value: 'SE', fa: null, fv: null },
];

// Fa per BNBC 2020 Table 6.2.31 (simplified interpolation)
export function getFa(siteClass, ss) {
  const table = {
    SA: { low: 0.8, high: 0.8 },
    SB: { low: 1.0, high: 1.0 },
    SC: { low: 1.2, high: 1.0 },
    SD: { low: 1.6, high: 1.2 },
    SE: { low: 2.5, high: 1.6 },
  };
  const row = table[siteClass];
  if (!row) return 1.0;
  if (ss <= 0.25) return row.low;
  if (ss >= 0.50) return row.high;
  const t = (ss - 0.25) / 0.25;
  return row.low + t * (row.high - row.low);
}

// Fv per BNBC 2020 Table 6.2.32
export function getFv(siteClass, s1) {
  const table = {
    SA: { low: 0.8, high: 0.8 },
    SB: { low: 1.0, high: 1.0 },
    SC: { low: 1.7, high: 1.5 },
    SD: { low: 2.4, high: 1.8 },
    SE: { low: 3.5, high: 2.4 },
  };
  const row = table[siteClass];
  if (!row) return 1.0;
  if (s1 <= 0.1) return row.low;
  if (s1 >= 0.2) return row.high;
  const t = (s1 - 0.1) / 0.1;
  return row.low + t * (row.high - row.low);
}

export const IMPORTANCE_FACTORS = [
  { label: 'I = 1.00 — Standard occupancy (residential, office)', ie: 1.0 },
  { label: 'I = 1.25 — Important (schools, hospitals, govt)', ie: 1.25 },
  { label: 'I = 1.50 — Essential / Post-disaster', ie: 1.5 },
];

export const RESPONSE_MOD_FACTORS = [
  { label: 'R = 3 — Ordinary RC Moment Frame (OMF)', r: 3 },
  { label: 'R = 5 — Intermediate RC Moment Frame (IMF)', r: 5 },
  { label: 'R = 8 — Special RC Moment Frame (SMRF)', r: 8 },
  { label: 'R = 3 — Ordinary Shear Wall', r: 3 },
  { label: 'R = 6 — Intermediate Shear Wall', r: 6 },
  { label: 'R = 7 — Special Shear Wall', r: 7 },
  { label: 'R = 2 — Bearing Wall System', r: 2 },
];

// ──────────────────────────────────────────────
// 9.  STANDARD REBAR SCHEDULE (BNBC / ASTM A615)
// ──────────────────────────────────────────────
export const REBAR_SIZES = [
  { bar: '#10M', dia: 10, area: 78.5, mass: 0.617 },
  { bar: '#12M', dia: 12, area: 113.1, mass: 0.888 },
  { bar: '#14M', dia: 14, area: 154.0, mass: 1.208 },
  { bar: '#16M', dia: 16, area: 201.1, mass: 1.578 },
  { bar: '#18M', dia: 18, area: 254.5, mass: 1.998 },
  { bar: '#20M', dia: 20, area: 314.2, mass: 2.466 },
  { bar: '#22M', dia: 22, area: 380.1, mass: 2.984 },
  { bar: '#25M', dia: 25, area: 490.9, mass: 3.853 },
  { bar: '#28M', dia: 28, area: 615.8, mass: 4.834 },
  { bar: '#32M', dia: 32, area: 804.2, mass: 6.313 },
  { bar: '#36M', dia: 36, area: 1017.9, mass: 7.990 },
  { bar: '#40M', dia: 40, area: 1256.6, mass: 9.864 },
];

// ──────────────────────────────────────────────
// 10. SLAB MINIMUM THICKNESS (ACI 318-19 T 7.3.1.1)
//     h_min = l_n × factor  (fy = 420 MPa)
// ──────────────────────────────────────────────
export const SLAB_THICKNESS_FACTORS = {
  'Simply supported — one-way': 20,
  'One end continuous — one-way': 24,
  'Both ends continuous — one-way': 28,
  'Cantilever — one-way': 10,
  'Flat plate / flat slab': 30,
  'Two-way — simply supported': 28,
  'Two-way — continuous': 32,
};

// ──────────────────────────────────────────────
// 11. SLAB MOMENT COEFFICIENTS (ACI / BNBC)
//     For uniformly loaded one-way slab
// ──────────────────────────────────────────────
export const MOMENT_COEFFICIENTS = {
  'Simply supported': { positive_mid: 1 / 8, negative_support: 0 },
  'One end continuous': { positive_mid: 1 / 10, negative_support: -1 / 8 },
  'Both ends continuous': { positive_mid: 1 / 14, negative_support: -1 / 10 },
  'Cantilever': { positive_mid: 0, negative_support: -1 / 2 },
};

// ──────────────────────────────────────────────
// 12. MINIMUM SLAB THICKNESS (deflection control)
// ──────────────────────────────────────────────
export function getMinSlabThickness(supportType, span, fy) {
  const factor = SLAB_THICKNESS_FACTORS[supportType];
  if (!factor) return null;
  let h = span / factor;
  // Modification for fy ≠ 420 MPa (ACI 7.3.1.1)
  h *= 0.4 + fy / 700;
  // Round up to nearest 5 mm
  return Math.ceil(h / 5) * 5;
}

// ──────────────────────────────────────────────
// 13. MODULUS OF RUPTURE
// ──────────────────────────────────────────────
export function getModulusOfRupture(fc) {
  return 0.62 * Math.sqrt(fc); // MPa, ACI 19.2.3.1
}

// ──────────────────────────────────────────────
// 14. FLEXURAL CRACK CONTROL — max spacing
// ──────────────────────────────────────────────
export function getMaxBarSpacing(cc, fy) {
  // ACI 318-19 Table 24.3.2 — maximum spacing for crack control
  return Math.min(3 * 25.4, 380 * (280 / fy) - 2.5 * cc);
}

// ──────────────────────────────────────────────
// 15. TEMPERATURE & SHRINKAGE REINFORCEMENT (ACI 24.4)
// ──────────────────────────────────────────────
export function getTempShrinkageAs(fy, h_mm, b_mm = 1000) {
  const grossArea = h_mm * b_mm; // per meter width
  let ratio = 0.0018; // for fy = 420 MPa
  if (fy >= 420) ratio = 0.0018 * 420 / fy;
  if (ratio < 0.0014) ratio = 0.0014;
  return ratio * grossArea; // mm²/m
}
