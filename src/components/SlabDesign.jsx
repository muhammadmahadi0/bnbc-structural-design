import React, { useState, useEffect } from 'react';
import { useApp, dimDisplay, spanDisplay } from '../App';
import {
  slabFactoredLoad, slabBendingMoment, slabRequiredSteel,
  selectRebar, barSpacing, effectiveDepth, getTempShrinkageAs,
} from '../utils/structuralMath';
import { SLAB_THICKNESS_FACTORS, MOMENT_COEFFICIENTS } from '../utils/bnbcData';

export default function SlabDesign() {
  const { materials, loads, dimUnit } = useApp();
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
  const Mu_design = Math.max(Math.abs(moments?.positive_mid || 0), Math.abs(moments?.negative_support || 0));
  const steelResult = slabRequiredSteel(Mu_design, 1000, d, fc, fy);
  const barSelection = selectRebar(steelResult.As_req, [10, 12, 16]);
  const spacingResult = barSelection ? barSpacing(1000, cover, 0, barSelection.dia, barSelection.n, 1) : null;
  const As_temp = getTempShrinkageAs(fy, h);

  const span = spanDisplay(span_m, dimUnit);
  const thick = dimDisplay(h, dimUnit);
  const dDisp = dimDisplay(d, dimUnit);
  const hMinDisp = dimDisplay(h_min, dimUnit);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🏛️ Slab Design</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">One-way slab design per BNBC 2020 / ACI 318-19</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h3 className="card-header">⚙️ Parameters</h3>
          <div className="space-y-4">
            <div className="input-group">
              <label>Slab Type</label>
              <div className="flex gap-2">
                {['One-Way', 'Two-Way'].map((t) => (
                  <button key={t} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${(isOneWay && t === 'One-Way') || (!isOneWay && t === 'Two-Way') ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                    onClick={() => setIsOneWay(t === 'One-Way')}>{t}</button>
                ))}
              </div>
            </div>
            <div className="input-group"><label>Support</label>
              <select value={supportType} onChange={(e) => setSupportType(e.target.value)}>
                {Object.keys(MOMENT_COEFFICIENTS).map((k) => (<option key={k}>{k}</option>))}
              </select>
            </div>
            <div className="input-group"><label>Span ({span.unit})</label>
              <input type="number" step={dimUnit === 'imperial' ? 0.5 : 0.1} min={dimUnit === 'imperial' ? 5 : 1.5} max={dimUnit === 'imperial' ? 40 : 12}
                value={span.val} onChange={(e) => setSpan_m(dimUnit === 'imperial' ? Number(e.target.value) * 0.3048 : Number(e.target.value))} />
            </div>
            <div className="input-group"><label>Thickness ({thick.unit})</label>
              <div className="flex gap-2">
                <input type="number" step={dimUnit === 'imperial' ? 0.25 : 5} min={dimUnit === 'imperial' ? 3 : 75} max={dimUnit === 'imperial' ? 20 : 500}
                  value={thick.val} onChange={(e) => setH(dimUnit === 'imperial' ? Number(e.target.value) * 25.4 : Number(e.target.value))} className="flex-1" />
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 whitespace-nowrap shrink-0" onClick={() => setH(h_min)}>
                  Min: {hMinDisp.val} {hMinDisp.unit}
                </button>
              </div>
            </div>
            <div className="input-group"><label>Main Bar Ø (mm)</label>
              <select value={barDia} onChange={(e) => setBarDia(Number(e.target.value))}>
                <option value={10}>Ø10 — #3 (0.375")</option>
                <option value={12}>Ø12 — #4 (0.5")</option>
                <option value={16}>Ø16 — #5 (0.625")</option>
              </select>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>SDL</span><span>{loads.sdl} kN/m²</span></div>
              <div className="flex justify-between"><span>LL</span><span>{loads.ll} kN/m²</span></div>
              <div className="flex justify-between font-bold text-blue-700 dark:text-blue-400"><span>w<sub>u</sub></span><span>{w_u.toFixed(2)} kN/m²</span></div>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="card-header">📊 Design Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="stat-box"><p className="result-label">Min Thickness</p><p className="result-value">{hMinDisp.val} <span className="text-sm font-normal">{hMinDisp.unit}</span></p><p className="text-xs text-slate-400">h/l = 1/{factor}</p></div>
            <div className="stat-box"><p className="result-label">Eff. depth d</p><p className="result-value">{dDisp.val} <span className="text-sm font-normal">{dDisp.unit}</span></p></div>
            <div className="stat-box"><p className="result-label">Span / Depth</p><p className="result-value">{(L / h).toFixed(1)}</p><p className="text-xs text-slate-400">Limit ~ 20-28</p></div>
            <div className="stat-box"><p className="result-label">Design M<sub>u</sub></p><p className="result-value">{Mu_design.toFixed(2)}<span className="text-sm font-normal"> kN·m</span></p></div>
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
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">🔄 Reinforcement (per m/ft width)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat-box"><p className="result-label">A<sub>s,req</sub></p><p className="result-value">{steelResult.As_req.toFixed(0)}<span className="text-sm font-normal"> mm²</span></p></div>
                <div className="stat-box"><p className="result-label">A<sub>s,min</sub></p><p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{steelResult.As_min.toFixed(0)}<span className="text-sm font-normal"> mm²</span></p></div>
                <div className="stat-box"><p className="result-label">A<sub>s,max</sub></p><p className="text-lg font-bold text-amber-700 dark:text-amber-400">{steelResult.As_max.toFixed(0)}<span className="text-sm font-normal"> mm²</span></p></div>
                <div className="stat-box"><p className="result-label">ρ (%)</p><p className="result-value">{(steelResult.ratio * 100).toFixed(3)}%</p></div>
              </div>

              {barSelection && spacingResult && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-2">✅ Recommended Reinforcement</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-blue-600 dark:text-blue-400">Bar:</span> <strong>{barSelection.bar} (Ø{barSelection.dia}mm / #{(barSelection.dia / 25.4 * 8).toFixed(0)})</strong></div>
                    <div><span className="text-blue-600 dark:text-blue-400">n:</span> <strong>{barSelection.n} /m</strong></div>
                    <div><span className="text-blue-600 dark:text-blue-400">A<sub>s,prov</sub>:</span> <strong>{barSelection.As_provided} mm²</strong></div>
                    <div><span className="text-blue-600 dark:text-blue-400">Spacing:</span> <strong>{spacingResult.centerSpacing.toFixed(0)} mm / {(spacingResult.centerSpacing / 25.4).toFixed(1)} in</strong></div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">Excess: {barSelection.excessPct}% · Clear: {spacingResult.clearSpacing.toFixed(0)} mm / {(spacingResult.clearSpacing / 25.4).toFixed(2)} in</div>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">🌡️ Temperature & Shrinkage Steel</p>
                <p className="text-sm">A<sub>s,temp</sub> = <strong>{As_temp.toFixed(0)} mm²/m</strong> (ACI 24.4)</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Ø10mm @ {(As_temp > 0 ? (Math.PI * 25 / (As_temp / 1000) * 1000) : 200).toFixed(0)} mm c/c ({((As_temp > 0 ? (Math.PI * 25 / (As_temp / 1000) * 1000) : 200) / 25.4).toFixed(1)} in)</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Concrete per m² slab</span>
                <span className="font-bold font-mono">{(h / 1000).toFixed(3)} m³/m² ({(h / 1000 * 35.315).toFixed(3)} ft³/ft²)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
