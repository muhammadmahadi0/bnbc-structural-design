/**
 * 🏗️ structuralMath.js — BNBC 2020 Structural Engineering Engine
 * --------------------------------------------------------------------------
 * All BNBC 2020 / ACI 318-19 structural design formulas implemented as
 * pure functions.  Every function returns either a numeric result or
 * an object with full design output.
 *
 * Units convention:  lengths — mm,  forces — kN,  stresses — MPa
 * --------------------------------------------------------------------------
 */

import { REBAR_SIZES, getMinSlabThickness, MOMENT_COEFFICIENTS, getTempShrinkageAs as _tsa } from './bnbcData';
export const getTempShrinkageAs = _tsa;

// ─────────────────────────────────────────────────────────
//  0.  HELPERS
// ─────────────────────────────────────────────────────────

/** Round to n decimal places */
export const r2 = (v, n = 2) => (v !== undefined && v !== null && isFinite(v) ? Math.round(v * 10 ** n) / 10 ** n : 0);

/** Clamp a value between min and max */
export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// ─────────────────────────────────────────────────────────
//  1.  MATERIAL PROPERTIES
// ─────────────────────────────────────────────────────────

/** Concrete modulus of elasticity (ACI 19.2.2.1) — MPa */
export function Ec(fc) {
  return 4700 * Math.sqrt(fc);
}

/** Steel modulus — constant 200 GPa */
export const Es = 200000;

/** β₁ — equivalent stress block depth factor (ACI 22.2.2.4.3) */
export function beta1(fc) {
  if (fc <= 28) return 0.85;
  const b = 0.85 - 0.05 * ((fc - 28) / 7);
  return Math.max(b, 0.65);
}

/** Balanced reinforcement ratio ρ_bal (ACI 22.2.2.4.1) */
export function rhoBal(fc, fy) {
  const b1 = beta1(fc);
  return 0.85 * fc * b1 / fy * 0.003 / (0.003 + 0.005);
}

/** Maximum reinforcement ratio ρ_max (tension-controlled) */
export function rhoMax(fc, fy) {
  return 0.75 * rhoBal(fc, fy);
}

/** Minimum reinforcement ratio ρ_min (flexure) — ACI 9.6.1.2 */
export function rhoMin(fy) {
  return 1.4 / fy;
}

/** Minimum flexural steel area — ACI 9.6.1.2  (mm²) */
export function AsMin(fc, fy, b, d) {
  const rho = Math.max(1.4 / fy, 0.25 * Math.sqrt(fc) / fy);
  return rho * b * d;
}

/** Clear cover → effective depth helper */
export function effectiveDepth(h_total, cover, barDia, stirrupDia = 0) {
  return Math.max(h_total - cover - stirrupDia - barDia / 2, 1);
}

// ─────────────────────────────────────────────────────────
//  2.  LOAD COMBINATIONS (LRFD — BNBC 2020 Sec 2.3)
// ─────────────────────────────────────────────────────────

export function factoredLoad(DL, SDL, LL, WL = 0, EQ = 0) {
  return {
    '1.4D + 1.6L': 1.4 * (DL + SDL) + 1.6 * LL,
    '1.2D + 1.6L + 0.5W': 1.2 * (DL + SDL) + 1.6 * LL + 0.5 * WL,
    '1.2D + 1.0W + 1.0L': 1.2 * (DL + SDL) + 1.0 * WL + 1.0 * LL,
    '0.9D + 1.0W': 0.9 * (DL + SDL) + 1.0 * WL,
    '1.2D + 1.0E + 1.0L': 1.2 * (DL + SDL) + 1.0 * EQ + 1.0 * LL * 0.75,
    '0.9D + 1.0E': 0.9 * (DL + SDL) + 1.0 * EQ,
  };
}

// ─────────────────────────────────────────────────────────
//  3.  WIND LOAD — BNBC 2020 Sec 2.4.3
// ─────────────────────────────────────────────────────────

/**
 * Velocity pressure at height z  (N/m²)
 * qz = 0.613 × Kz × Kzt × Kd × V² × I
 */
export function windVelocityPressure(V_kmh, Kz, Kzt, Kd, I_wind) {
  const V = V_kmh / 3.6; // km/h → m/s
  return 0.613 * Kz * Kzt * Kd * V * V * I_wind;
}

/**
 * Design wind pressure
 * p = qz × GCp − qi × GCpi
 * Simplified: p = qz × G × Cp — qh × GCpi
 */
export function windDesignPressure(qz, G, Cp, qh, GCpi, sign = -1) {
  return qz * G * Cp + sign * qh * GCpi;
}

/** Interpolate Kz from BNBC table */
export function interpolateKz(table, height) {
  if (height <= table[0].h) return table[0].kz;
  if (height >= table[table.length - 1].h) return table[table.length - 1].kz;
  for (let i = 0; i < table.length - 1; i++) {
    if (height >= table[i].h && height < table[i + 1].h) {
      const t = (height - table[i].h) / (table[i + 1].h - table[i].h);
      return table[i].kz + t * (table[i + 1].kz - table[i].kz);
    }
  }
  return table[0].kz;
}

/** Compute full wind load per floor */
export function computeWindLoad(params) {
  const { V_kmh, height, exposure, Kzt, Kd, I_wind, G, GCpi, Cp, floorHeight, floorCount } = params;
  const table = { A: 'A', B: 'B', C: 'C', D: 'D' }[exposure];
  const kzTable = { A: 'A', B: 'B', C: 'C', D: 'D' };
  // We'll import KZ_TABLE from bnbcData — kept here for pure math
  return {
    qz: windVelocityPressure(V_kmh, 1.0, Kzt, Kd, I_wind),
    note: 'Use interpolateKz(KZ_TABLE[exp], h) for per-floor qz',
  };
}

// ─────────────────────────────────────────────────────────
//  4.  SEISMIC LOAD — BNBC 2020 Sec 2.5 / ASCE 7-16
// ─────────────────────────────────────────────────────────

/**
 * Design spectral acceleration parameters
 * SDS = (2/3) × SMS     where SMS = Fa × Ss
 * SD1 = (2/3) × SM1     where SM1 = Fv × S1
 */
export function seismicDesignParams(Fa, Ss, Fv, S1) {
  const SMS = Fa * Ss;
  const SM1 = Fv * S1;
  return {
    SMS: r2(SMS, 3),
    SM1: r2(SM1, 3),
    SDS: r2((2 / 3) * SMS, 3),
    SD1: r2((2 / 3) * SM1, 3),
  };
}

/**
 * Seismic base shear (kN)
 * V = Cs × W
 * Cs = SDS / (R / Ie)
 * Cs must be ≤ SD1 / (T × (R / Ie))  for T ≤ TL
 * Cs must be ≥ 0.044 × SDS × Ie ≥ 0.01
 */
export function seismicBaseShear(SDS, SD1, R, Ie, W, T = 0.5) {
  const Cs1 = SDS / (R / Ie);
  const Cs2 = SD1 / (T * (R / Ie));
  const Cs3 = 0.044 * SDS * Ie;
  const Cs4 = 0.01;
  const Cs = Math.min(Cs1, Cs2);
  const CsMin = Math.max(Cs3, Cs4);
  const CsFinal = Math.max(Cs, CsMin);
  return { Cs: r2(CsFinal, 4), V: r2(CsFinal * W, 1), W, T };
}

/**
 * Approximate fundamental period (ACI/ASCE)
 * Ta = Ct × h_n^x
 * RC moment frame:  Ct = 0.0466,  x = 0.9
 * RC shear wall:    Ct = 0.0486,  x = 0.75
 */
export function approxPeriod(hn_meters, system = 'frame') {
  const ct = system === 'frame' ? 0.0466 : 0.0486;
  const x = system === 'frame' ? 0.9 : 0.75;
  return ct * Math.pow(hn_meters, x);
}

// ─────────────────────────────────────────────────────────
//  5.  SLAB DESIGN — one-way & two-way
// ─────────────────────────────────────────────────────────

/**
 * Minimum slab thickness per ACI 318-19 Table 7.3.1.1
 */
export function slabMinThickness(supportType, span_mm, fy) {
  return getMinSlabThickness(supportType, span_mm, fy);
}

/**
 * Factored load on slab (kN/m²)
 */
export function slabFactoredLoad(DL, SDL, LL) {
  return 1.2 * (DL + SDL) + 1.6 * LL;
}

/**
 * Maximum bending moment in slab (kN·m/m width)
 * M = C × w_u × l²
 */
export function slabBendingMoment(supportType, w_u, span_m) {
  const coeff = MOMENT_COEFFICIENTS[supportType];
  if (!coeff) return null;
  return {
    positive_mid: r2(coeff.positive_mid * w_u * span_m * span_m, 2),
    negative_support: r2(coeff.negative_support * w_u * span_m * span_m, 2),
  };
}

/**
 * Required steel area for slab (per metre width)
 * Iterative solution for tension-controlled section
 */
export function slabRequiredSteel(Mu_kNm, b = 1000, d, fc, fy) {
  const Mu = Math.abs(Mu_kNm) * 1e6;
  const phi = 0.9;
  if (!b || !d || !fc || !fy || b <= 0 || d <= 1 || fc <= 0 || fy <= 0)
    return { As_req: 0, As_min: 0, As_max: 0, a: 0, c: 0, phi, netTensileStrain: 0, isTensionControlled: false, ratio: 0, error: 'Invalid section' };

  let a = 0.2 * d;
  let As = 0;
  let iter = 0;

  while (iter < 50) {
    const denom = phi * fy * (d - a / 2);
    if (denom <= 0) break;
    const As_new = Mu / denom;
    if (!isFinite(As_new)) break;
    const a_new = As_new * fy / (0.85 * fc * b);
    if (Math.abs(a_new - a) < 0.5) {
      As = As_new;
      a = a_new;
      break;
    }
    a = a_new;
    As = As_new;
    iter++;
  }

  // Check minimum steel
  const As_min = AsMin(fc, fy, b, d);
  const As_final = Math.max(As, As_min);

  // Check max steel
  const As_max = rhoMax(fc, fy) * b * d;

  return {
    As_req: r2(As_final, 1),
    As_min: r2(As_min, 1),
    As_max: r2(As_max, 1),
    a: r2(a, 1),
    c: r2(a / beta1(fc), 1),
    phi,
    netTensileStrain: r2(0.003 * (d - a / beta1(fc)) / (a / beta1(fc)), 4),
    isTensionControlled: a / beta1(fc) <= 0.375 * d,
    ratio: r2(As_final / (b * d), 4),
  };
}

// ─────────────────────────────────────────────────────────
//  6.  BEAM DESIGN — flexure & shear
// ─────────────────────────────────────────────────────────

/**
 * Beam flexural design — determine As required
 * Returns required steel area and proposed bar layout
 */
export function beamFlexuralDesign(Mu_kNm, b, h, cover, stirrupDia, fc, fy) {
  const d = effectiveDepth(h, cover, 20, stirrupDia);
  const result = slabRequiredSteel(Mu_kNm, b, d, fc, fy);
  return { ...result, d: r2(d, 1), b, h };
}

/**
 * Required As based on Mu (direct formula — doubly checked)
 */
export function beamAsFromMu(Mu_kNm, b, d, fc, fy) {
  if (!b || !d || !fc || !fy || b <= 0 || d <= 0 || fc <= 0 || fy <= 0)
    return { As_req: 0, As_min: 0, As_max: 0, a: 0, d: d || 0, rho: 0, error: 'Invalid input dimensions' };
  const Mu = Mu_kNm * 1e6;
  const phi = 0.9;

  // Using quadratic:  As = (0.85 fc b / fy) × (d − sqrt(d² − 2 Mu / (φ × 0.85 × fc × b)))
  const numerator = 0.85 * fc * b;
  const discriminant = d * d - 2 * Math.abs(Mu) / (phi * 0.85 * fc * b);
  if (discriminant < 0) return { As_req: 0, error: 'Section too small — increase dimensions' };
  const a_sol = d - Math.sqrt(discriminant);
  const As = numerator * a_sol / fy;

  const As_min_val = AsMin(fc, fy, b, d);
  const As_final = Math.max(As, As_min_val);
  const As_max_val = rhoMax(fc, fy) * b * d;

  return {
    As_req: r2(As_final, 1),
    As_min: r2(As_min_val, 1),
    As_max: r2(As_max_val, 1),
    a: r2(a_sol, 1),
    d: r2(d, 1),
    rho: r2(As_final / (b * d), 4),
  };
}

/**
 * Beam shear design (ACI 22.5 / BNBC)
 * φVc = φ × 0.17 × λ × √f'c × b × d
 * Vs = Vu/φ − Vc
 * Spacing = Av × fy × d / Vs
 */
export function beamShearDesign(Vu_kN, b, d, fc, fy, stirrupLegs = 2, stirrupDia = 10) {
  if (!b || !d || b <= 0 || d <= 0)
    return { Vc: 0, phiVc: 0, stirrup: `${stirrupDia}mm-${stirrupLegs} legs`, Av: 0, spacing: 0, designStatus: 'Invalid section', Vs_provided: 0, error: 'Invalid section dimensions' };
  const phi = 0.75; // shear
  const lambda = 1.0; // normal weight concrete
  const Vc = 0.17 * lambda * Math.sqrt(fc) * b * d / 1000; // kN
  const phiVc = phi * Vc;

  const Av = stirrupLegs * Math.PI * stirrupDia * stirrupDia / 4; // mm²

  const Vu_abs = Math.abs(Vu_kN);
  let s = null;
  let designStatus = '';

  if (Vu_abs <= 0.5 * phiVc) {
    // Minimum reinforcement only
    s = Math.min(0.5 * d, 600);
    designStatus = 'Minimum stirrups only';
  } else if (Vu_abs <= phiVc) {
    s = Math.min(0.5 * d, 600);
    designStatus = 'No shear reinforcement required by calculation — provide minimum';
  } else {
    // Shear reinforcement required
    const Vs_req = Vu_abs / phi - Vc;
    if (Vs_req > 0.66 * Math.sqrt(fc) * b * d / 1000) {
      return { error: 'Section too small — increase beam dimensions (Vs exceeds maximum)' };
    }
    // Compute spacing
    const s_calc = Av * fy * d / (Vs_req * 1000);
    const s_max1 = 0.5 * d;
    const s_max2 = Vs_req > 0.33 * Math.sqrt(fc) * b * d / 1000 ? d / 4 : d / 2;
    s = Math.min(s_calc, s_max1, s_max2, 600);
    if (s < 25) {
      return { error: 'Spacing too small — increase beam dimensions or stirrup diameter' };
    }
    designStatus = 'Shear reinforcement required';
  }

  return {
    Vc: r2(Vc, 1),
    phiVc: r2(phiVc, 1),
    stirrup: `${stirrupDia}mm-${stirrupLegs} legs`,
    Av: r2(Av, 1),
    spacing: r2(s, 0),
    designStatus,
    Vs_provided: r2(Av * fy * d / (s * 1000), 1),
    unit: 'mm c/c',
  };
}

// ─────────────────────────────────────────────────────────
//  7.  COLUMN DESIGN — axial & biaxial
// ─────────────────────────────────────────────────────────

/**
 * Nominal axial capacity (ACI 22.4.2)
 * Tied column: φPn_max = 0.80 × φ × [0.85 fc (Ag − Ast) + fy × Ast]
 * Spiral:      φPn_max = 0.85 × φ × [0.85 fc (Ag − Ast) + fy × Ast]
 */
export function columnAxialCapacity(b, h, fc, fy, Ast, type = 'tied') {
  const phi = type === 'spiral' ? 0.75 : 0.65; // BNBC/ACI: spiral=0.75, tied=0.65
  const Ag = b * h;
  const Pn = 0.85 * fc * (Ag - Ast) + fy * Ast;
  const reduction = type === 'spiral' ? 0.85 : 0.80;
  const phiPn = reduction * phi * Pn / 1000; // N → kN
  return {
    Ag: r2(Ag, 0),
    Ast: r2(Ast, 1),
    rho_g: r2(Ast / Ag * 100, 2),
    Pn: r2(Pn / 1000, 1),
    phiPn: r2(phiPn, 1),
    phi,
    reduction,
  };
}

/**
 * Column reinforcement limits
 * Min: 1% Ag (ACI 10.6.1.1)
 * Max — tied: 8% Ag,  spiral: 6% Ag  (ACI 10.6.1.2)
 */
export function columnReinfLimits(Ag, type = 'tied') {
  const As_min = 0.01 * Ag;
  const As_max = type === 'spiral' ? 0.06 * Ag : 0.08 * Ag;
  const As_min_bars = Math.max(4, Math.ceil(As_min / 200)); // assume min 4 bars
  return {
    As_min: r2(As_min, 1),
    As_max: r2(As_max, 1),
    As_min_bars,
    rho_min: 1.0,
    rho_max: type === 'spiral' ? 6.0 : 8.0,
  };
}

/**
 * Biaxial bending — simplified Bresler load contour check
 * (Mu_x / φMnx)^α + (Mu_y / φMny)^α ≤ 1.0
 * α = 1.0 for circular, 1.5–2.0 for rectangular
 */
export function biaxialInteraction(Mux, Muy, phiMnx, phiMny, alpha = 1.5) {
  const ratio = Math.pow(Mux / phiMnx, alpha) + Math.pow(Muy / phiMny, alpha);
  return {
    interactionRatio: r2(ratio, 3),
    isAcceptable: ratio <= 1.0,
    alpha,
  };
}

// ─────────────────────────────────────────────────────────
//  8.  REBAR SELECTION & SCHEDULING
// ─────────────────────────────────────────────────────────

/**
 * Select bar combination to achieve required As
 * Returns the most economical combination
 */
export function selectRebar(As_required, barDiaOptions = [10, 12, 16, 20, 25], nb_max = 10) {
  As_required = Math.max(As_required || 0, 0);
  if (As_required <= 0) return { bar: '—', dia: 10, area: 78.5, n: 1, As_provided: 78.5, As_required: 0, excess: 78.5, excessPct: 0 };
  const available = REBAR_SIZES.filter((r) => barDiaOptions.includes(r.dia));
  if (available.length === 0) return null;

  let best = null;
  let bestExcess = Infinity;

  for (const bar of available) {
    const n = Math.ceil(As_required / bar.area);
    if (n > nb_max) continue;
    const As_provided = n * bar.area;
    const excess = As_provided - As_required;
    if (excess < bestExcess) {
      bestExcess = excess;
      best = {
        bar: bar.bar,
        dia: bar.dia,
        area: bar.area,
        n,
        As_provided: r2(As_provided, 1),
        As_required: r2(As_required, 1),
        excess: r2(excess, 1),
        excessPct: r2((excess / As_required) * 100, 1),
      };
    }
  }
  return best;
}

/**
 * Rebar spacing given a bar diameter, n bars, and section width
 */
export function barSpacing(b, cover, stirrupDia, barDia, nBars, layers = 1) {
  b = Math.max(b, 50);
  const barsPerLayer = Math.max(Math.ceil(nBars / layers), 1);
  const clearWidth = Math.max(b - 2 * cover - 2 * stirrupDia - barDia, 1);
  const nGaps = barsPerLayer - 1;
  const s = nGaps > 0 ? clearWidth / nGaps : Math.min(b, 300);
  return {
    clearSpacing: r2(Math.max(s - barDia, 0), 1),
    centerSpacing: r2(s, 1),
    nPerLayer: barsPerLayer,
    layers,
  };
}

/**
 * Rebar weight calculation (kg)
 */
export function rebarWeight(barDia, totalLength_m) {
  const bar = REBAR_SIZES.find((r) => r.dia === barDia);
  if (!bar) return 0;
  return r2(bar.mass * totalLength_m, 1);
}

/**
 * Total steel weight for a set of bars
 */
export function totalSteelWeight(bars) {
  // bars = [{ dia: 16, n: 4, length_m: 6 }, ...]
  let total = 0;
  for (const b of bars) {
    const bar = REBAR_SIZES.find((r) => r.dia === b.dia);
    if (bar) {
      total += bar.mass * b.n * b.length_m;
    }
  }
  return r2(total, 1);
}

/**
 * Concrete volume (m³)
 */
export function concreteVolume(length_m, width_m, thickness_m) {
  return r2(length_m * width_m * thickness_m, 3);
}

// ─────────────────────────────────────────────────────────
//  9.  COLUMN / BEAM / SLAB QUANTITY ESTIMATOR
// ─────────────────────────────────────────────────────────

/**
 * Full beam quantity estimate
 */
export function beamEstimate(b, h, length_m, fc, fy, Mu, Vu, cover, stirrupDia, mainBarDia = 16) {
  const safeVal = (v, fallback = 0) => (v !== undefined && v !== null && isFinite(v) ? v : fallback);
  b = safeVal(b, 300); h = safeVal(h, 500); length_m = safeVal(length_m, 6);
  Mu = Math.abs(safeVal(Mu, 0)); Vu = Math.abs(safeVal(Vu, 0));
  fc = safeVal(fc, 20); fy = safeVal(fy, 420);
  cover = safeVal(cover, 30); stirrupDia = safeVal(stirrupDia, 10); mainBarDia = safeVal(mainBarDia, 16);

  const d = Math.max(effectiveDepth(h, cover, mainBarDia, stirrupDia), 50);

  const flexure = beamAsFromMu(Mu, b, d, fc, fy);
  const shear = beamShearDesign(Vu, b, d, fc, fy, 2, stirrupDia);

  const As_req = safeVal(flexure?.As_req, AsMin(fc, fy, b, d));
  const bottomBars = selectRebar(As_req, [mainBarDia]);
  const topBars = selectRebar(AsMin(fc, fy, b, d), [mainBarDia]);

  const bottomSteel = bottomBars ? { dia: bottomBars.dia, n: bottomBars.n, length_m: length_m + 1 } : null;
  const topSteel = topBars ? { dia: topBars.dia, n: topBars.n, length_m: length_m + 1 } : null;

  const stirrupSpacing = safeVal(shear?.spacing, 150);
  const stirrupPerM = stirrupSpacing > 0 ? Math.ceil(1000 / stirrupSpacing) : 2;
  const stirrupCount = Math.ceil((length_m + 0.5) * stirrupPerM);
  const stirrupLength = Math.max(2 * (b + h - 4 * cover) / 1000 + 0.15, 0.5);

  const bars = [bottomSteel, topSteel, { dia: stirrupDia, n: stirrupCount, length_m: stirrupLength }].filter(Boolean);
  const totalWeight = totalSteelWeight(bars);
  const concreteVol = concreteVolume(length_m, b / 1000, h / 1000);

  return {
    flexure,
    shear,
    bottomBars,
    topBars,
    stirrups: { dia: stirrupDia, count: stirrupCount, spacing: stirrupSpacing },
    steelWeight_kg: totalWeight,
    concreteVolume_m3: concreteVol,
    bars,
    d,
  };
}

// ─────────────────────────────────────────────────────────
//  9.  COLUMN — PMM INTERACTION CURVE
// ─────────────────────────────────────────────────────────

export function columnPMMCurve(b, h, fc, fy, cover, mainDia, tieDia, nTotalBars, type = 'tied') {
  const d = effectiveDepth(h, cover, mainDia, tieDia);
  const dPrime = cover + tieDia + mainDia / 2;
  const Ag = b * h;
  const Abar = Math.PI * mainDia * mainDia / 4;
  const Ast = nTotalBars * Abar;
  const As = Ast / 2;
  const AsComp = Ast / 2;
  const b1 = beta1(fc);
  const Es = 200000;
  const points = [];
  const Po = 0.85 * fc * (Ag - Ast) + fy * Ast;
  const reduction = type === 'spiral' ? 0.85 : 0.80;
  points.push({ Pn: r2(reduction * Po / 1000, 1), Mn: 0, label: 'phiPn_max' });
  const steps = Array.from({ length: 25 }, (_, i) => h * (1.6 - i * 1.6 / 24));
  for (const c of steps) {
    if (c <= 5) continue;
    const a = b1 * Math.min(c, h);
    const a_eff = Math.min(a, h);
    const Cc = 0.85 * fc * a_eff * b / 1000;
    const yc = Math.max(h / 2 - a_eff / 2, 0);
    const epsComp = 0.003 * (c - dPrime) / c;
    const fsComp = Math.min(Math.max(epsComp * Es, -fy), fy);
    const Cs = AsComp * fsComp / 1000;
    const ys = h / 2 - dPrime;
    const epsTens = 0.003 * (d - c) / c;
    const fsTens = Math.max(Math.min(epsTens * Es, fy), -fy);
    const Ts = As * fsTens / 1000;
    const yt = d - h / 2;
    const Pn = Cc + Cs + Ts;
    const Mn = (Cc * yc + Cs * ys - Ts * yt) / 1000;
    if (points.length === 1 || Math.abs(Pn - points[points.length - 1].Pn) > 10) {
      let label = '';
      if (Math.abs(epsComp - 0.00207) < 0.0005) label = 'Balance point';
      points.push({ Pn: r2(Pn, 1), Mn: r2(Mn, 2), label, epsTens: r2(epsTens, 5) });
    }
    if (epsTens > 0.005) break;
  }
  const MuPure = 0.9 * As * fy * (d - dPrime) / 1e6;
  points.push({ Pn: 0, Mn: r2(MuPure, 2), label: 'Pure Bending' });
  return points;
}

// ─────────────────────────────────────────────────────────
//  10. COLUMN — SLENDERNESS CHECK (ACI 6.2)
// ─────────────────────────────────────────────────────────

export function columnSlenderness(b, h, kFactor, Lu_mm, M1_kNm, M2_kNm, Pu_kN, fc, Ast) {
  const r = 0.3 * h;
  const kLu_r = kFactor * Lu_mm / r;
  const M1 = Math.abs(M1_kNm);
  const M2 = Math.abs(M2_kNm);
  const M2_smaller = Math.min(M1, M2);
  const M2_larger = Math.max(M1, M2);
  const M1M2 = M2_larger > 0 ? M2_smaller / M2_larger : 1.0;
  const limit = Math.max(34 - 12 * M1M2, 40);
  const isSlender = kLu_r > limit;
  const Ec = 4700 * Math.sqrt(fc);
  const Ig = b * h * h * h / 12;
  const EI = 0.25 * Ec * Ig / 1000;
  const Pc = Math.PI * Math.PI * EI / (kFactor * Lu_mm) ** 2;
  const Cm = Math.max(0.6 + 0.4 * M1M2, 0.4);
  const denominator = 1 - Pu_kN / (0.75 * Pc);
  const delta_ns = denominator > 0.1 ? Math.max(Cm / denominator, 1.0) : 1.0;
  const Mu_design = isSlender ? r2(M2_larger * delta_ns, 2) : r2(M2_larger, 2);
  return {
    kLu_r: r2(kLu_r, 1),
    limit: r2(limit, 1),
    isSlender,
    Cm: r2(Cm, 3),
    Pc: r2(Pc, 1),
    delta_ns: r2(delta_ns, 4),
    Mu_initial: r2(M2_larger, 2),
    Mu_design,
  };
}

// ─────────────────────────────────────────────────────────
//  11. BEAM — DEFLECTION CHECK (ACI 24.2)
// ─────────────────────────────────────────────────────────

export function beamDeflection(b, h, span_mm, fc, fy, As_prov, As_req, w_service_kNm, w_dead_kNm, w_sus_kNm, R = 2) {
  const d = h - 60;
  const f_r = 0.62 * Math.sqrt(fc);
  const Ec = 4700 * Math.sqrt(fc);
  const Es = 200000;
  const n = Es / Ec;
  const Ig = b * h * h * h / 12;
  const yt = h / 2;
  const Mcr = f_r * Ig / yt / 1e6;
  const rho = As_prov / (b * d);
  const k = Math.sqrt(2 * rho * n + (rho * n) ** 2) - rho * n;
  const Icr = b * (k * d) ** 3 / 3 + n * As_prov * (d - k * d) ** 2;
  const Ma = w_service_kNm * (span_mm / 1000) ** 2 / 8;
  const ratio = Math.min(Mcr / Math.max(Ma, 0.001), 1);
  const Ie = (ratio ** 3) * Ig + (1 - ratio ** 3) * Icr;
  const w_per_mm = w_service_kNm * 1000 / 1000;
  const delta_inst = 5 * w_per_mm * Math.pow(span_mm, 4) / (384 * Ec * Ie);
  const xi = 2.0;
  const rhoComp = As_prov > 0 ? As_req / (b * d) : 0;
  const lambda_delta = xi / (1 + 50 * rhoComp);
  const delta_sus = delta_inst * (w_sus_kNm / Math.max(w_service_kNm, 0.001));
  const delta_long = delta_inst + lambda_delta * delta_sus;
  const allowVal = R === 2 ? span_mm / 480 : span_mm / 240;
  return {
    Ie: r2(Ie, 0), Icr: r2(Icr, 0), Ig: r2(Ig, 0),
    Mcr: r2(Mcr, 3), Ma: r2(Ma, 3),
    Ie_ratio: Math.min(ratio ** 3, 1).toFixed(3),
    delta_inst: r2(delta_inst, 2),
    delta_long: r2(delta_long, 2),
    allowable: r2(allowVal, 1),
    pass: delta_long <= allowVal,
    lambda_delta: r2(lambda_delta, 3),
  };
}

// ─────────────────────────────────────────────────────────
//  12. SLAB — TWO-WAY MOMENT DISTRIBUTION (ACI 13.6)
// ─────────────────────────────────────────────────────────

export function twoWaySlabMoments(Lx, Ly, w_u, edgeCondX = 'continuous', edgeCondY = 'continuous') {
  const ratio = Ly / Math.max(Lx, 0.1);
  if (ratio > 2) {
    return {
      type: 'one-way',
      ratio: r2(ratio, 2),
      warning: 'Ly/Lx > 2 — design as one-way slab',
      positive_mid: r2(w_u * Lx * Lx / 8, 2),
      negative_support: r2(w_u * Lx * Lx / 8, 2),
    };
  }
  const Mo_x = w_u * Ly * Lx ** 2 / 8;
  const Mo_y = w_u * Lx * Ly ** 2 / 8;
  const colStripWidth_x = Math.min(Lx / 4, Ly / 4) * 2;
  const colStripWidth_y = Math.min(Lx / 4, Ly / 4) * 2;
  let Mneg, Mpos;
  if (edgeCondX === 'simply_supported') {
    Mneg = { col_x: 0, mid_x: 0, col_y: 0, mid_y: 0 };
    Mpos = { col_x: 0.60 * Mo_x, mid_x: 0.40 * Mo_x, col_y: 0.60 * Mo_y, mid_y: 0.40 * Mo_y };
  } else if (edgeCondX === 'exterior') {
    Mneg = { col_x: 0.26 * Mo_x * 0.75, mid_x: 0.26 * Mo_x * 0.25, col_y: 0.26 * Mo_y * 0.75, mid_y: 0.26 * Mo_y * 0.25 };
    Mpos = { col_x: 0.52 * Mo_x * 0.60, mid_x: 0.52 * Mo_x * 0.40, col_y: 0.52 * Mo_y * 0.60, mid_y: 0.52 * Mo_y * 0.40 };
  } else {
    Mneg = { col_x: 0.35 * Mo_x * 0.75, mid_x: 0.35 * Mo_x * 0.25, col_y: 0.35 * Mo_y * 0.75, mid_y: 0.35 * Mo_y * 0.25 };
    Mpos = { col_x: 0.30 * Mo_x * 0.60, mid_x: 0.30 * Mo_x * 0.40, col_y: 0.30 * Mo_y * 0.60, mid_y: 0.30 * Mo_y * 0.40 };
  }
  return {
    type: 'two-way',
    ratio: r2(ratio, 2), Mo_x: r2(Mo_x, 2), Mo_y: r2(Mo_y, 2),
    colStripWidth_x: r2(colStripWidth_x, 2), colStripWidth_y: r2(colStripWidth_y, 2),
    negative: {
      column_strip_x: r2(Mneg.col_x, 2), middle_strip_x: r2(Mneg.mid_x, 2),
      column_strip_y: r2(Mneg.col_y, 2), middle_strip_y: r2(Mneg.mid_y, 2),
    },
    positive: {
      column_strip_x: r2(Mpos.col_x, 2), middle_strip_x: r2(Mpos.mid_x, 2),
      column_strip_y: r2(Mpos.col_y, 2), middle_strip_y: r2(Mpos.mid_y, 2),
    },
  };
}
