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
  return Math.max(1.4 / fy, 0.25 * Math.sqrt(28) / fy);
}

/** Minimum flexural steel area — ACI 9.6.1.2  (mm²) */
export function AsMin(fc, fy, b, d) {
  const rMin = rhoMin(fy);
  return Math.max(rMin * b * d, 0.25 * Math.sqrt(fc) / fy * b * d);
}

/** Clear cover → effective depth helper */
export function effectiveDepth(h_total, cover, barDia, stirrupDia = 0) {
  return h_total - cover - stirrupDia - barDia / 2;
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
  const Mu = Mu_kNm * 1e6; // kN·m → N·mm
  const phi = 0.9; // flexure

  // Initial estimate: assume a = 0.2d
  let a = 0.2 * d;
  let As = 0;
  let iter = 0;

  while (iter < 50) {
    const As_new = Mu / (phi * fy * (d - a / 2));
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
  const phi = 0.65; // compression-controlled (tied)
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
  const barsPerLayer = Math.ceil(nBars / layers);
  const clearWidth = b - 2 * cover - 2 * stirrupDia - barDia;
  const nGaps = barsPerLayer - 1;
  const s = nGaps > 0 ? clearWidth / nGaps : b;
  return {
    clearSpacing: r2(s - barDia, 1),
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
  const d = effectiveDepth(h, cover, mainBarDia, stirrupDia);

  // Flexure
  const flexure = beamAsFromMu(Mu, b, d, fc, fy);
  if (flexure.error) return { error: flexure.error };

  // Shear
  const shear = beamShearDesign(Vu, b, d, fc, fy, 2, stirrupDia);

  // Bar selection for bottom (tension)
  const bottomBars = selectRebar(flexure.As_req, [mainBarDia]);
  // Top bars — typically minimum for simply supported
  const topBars = selectRebar(AsMin(fc, fy, b, d), [mainBarDia]);

  // Rebar lengths
  const bottomSteel = bottomBars ? { dia: bottomBars.dia, n: bottomBars.n, length_m: length_m + 1 } : null;
  const topSteel = topBars ? { dia: topBars.dia, n: topBars.n, length_m: length_m + 1 } : null;

  // Stirrups count
  const stirrupPerM = shear.spacing > 0 ? Math.ceil(1000 / shear.spacing) : 2;
  const stirrupCount = Math.ceil((length_m + 0.5) * stirrupPerM);
  const stirrupLength = 2 * (b + h - 4 * cover) / 1000 + 0.15; // m per stirrup

  const bars = [
    bottomSteel,
    topSteel,
    { dia: stirrupDia, n: stirrupCount, length_m: stirrupLength },
  ].filter(Boolean);

  const totalWeight = totalSteelWeight(bars);
  const concreteVol = concreteVolume(length_m, b / 1000, h / 1000);

  return {
    flexure,
    shear,
    bottomBars,
    topBars,
    stirrups: { dia: stirrupDia, count: stirrupCount, spacing: shear.spacing },
    steelWeight_kg: totalWeight,
    concreteVolume_m3: concreteVol,
    bars,
    d,
  };
}
