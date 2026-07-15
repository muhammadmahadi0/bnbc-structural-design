import React from 'react';
import { useApp } from '../App';
import { Ec, beta1, rhoBal, rhoMin, rhoMax } from '../utils/structuralMath';
import { CONCRETE_GRADES, STEEL_GRADES, SEISMIC_REGIONS, SITE_CLASSES } from '../utils/bnbcData';

export default function Dashboard() {
  const { materials, loads } = useApp();
  const { fc, fy, cover } = materials;

  // Derived material properties
  const ec = Ec(fc);
  const b1 = beta1(fc);
  const rBal = rhoBal(fc, fy);
  const rMin = rhoMin(fy);
  const rMax = rhoMax(fc, fy);

  // Seismic region info
  const region = SEISMIC_REGIONS.find((r) => r.label === loads.seismicRegion);
  const site = SITE_CLASSES.find((s) => s.value === loads.siteClass);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">📊 Project Dashboard</h2>
        <p className="text-slate-500 mt-1">
          BNBC 2020 structural design summary — companion tool for ETABS
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="result-label">Concrete f'c</p>
          <p className="result-value">{fc} <span className="text-sm font-normal text-slate-500">MPa</span></p>
          <p className="text-xs text-slate-400 mt-1">Ec = {ec.toFixed(0)} MPa</p>
        </div>
        <div className="card">
          <p className="result-label">Steel fy</p>
          <p className="result-value">{fy} <span className="text-sm font-normal text-slate-500">MPa</span></p>
          <p className="text-xs text-slate-400 mt-1">Es = 200,000 MPa</p>
        </div>
        <div className="card">
          <p className="result-label">Clear Cover</p>
          <p className="result-value">{cover} <span className="text-sm font-normal text-slate-500">mm</span></p>
        </div>
        <div className="card">
          <p className="result-label">β₁ (stress block)</p>
          <p className="result-value">{b1.toFixed(3)}</p>
          <p className="text-xs text-slate-400 mt-1">ρ_bal = {(rBal * 100).toFixed(2)}%</p>
        </div>
      </div>

      {/* Material Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="card-header">🧱 Reinforcement Ratios</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Balanced ratio ρ<sub>bal</sub></span>
              <span className="font-mono font-bold">{(rBal * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Maximum ratio ρ<sub>max</sub> (0.75ρ<sub>bal</sub>)</span>
              <span className="font-mono font-bold text-amber-600">{(rMax * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Minimum ratio ρ<sub>min</sub> <span className="text-xs text-slate-400">(1.4/fy)</span></span>
              <span className="font-mono font-bold text-emerald-600">{(rMin * 100).toFixed(3)}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600">Balanced steel strain ε<sub>y</sub> <span className="text-xs text-slate-400">(fy/Es)</span></span>
              <span className="font-mono font-bold">{(fy / 200000).toFixed(4)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-header">🌍 Seismic Configuration</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Region</span>
              <span className="font-medium text-sm">{loads.seismicRegion}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Site Class</span>
              <span className="font-mono font-bold">{loads.siteClass}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">S<sub>s</sub> / S<sub>1</sub></span>
              <span className="font-mono font-bold">{region ? `${region.ss}g / ${region.s1}g` : '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600">I<sub>e</sub> / R</span>
              <span className="font-mono font-bold">{loads.importanceFactor} / {loads.rFactor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BNBC Code Reference */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">📖</span>
          <div>
            <h3 className="font-bold text-blue-900 mb-1">BNBC 2020 Quick Reference</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>Load Combos</strong> — 1.4D+1.6L · 1.2D+1.6L+0.5W · 1.2D+1.0E+1.0L</li>
              <li><strong>Slab</strong> — Min h = lₙ/20 (SS), lₙ/24 (1 cont), lₙ/28 (2 cont), lₙ/10 (cant)</li>
              <li><strong>Beam</strong> — ρ_max = 0.75ρ_bal · φVc = 0.75×0.17×λ×√f'c×b×d</li>
              <li><strong>Column</strong> — φPn_max = 0.80φ[0.85f'c(Ag−Ast)+fyAst] (tied)</li>
              <li><strong>Detailing</strong> — Min 4 bars in rectangular columns · Max spacing ≤ 3h ≤ 450 mm</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
