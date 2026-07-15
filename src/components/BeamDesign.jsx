import React, { useState } from 'react';
import { useApp } from '../App';
import {
  beamAsFromMu, beamShearDesign, selectRebar, barSpacing,
  effectiveDepth, AsMin, totalSteelWeight, concreteVolume, beamEstimate,
} from '../utils/structuralMath';

export default function BeamDesign() {
  const { materials, loads } = useApp();
  const { fc, fy, cover } = materials;

  const [b, setB] = useState(300);  // mm
  const [h, setH] = useState(500);  // mm
  const [span_m, setSpan_m] = useState(6.0);
  const [Mu, setMu] = useState(150); // kN·m
  const [Vu, setVu] = useState(80);  // kN
  const [mainBarDia, setMainBarDia] = useState(20);
  const [stirrupDia, setStirrupDia] = useState(10);
  const [stirrupLegs, setStirrupLegs] = useState(2);

  const d = effectiveDepth(h, cover, mainBarDia, stirrupDia);
  const flexure = beamAsFromMu(Mu, b, d, fc, fy);
  const shear = beamShearDesign(Vu, b, d, fc, fy, stirrupLegs, stirrupDia);

  // Bar selection
  const bottomBars = flexure && !flexure.error
    ? selectRebar(flexure.As_req, [10, 12, 16, 20, 25, 28, 32])
    : null;
  const asMin = AsMin(fc, fy, b, d);
  const topBars = selectRebar(asMin, [10, 12, 16, 20]);

  const bottSpacing = bottomBars
    ? barSpacing(b, cover, stirrupDia, bottomBars.dia, bottomBars.n, 1)
    : null;

  const weight = beamEstimate(b, h, span_m, fc, fy, Mu, Vu, cover, stirrupDia, mainBarDia);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">📐 Beam Design</h2>
        <p className="text-slate-500 mt-1">Flexural & shear reinforcement per BNBC 2020 / ACI 318-19</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Input Panel ── */}
        <div className="card lg:col-span-1">
          <h3 className="card-header">⚙️ Beam Parameters</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label>b (mm)</label>
                <input type="number" step={25} min={150} max={600} value={b} onChange={(e) => setB(Number(e.target.value))} />
              </div>
              <div className="input-group">
                <label>h (mm)</label>
                <input type="number" step={25} min={200} max={1000} value={h} onChange={(e) => setH(Number(e.target.value))} />
              </div>
            </div>
            <div className="input-group">
              <label>Span (m)</label>
              <input type="number" step={0.5} min={2} max={20} value={span_m} onChange={(e) => setSpan_m(Number(e.target.value))} />
            </div>
            <div className="input-group">
              <label>Design Moment M<sub>u</sub> (kN·m)</label>
              <input type="number" step={5} min={0} value={Mu} onChange={(e) => setMu(Number(e.target.value))} />
            </div>
            <div className="input-group">
              <label>Design Shear V<sub>u</sub> (kN)</label>
              <input type="number" step={5} min={0} value={Vu} onChange={(e) => setVu(Number(e.target.value))} />
            </div>
            <div className="input-group">
              <label>Main Bar Diameter (mm)</label>
              <select value={mainBarDia} onChange={(e) => setMainBarDia(Number(e.target.value))}>
                {[10, 12, 16, 20, 25, 28, 32].map((d) => (
                  <option key={d} value={d}>Ø{d} mm</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label>Stirrup Ø (mm)</label>
                <select value={stirrupDia} onChange={(e) => setStirrupDia(Number(e.target.value))}>
                  <option value={8}>Ø8</option>
                  <option value={10}>Ø10</option>
                  <option value={12}>Ø12</option>
                </select>
              </div>
              <div className="input-group">
                <label>Legs</label>
                <select value={stirrupLegs} onChange={(e) => setStirrupLegs(Number(e.target.value))}>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
            </div>
            <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
              Effective depth d = {d.toFixed(0)} mm
              <br />
              <span className="text-slate-500">h − cover − stirrup − Ø/2 = {h} − {cover} − {stirrupDia} − {mainBarDia / 2}</span>
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="card lg:col-span-2">
          <h3 className="card-header">📊 Design Results</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="stat-box">
              <p className="result-label">Section</p>
              <p className="result-value">{b} × {h}</p>
              <p className="text-xs text-slate-400">d = {d.toFixed(0)} mm</p>
            </div>
            <div className="stat-box">
              <p className="result-label">b/d ratio</p>
              <p className="result-value">{(b / d).toFixed(2)}</p>
              <p className="text-xs text-slate-400">Range 0.3-0.5</p>
            </div>
            <div className="stat-box">
              <p className="result-label">ρ (provided)</p>
              <p className="result-value">{flexure ? `${(flexure.rho * 100).toFixed(2)}%` : '—'}</p>
            </div>
            <div className="stat-box">
              <p className="result-label">A<sub>s,min</sub></p>
              <p className="result-value">{flexure ? flexure.As_min.toFixed(0) : '—'}<span className="text-sm font-normal"> mm²</span></p>
            </div>
          </div>

          {/* Flexural Results */}
          {flexure && !flexure.error && (
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-slate-700 mb-3">💪 Flexural Reinforcement</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-700">A<sub>s,req</sub> — Bottom (tension)</p>
                  <p className="text-lg font-bold text-blue-900">{flexure.As_req.toFixed(0)} mm²</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <p className="text-xs text-emerald-700">A<sub>s,max</sub></p>
                  <p className="text-lg font-bold text-emerald-900">{flexure.As_max.toFixed(0)} mm²</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600">a / c</p>
                  <p className="text-lg font-bold">{flexure.a.toFixed(0)} / {(flexure.a / (0.85)).toFixed(0)} mm</p>
                </div>
              </div>

              {/* Bar Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-800 mb-1">🔄 Bottom Bars — Tension</p>
                  {bottomBars ? (
                    <div>
                      <p className="text-lg font-bold">{bottomBars.n} — Ø{bottomBars.dia}mm <span className="text-sm font-normal text-slate-500">({bottomBars.bar})</span></p>
                      <p className="text-xs text-slate-600">A<sub>s,prov</sub> = {bottomBars.As_provided} mm² · Excess: {bottomBars.excessPct}%</p>
                      {bottSpacing && (
                        <p className="text-xs text-slate-600">Spacing: {bottSpacing.centerSpacing.toFixed(0)} mm c/c · Clear: {bottSpacing.clearSpacing.toFixed(0)} mm</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">Unable to select bars — check Mu</p>
                  )}
                </div>
                <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-800 mb-1">⬆️ Top Bars — Compression (min)</p>
                  {topBars ? (
                    <div>
                      <p className="text-lg font-bold">{topBars.n} — Ø{topBars.dia}mm <span className="text-sm font-normal text-slate-500">({topBars.bar})</span></p>
                      <p className="text-xs text-slate-600">A<sub>s,min</sub> = {asMin.toFixed(0)} mm² · A<sub>s,prov</sub> = {topBars.As_provided} mm²</p>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600">Use as minimum — {asMin.toFixed(0)} mm²</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {flexure?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{flexure.error}</div>
          )}

          {/* Shear Results */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-slate-700 mb-3">✂️ Shear Reinforcement</h4>
            {shear?.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{shear.error}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat-box">
                  <p className="result-label">V<sub>c</sub> (concrete)</p>
                  <p className="result-value">{shear.Vc.toFixed(1)}<span className="text-sm font-normal"> kN</span></p>
                </div>
                <div className="stat-box">
                  <p className="result-label">φV<sub>c</sub></p>
                  <p className="result-value">{shear.phiVc.toFixed(1)}<span className="text-sm font-normal"> kN</span></p>
                </div>
                <div className="stat-box">
                  <p className="result-label">Stirrup</p>
                  <p className="result-value">{shear.stirrup}</p>
                </div>
                <div className="stat-box">
                  <p className="result-label">Spacing</p>
                  <p className="result-value">{shear.spacing}<span className="text-sm font-normal"> mm</span></p>
                </div>
              </div>
            )}
            {shear && !shear.error && (
              <div className="mt-2 text-xs">
                <span className={`badge ${shear.designStatus.includes('Minimum') ? 'badge-warning' : 'badge-success'}`}>
                  {shear.designStatus}
                </span>
              </div>
            )}
          </div>

          {/* Quantity Estimate */}
          <div className="bg-slate-50 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-sm text-slate-700 mb-2">📦 Quantity Estimate (for {span_m}m beam)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Steel weight</span>
                <p className="font-bold font-mono">{weight.steelWeight_kg} kg</p>
              </div>
              <div>
                <span className="text-slate-500">Concrete volume</span>
                <p className="font-bold font-mono">{weight.concreteVolume_m3} m³</p>
              </div>
              <div>
                <span className="text-slate-500">ρ <sub>g</sub></span>
                <p className="font-bold font-mono">{flexure ? `${(flexure.rho * 100).toFixed(2)}%` : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
