import React, { useState } from 'react';
import { useApp, dimDisplay, spanDisplay } from '../App';
import {
  beamAsFromMu, beamShearDesign, selectRebar, barSpacing,
  effectiveDepth, AsMin, beamEstimate, beamDeflection,
} from '../utils/structuralMath';

export default function BeamDesign() {
  const { materials, dimUnit } = useApp();
  const { fc, fy, cover } = materials;

  const [b, setB] = useState(300);
  const [h, setH] = useState(500);
  const [span_m, setSpan_m] = useState(6.0);
  const [Mu, setMu] = useState(150);
  const [Vu, setVu] = useState(80);
  const [mainBarDia, setMainBarDia] = useState(20);
  const [stirrupDia, setStirrupDia] = useState(10);
  const [stirrupLegs, setStirrupLegs] = useState(2);

  const d = effectiveDepth(h, cover, mainBarDia, stirrupDia);
  const flexure = beamAsFromMu(Mu, b, d, fc, fy);
  const shear = beamShearDesign(Vu, b, d, fc, fy, stirrupLegs, stirrupDia);
  const bottomBars = flexure?.error ? null : selectRebar(flexure.As_req, [10, 12, 16, 20, 25, 28, 32]);
  const asMin = AsMin(fc, fy, b, d);
  const topBars = selectRebar(asMin, [10, 12, 16, 20]);
  const bottSpacing = bottomBars ? barSpacing(b, cover, stirrupDia, bottomBars.dia, bottomBars.n, 1) : null;
  // Deflection check
  const As_provided = bottomBars ? bottomBars.As_provided : (topBars?.As_provided || 600);
  const As_req = flexure?.As_req || 400;
  const deflCheck = showDefl ? beamDeflection(b, h, span_m * 1000, fc, fy, As_provided, As_req, wService, 0, wSustained, roofBeam ? 1 : 2, cover, stirrupDia) : null;

  const weight = beamEstimate(b, h, span_m, fc, fy, Mu, Vu, cover, stirrupDia, mainBarDia);

  const bw = dimDisplay(b, dimUnit);
  const bh = dimDisplay(h, dimUnit);
  const bd = dimDisplay(d, dimUnit);
  const bSpan = spanDisplay(span_m, dimUnit);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">📐 Beam Design</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Flexural & shear reinforcement per BNBC 2020 / ACI 318-19</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h3 className="card-header">⚙️ Beam Parameters</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group"><label>b ({bw.unit})</label>
                <input type="number" step={dimUnit === 'imperial' ? 1 : 25} min={dimUnit === 'imperial' ? 6 : 150} max={dimUnit === 'imperial' ? 24 : 600}
                  value={bw.val} onChange={(e) => setB(dimUnit === 'imperial' ? Number(e.target.value) * 25.4 : Number(e.target.value))} />
              </div>
              <div className="input-group"><label>h ({bh.unit})</label>
                <input type="number" step={dimUnit === 'imperial' ? 1 : 25} min={dimUnit === 'imperial' ? 8 : 200} max={dimUnit === 'imperial' ? 40 : 1000}
                  value={bh.val} onChange={(e) => setH(dimUnit === 'imperial' ? Number(e.target.value) * 25.4 : Number(e.target.value))} />
              </div>
            </div>
            <div className="input-group"><label>Span ({bSpan.unit})</label>
              <input type="number" step={dimUnit === 'imperial' ? 0.5 : 0.5} min={dimUnit === 'imperial' ? 6 : 2} max={dimUnit === 'imperial' ? 65 : 20}
                value={bSpan.val} onChange={(e) => setSpan_m(dimUnit === 'imperial' ? Number(e.target.value) * 0.3048 : Number(e.target.value))} />
            </div>
            <div className="input-group"><label>M<sub>u</sub> (kN·m)</label><input type="number" step={5} min={0} value={Mu} onChange={(e) => setMu(Number(e.target.value))} /></div>
            <div className="input-group"><label>V<sub>u</sub> (kN)</label><input type="number" step={5} min={0} value={Vu} onChange={(e) => setVu(Number(e.target.value))} /></div>
            <div className="input-group"><label>Main Bar Ø</label>
              <select value={mainBarDia} onChange={(e) => setMainBarDia(Number(e.target.value))}>
                {[10, 12, 16, 20, 25, 28, 32].map((d) => {
                  const us = (d / 25.4).toFixed(2);
                  return <option key={d} value={d}>Ø{d}mm (#{(d / 25.4 * 8).toFixed(0)}) — {us}"</option>;
                })}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group"><label>Stirrup Ø</label>
                <select value={stirrupDia} onChange={(e) => setStirrupDia(Number(e.target.value))}>
                  <option value={8}>Ø8 — #2</option><option value={10}>Ø10 — #3</option><option value={12}>Ø12 — #4</option>
                </select>
              </div>
              <div className="input-group"><label>Legs</label>
                <select value={stirrupLegs} onChange={(e) => setStirrupLegs(Number(e.target.value))}>
                  <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
                </select>
              </div>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
              d = {bd.val} {bd.unit} (h − cover − stirrup − Ø/2 = {h}mm − {cover}mm − {stirrupDia} − {mainBarDia / 2})
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="card-header">📊 Design Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="stat-box"><p className="result-label">Section</p><p className="result-value">{bw.val}×{bh.val} {bw.unit}</p><p className="text-xs text-slate-400">d = {bd.val} {bd.unit}</p></div>
            <div className="stat-box"><p className="result-label">b/d ratio</p><p className="result-value">{((b / d) || 0).toFixed(2)}</p></div>
            <div className="stat-box"><p className="result-label">ρ</p><p className="result-value">{flexure ? `${(flexure.rho * 100).toFixed(2)}%` : '—'}</p></div>
            <div className="stat-box"><p className="result-label">A<sub>s,min</sub></p><p className="result-value">{flexure ? flexure.As_min.toFixed(0) : '—'}<span className="text-sm font-normal"> mm²</span></p></div>
          </div>

          {flexure && !flexure.error && (
            <>
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">💪 Flexural Reinforcement</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-400">A<sub>s,req</sub> — Bottom</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{flexure.As_req.toFixed(0)} mm²</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">A<sub>s,max</sub></p>
                    <p className="text-lg font-bold text-emerald-900 dark:text-emerald-300">{flexure.As_max.toFixed(0)} mm²</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                    <p className="text-xs text-slate-600 dark:text-slate-400">a / c</p>
                    <p className="text-lg font-bold">{(flexure?.a || 0).toFixed(0)} / {((flexure?.a || 0) / 0.85).toFixed(0)} mm ({((flexure?.a || 0) / 25.4).toFixed(2)} / {((flexure?.a || 0) / 0.85 / 25.4).toFixed(2)} in)</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">🔄 Bottom Bars</p>
                    {bottomBars ? (
                      <div>
                        <p className="text-lg font-bold">{bottomBars.n} — Ø{bottomBars.dia}mm (#{(bottomBars.dia / 25.4 * 8).toFixed(0)})</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">A<sub>s,prov</sub> = {bottomBars.As_provided} mm² · Excess: {bottomBars.excessPct}%</p>
                        {bottSpacing && <p className="text-xs text-slate-600 dark:text-slate-400">Spacing: {bottSpacing.centerSpacing.toFixed(0)} mm ({(bottSpacing.centerSpacing / 25.4).toFixed(1)} in) c/c</p>}
                      </div>
                    ) : <p className="text-sm text-red-600">No selection</p>}
                  </div>
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-3 border border-amber-100 dark:border-amber-800">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">⬆️ Top Bars (min)</p>
                    {topBars ? (
                      <div>
                        <p className="text-lg font-bold">{topBars.n} — Ø{topBars.dia}mm</p>
                        <p className="text-xs text-slate-600">A<sub>s,prov</sub> = {topBars.As_provided} mm²</p>
                      </div>
                    ) : <p className="text-sm text-amber-600">A<sub>s,min</sub> = {asMin.toFixed(0)} mm²</p>}
                  </div>
                </div>
              </div>
            </>
          )}
          {flexure?.error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-red-700 text-sm">{flexure.error}</div>}

          <div className="mb-4">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">✂️ Shear Reinforcement</h4>
            {shear?.error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 text-sm">{shear.error}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat-box"><p className="result-label">V<sub>c</sub></p><p className="result-value">{shear.Vc.toFixed(1)}<span className="text-sm font-normal"> kN</span></p></div>
                <div className="stat-box"><p className="result-label">φV<sub>c</sub></p><p className="result-value">{shear.phiVc.toFixed(1)}<span className="text-sm font-normal"> kN</span></p></div>
                <div className="stat-box"><p className="result-label">Stirrup</p><p className="result-value">{shear.stirrup}</p></div>
                <div className="stat-box"><p className="result-label">Spacing</p><p className="result-value">{(shear?.spacing || 0)} mm ({((shear?.spacing || 0) / 25.4).toFixed(1)} in)</p></div>
              </div>
            )}
            {shear && !shear.error && <div className="mt-2 text-xs"><span className={`badge ${shear.designStatus.includes('Minimum') ? 'badge-warning' : 'badge-success'}`}>{shear.designStatus}</span></div>}
          </div>
          {/* Deflection Check */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">📏 Deflection Check (ACI 24.2)</h4>
              <button onClick={() => setShowDefl(!showDefl)} className={`text-xs px-2 py-1 rounded ${showDefl ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {showDefl ? '● Checked' : '○ Check'}
              </button>
            </div>
            {showDefl && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="input-group"><label>w<sub>service</sub> (kN/m)</label>
                    <input type="number" step={0.5} min={0} value={wService} onChange={(e) => setWService(Number(e.target.value))} />
                  </div>
                  <div className="input-group"><label>w<sub>sustained</sub> (kN/m)</label>
                    <input type="number" step={0.5} min={0} value={wSustained} onChange={(e) => setWSustained(Number(e.target.value))} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <input type="checkbox" checked={roofBeam} onChange={() => setRoofBeam(!roofBeam)} /> Roof beam (L/240 instead of L/480)
                </label>
                {deflCheck ? (
                  <div className={`rounded-lg p-3 space-y-1 text-xs ${deflCheck.pass ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                    <div className="flex justify-between"><span className="text-slate-500">I<sub>e</sub></span><span className="font-mono font-bold">{deflCheck.Ie} mm⁴</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">I<sub>e</sub>/I<sub>g</sub></span><span className="font-mono">{deflCheck.Ie_ratio}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">M<sub>cr</sub></span><span className="font-mono">{deflCheck.Mcr} kN·m</span><span className="text-xs text-slate-400"> / </span><span className="font-mono">{deflCheck.Ma} kN·m</span></div>
                    <hr className="border-slate-200 dark:border-slate-700" />
                    <div className="flex justify-between font-semibold"><span>Δ<sub>immediate</sub></span><span className="font-mono">{deflCheck.delta_inst} mm</span></div>
                    <div className="flex justify-between font-semibold"><span>Δ<sub>long-term</sub></span><span className={`font-mono ${deflCheck.pass ? 'text-green-600' : 'text-red-600'}`}>{deflCheck.delta_long} mm</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Allowable</span><span className="font-mono">{deflCheck.allowable} mm</span></div>
                    <div className="flex justify-between font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>Status</span>
                      <span className={deflCheck.pass ? 'text-green-600' : 'text-red-600'}>{deflCheck.pass ? '✓ PASS' : '✗ FAIL'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">λ<sub>Δ</sub> = {deflCheck.lambda_delta} (sustained load factor, {roofBeam ? 'L/240' : 'L/480'} limit)</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Enter service load values above</p>
                )}
              </div>
            )}
          </div>

          {/* Estimate */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">📦 Estimate ({bSpan.val} {bSpan.unit} beam)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div><span className="text-slate-500 dark:text-slate-400">Steel</span><p className="font-bold font-mono">{(weight?.steelWeight_kg ?? 0)} kg ({((weight?.steelWeight_kg ?? 0) * 2.20462).toFixed(1)} lb)</p></div>
              <div><span className="text-slate-500 dark:text-slate-400">Concrete</span><p className="font-bold font-mono">{(weight?.concreteVolume_m3 ?? 0)} m³ ({((weight?.concreteVolume_m3 ?? 0) * 35.315).toFixed(2)} ft³)</p></div>
              <div><span className="text-slate-500 dark:text-slate-400">ρ<sub>g</sub></span><p className="font-bold font-mono">{flexure ? `${(flexure.rho * 100).toFixed(2)}%` : '—'}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
