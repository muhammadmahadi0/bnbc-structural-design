import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import {
  slabFactoredLoad, slabBendingMoment, slabRequiredSteel,
  selectRebar, barSpacing, AsMin, effectiveDepth,
  getTempShrinkageAs,
} from '../utils/structuralMath';
import { SLAB_THICKNESS_FACTORS, MOMENT_COEFFICIENTS } from '../utils/bnbcData';

export default function SlabDesign() {
  const { materials, loads } = useApp();
  const { fc, fy, cover } = materials;

  const [span_m, setSpan_m] = useState(4.0);
  const [supportType, setSupportType] = useState('Simply supported');
  const [barDia, setBarDia] = useState(12);
  const [isOneWay, setIsOneWay] = useState(true);

  const L = span_m * 1000;
  const factor = SLAB_THICKNESS_FACTORS[supportType] || 20;
  let h_min = L / factor;
  h_min *= 0.4 + fy / 700;
  h_min = Math.ceil(h_min / 5) * 5;

  const [h, setH] = useState(h_min);
  useEffect(() => { setH(h_min); }, [h_min]);

  const d = effectiveDepth(h, cover, barDia, 0);
  const w_u = slabFactoredLoad(loads.dl, loads.sdl, loads.ll);
  const moments = slabBendingMoment(supportType, w_u, span_m);
  const Mu_design = Math.max(
    Math.abs(moments?.positive_mid || 0),
    Math.abs(moments?.negative_support || 0)
  );
  const steelResult = slabRequiredSteel(Mu_design, 1000, d, fc, fy);
  const barSelection = selectRebar(steelResult.As_req, [10, 12, 16]);
  const spacingResult = barSelection
    ? barSpacing(1000, cover, 0, barSelection.dia, barSelection.n, 1) : null;
  const As_temp = getTempShrinkageAs(fy, h);
  const spanDepthRatio = (L / h).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🏛️ Slab Design</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">One-way slab design per BNBC 2020 / ACI 318-19</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input */}
        <div className="card lg:col-span-1">
          <h3 className="card-header">⚙️ Parameters</h3>
          <div className="space-y-4">
            <div className="input-group">
              <label>Slab Type</label>
              <div className="flex gap-2">
                {['One-Way', 'Two-Way'].map((t) => (
                  <button key={t}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${(isOneWay && t === 'One-Way') || (!isOneWay && t === 'Two-Way') ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                    onClick={() => setIsOneWay(t === 'One-Way')}>{t}</button>
                ))}
              </div>
            </div>
            <div className="input-group">
              <label>Support Condition</label>
              <select value={supportType} onChange={(e) => setSupportType(e.target.value)}>
                {Object.keys(MOMENT_COEFFICIENTS).map((k) => (<option key={k}>{k}</option>))}
              </select>
            </div>
            <div className="input-group">
              <label>Span (m)</label>
              <input type="number" step={0.1} min={1.5} max={12} value={span_m} onChange={(e) => setSpan_m(Number(e.target.value))} />
            </div>
            <div className="input-group">
              <label>Slab Thickness h (mm)</label>
              <div className="flex gap-2">
                <input type="number" step={5} min={75} max={500} value={h} onChange={(e) => setH(Number(e.target.value))} className="flex-1" />
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 whitespace-nowrap shrink-0" onClick={() => setH(h_min)}>Min: {h_min}</button>
              </div>
            </div>
            <div className="input-group">
              <label>Main Bar Ø (mm)</label>
              <select value={barDia} onChange={(e) => setBarDia(Number(e.target.value))}>
                <option value={10}>Ø10</option><option value={12}>Ø12</option><option value={16}>Ø16</option>
              </select>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">SDL</span><span>{loads.sdl} kN/m²</span></div>
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">LL</span><span>{loads.ll} kN/m²</span></div>
              <div className="flex justify-between font-bold text-blue-700 dark:text-blue-400"><span>w<sub>u</sub></span><span>{w_u.toFixed(2)} kN/m²</span></div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card lg:col-span-2">
          <h3 className="card-header">📊 Design Results</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="stat-box">
              <p className="result-label">Min. Thickness</p>
              <p className="result-value">{h_min} <span className="text-sm font-normal">mm</span></p>
              <p className="text-xs text-slate-400">h/l = 1/{factor}</p>
            </div>
            <div className="stat-box">
              <p className="result-label">Effective depth d</p>
              <p className="result-value">{d.toFixed(0)} <span className="text-sm font-normal">mm</span></p>
            </div>
            <div className="stat-box">
              <p className="result-label">Span / Depth</p>
              <p className="result-value">{spanDepthRatio}</p>
              <p className="text-xs text-slate-400">Limit ~ 20-28</p>
            </div>
            <div className="stat-box">
              <p className="result-label">Design M<sub>u</sub></p>
              <p className="result-value">{Mu_design.toFixed(2)}<span className="text-sm font-normal"> kN·m</span></p>
            </div>
          </div>

          {moments && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-400 uppercase font-semibold">Positive M<sub>mid</sub></p>
                <p className="text-lg font-bold text-green-800 dark:text-green-300">{moments.positive_mid.toFixed(2)} kN·m</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-700 dark:text-red-400 uppercase font-semibold">Negative M<sub>support</sub></p>
                <p className="text-lg font-bold text-red-800 dark:text-red-300">{Math.abs(moments.negative_support).toFixed(2)} kN·m</p>
              </div>
            </div>
          )}

          {steelResult && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🔄 Reinforcement (per metre width)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat-box">
                  <p className="result-label">A<sub>s,req</sub></p>
                  <p className="result-value">{steelResult.As_req.toFixed(0)}<span className="text-sm font-normal"> mm²/m</span></p>
                </div>
                <div className="stat-box">
                  <p className="result-label">A<sub>s,min</sub></p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{steelResult.As_min.toFixed(0)}<span className="text-sm font-normal"> mm²/m</span></p>
                </div>
                <div className="stat-box">
                  <p className="result-label">A<sub>s,max</sub></p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{steelResult.As_max.toFixed(0)}<span className="text-sm font-normal"> mm²/m</span></p>
                </div>
                <div className="stat-box">
                  <p className="result-label">ρ (%)</p>
                  <p className="result-value">{(steelResult.ratio * 100).toFixed(3)}%</p>
                </div>
              </div>

              {barSelection && spacingResult && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-2">✅ Recommended Reinforcement</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-blue-600 dark:text-blue-400">Bar:</span> <strong>{barSelection.bar} (Ø{barSelection.dia}mm)</strong></div>
                    <div><span className="text-blue-600 dark:text-blue-400">n:</span> <strong>{barSelection.n} /m</strong></div>
                    <div><span className="text-blue-600 dark:text-blue-400">A<sub>s,prov</sub>:</span> <strong>{barSelection.As_provided} mm²/m</strong></div>
                    <div><span className="text-blue-600 dark:text-blue-400">Spacing:</span> <strong>{spacingResult.centerSpacing.toFixed(0)} mm c/c</strong></div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">Excess: {barSelection.excessPct}% · Clear spacing: {spacingResult.clearSpacing.toFixed(0)} mm</div>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">🌡️ Temperature & Shrinkage Steel</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">A<sub>s,temp</sub> = <strong>{As_temp.toFixed(0)} mm²/m</strong> (per ACI 24.4)</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Provide Ø10mm @ {(Math.PI * 5 * 5 / (As_temp / 1000) * 1000).toFixed(0)} mm c/c</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Concrete volume (per m² slab)</span>
                <span className="font-bold font-mono">{(h / 1000).toFixed(3)} m³/m²</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
