import React from 'react';
import { useApp, mpaToPsi, mpaToKsi } from '../App';
import { Ec, beta1, rhoBal, rhoMin, rhoMax } from '../utils/structuralMath';
import { SEISMIC_REGIONS, SITE_CLASSES, CONCRETE_GRADES, STEEL_GRADES } from '../utils/bnbcData';

export default function Dashboard() {
  const { materials, loads, unitSystem } = useApp();
  const { fc, fy, cover } = materials;

  const ec = Ec(fc);
  const b1 = beta1(fc);
  const rBal = rhoBal(fc, fy);
  const rMin = rhoMin(fy);
  const rMax = rhoMax(fc, fy);
  const region = SEISMIC_REGIONS.find((r) => r.label === loads.seismicRegion);
  const site = SITE_CLASSES.find((s) => s.value === loads.siteClass);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">📊 Project Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          BNBC 2020 structural design summary — companion tool for ETABS
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="card">
          <p className="result-label">Concrete f'c</p>
          <p className="result-value">{fc} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">MPa</span></p>
          <p className="text-[10px] text-slate-400">{mpaToPsi(fc)} psi / {mpaToKsi(fc)} ksi</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ec = {ec.toFixed(0)} MPa</p>
        </div>
        <div className="card">
          <p className="result-label">Steel fy</p>
          <p className="result-value">{fy} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">MPa</span></p>
          <p className="text-[10px] text-slate-400">{mpaToPsi(fy)} psi / {mpaToKsi(fy)} ksi</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Es = 200,000 MPa (29,000 ksi)</p>
        </div>
        <div className="card">
          <p className="result-label">Clear Cover</p>
          <p className="result-value">{cover} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">mm</span></p>
          <p className="text-xs text-slate-400">{(cover / 25.4).toFixed(2)} in</p>
        </div>
        <div className="card">
          <p className="result-label">β₁ (stress block)</p>
          <p className="result-value">{b1.toFixed(3)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ρ_bal = {(rBal * 100).toFixed(2)}%</p>
        </div>
      </div>

      {/* Material Properties + Seismic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="card-header">🧱 Reinforcement Ratios</h3>
          <div className="space-y-3">
            {[
              { label: 'Balanced ratio ρ_bal', val: (rBal * 100).toFixed(2) + '%', cls: '' },
              { label: 'Maximum ratio ρ_max (0.75ρ_bal)', val: (rMax * 100).toFixed(2) + '%', cls: 'text-amber-600 dark:text-amber-400' },
              { label: 'Minimum ratio ρ_min (1.4/fy)', val: (rMin * 100).toFixed(3) + '%', cls: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Steel yield strain ε_y (fy/Es)', val: (fy / 200000).toFixed(4), cls: '' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span className="text-sm text-slate-600 dark:text-slate-400">{row.label}</span>
                <span className={`font-mono font-bold ${row.cls}`}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-header">🌍 Seismic Configuration</h3>
          <div className="space-y-3">
            {[
              { label: 'Region', val: loads.seismicRegion },
              { label: 'Site Class', val: loads.siteClass },
              { label: 'S_s / S_1', val: region ? `${region.ss}g / ${region.s1}g` : '—' },
              { label: 'I_e / R', val: `${loads.importanceFactor} / ${loads.rFactor}` },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span className="text-sm text-slate-600 dark:text-slate-400">{row.label}</span>
                <span className="font-mono font-bold">{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BNBC Code Reference */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">📖</span>
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-1">BNBC 2020 Quick Reference</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
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
