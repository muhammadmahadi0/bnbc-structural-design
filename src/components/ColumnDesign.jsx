import React, { useState } from 'react';
import { useApp, dimDisplay, spanDisplay, volDisplay } from '../App';
import { t } from '../utils/translations';
import {
  columnAxialCapacity, columnReinfLimits, biaxialInteraction,
  columnPMMCurve, columnSlenderness,
  selectRebar, totalSteelWeight, concreteVolume,
} from '../utils/structuralMath';

export default function ColumnDesign() {
  const { materials, dimUnit, lang } = useApp();
  const { fc, fy, cover } = materials;

  const [b, setB] = useState(400);
  const [h, setH] = useState(400);
  const [columnHeight_m, setColumnHeight_m] = useState(3.0);
  const [type, setType] = useState('tied');
  const [astRatio, setAstRatio] = useState(2.0);
  const [mainBarDia, setMainBarDia] = useState(20);
  const [Mux, setMux] = useState(80);
  const [Muy, setMuy] = useState(50);
  const [kFactor, setKFactor] = useState(1.0);
  const [showPMM, setShowPMM] = useState(false);
  const [showSlender, setShowSlender] = useState(false);

  const Ag = b * h;
  const Ast_target = Ag * astRatio / 100;
  const capacity = columnAxialCapacity(b, h, fc, fy, Ast_target, type);
  const limits = columnReinfLimits(Ag, type);
  const barSelection = selectRebar(Ast_target, [12, 16, 20, 25, 28, 32], 12);
  const biaxial = biaxialInteraction(Mux, Muy, capacity.phiPn * 0.8, capacity.phiPn * 0.6);

  // PMM interaction curve
  const tieDiaCol = Math.max(10, Math.min(12, mainBarDia / 2));
  const pmPoints = showPMM ? columnPMMCurve(b, h, fc, fy, cover, mainBarDia, tieDiaCol, barSelection?.n || 4, type) : [];

  // Slenderness
  const slenderCheck = showSlender ? columnSlenderness(b, h, kFactor, columnHeight_m * 1000, Muy, Mux, capacity.phiPn, fc, Ast_target) : null;

  const barsPerFace = barSelection ? Math.max(2, Math.ceil(barSelection.n / 4)) : 2;
  const tieDia = tieDiaCol;
  const tieSpacing = Math.min(b, h, 16 * mainBarDia, 48 * tieDia, 300);
  const tieCount = Math.ceil((columnHeight_m * 1000) / tieSpacing) + 1;
  const tieLength = 2 * (b + h) / 1000 - 8 * cover / 1000 + 0.2;

  const steelBars = barSelection
    ? [{ dia: barSelection.dia, n: barSelection.n, length_m: columnHeight_m + 0.5 }] : [];
  const tieBars = [{ dia: tieDia, n: tieCount, length_m: tieLength }];
  const totalWeight = totalSteelWeight([...steelBars, ...tieBars]);
  const concVol = concreteVolume(columnHeight_m, b / 1000, h / 1000);

  const bw = dimDisplay(b, dimUnit);
  const bh = dimDisplay(h, dimUnit);
  const bHt = spanDisplay(columnHeight_m, dimUnit);
  const vol = volDisplay(concVol, dimUnit);
  const wDisp = { val: +(totalWeight * 2.20462).toFixed(1), unit: 'lb' };
  const wMetric = { val: totalWeight, unit: 'kg' };
  const w = dimUnit === 'imperial' ? wDisp : wMetric;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('col.title', lang)}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Axial capacity, biaxial bending & reinforcement per BNBC 2020</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h3 className="card-header">⚙️ Column Parameters</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group"><label>b ({bw.unit})</label>
                <input type="number" step={dimUnit === 'imperial' ? 1 : 25} min={dimUnit === 'imperial' ? 8 : 200} max={dimUnit === 'imperial' ? 32 : 800}
                  value={bw.val} onChange={(e) => setB(dimUnit === 'imperial' ? Number(e.target.value) * 25.4 : Number(e.target.value))} />
              </div>
              <div className="input-group"><label>h ({bh.unit})</label>
                <input type="number" step={dimUnit === 'imperial' ? 1 : 25} min={dimUnit === 'imperial' ? 8 : 200} max={dimUnit === 'imperial' ? 32 : 800}
                  value={bh.val} onChange={(e) => setH(dimUnit === 'imperial' ? Number(e.target.value) * 25.4 : Number(e.target.value))} />
              </div>
            </div>
            <div className="input-group">
              <label className="text-xs text-slate-500 dark:text-slate-400">A<sub>g</sub> = {Ag.toLocaleString()} mm² ({(Ag / 25.4 / 25.4).toFixed(1)} in²) — {bw.val}×{bh.val} {bw.unit}</label>
            </div>
            <div className="input-group"><label>Height ({bHt.unit})</label>
              <input type="number" step={dimUnit === 'imperial' ? 0.5 : 0.5} min={dimUnit === 'imperial' ? 6 : 2} max={dimUnit === 'imperial' ? 33 : 10}
                value={bHt.val} onChange={(e) => setColumnHeight_m(dimUnit === 'imperial' ? Number(e.target.value) * 0.3048 : Number(e.target.value))} />
            </div>
            <div className="input-group"><label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="tied">Tied Column</option><option value="spiral">Spiral Column</option>
              </select>
            </div>
            <div className="input-group"><label>ρ<sub>g</sub> (%)</label>
              <input type="number" step={0.25} min={limits.rho_min} max={limits.rho_max} value={astRatio} onChange={(e) => setAstRatio(Number(e.target.value))} />
              <p className="text-[10px] text-slate-400">Min: {limits.rho_min}% · Max: {limits.rho_max}%</p>
            </div>
            <div className="input-group"><label>Main Bar Ø</label>
              <select value={mainBarDia} onChange={(e) => setMainBarDia(Number(e.target.value))}>
                {[12, 16, 20, 25, 28, 32].map((d) => (<option key={d} value={d}>Ø{d} (#{(d / 25.4 * 8).toFixed(0)})</option>))}
              </select>
            </div>
            <div className="input-group"><label>M<sub>ux</sub> (kN·m)</label><input type="number" step={5} value={Mux} onChange={(e) => setMux(Number(e.target.value))} /></div>
            <div className="input-group"><label>M<sub>uy</sub> (kN·m)</label><input type="number" step={5} value={Muy} onChange={(e) => setMuy(Number(e.target.value))} /></div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="card-header">📊 Design Results</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="stat-box"><p className="result-label">Nominal P<sub>n</sub></p><p className="result-value">{capacity.Pn.toFixed(0)}<span className="text-sm font-normal"> kN ({(capacity.Pn / 4.448).toFixed(0)} kip)</span></p></div>
            <div className="stat-box"><p className="result-label">φP<sub>n</sub> (design)</p><p className="result-value text-blue-700 dark:text-blue-400">{capacity.phiPn.toFixed(0)}<span className="text-sm font-normal"> kN</span></p></div>
            <div className="stat-box"><p className="result-label">φ / Reduction</p><p className="result-value">{capacity.phi} / {capacity.reduction}</p></div>
            <div className="stat-box"><p className="result-label">ρ<sub>g</sub></p><p className="result-value">{capacity.rho_g}<span className="text-sm font-normal"> %</span></p></div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400">A<sub>s,min</sub> (1%)</p>
              <p className="text-lg font-bold text-green-800 dark:text-green-300">{limits.As_min.toFixed(0)} mm² ({(limits.As_min / 645.16).toFixed(2)} in²)</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">A<sub>s,max</sub> ({limits.rho_max}%)</p>
              <p className="text-lg font-bold text-amber-800 dark:text-amber-300">{limits.As_max.toFixed(0)} mm²</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-400">A<sub>s,target</sub> ({astRatio}%)</p>
              <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{Ast_target.toFixed(0)} mm²</p>
            </div>
          </div>

          {barSelection && (
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">🔄 Reinforcement Layout</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat-box"><p className="result-label">Bar</p><p className="result-value">{barSelection.n} — Ø{barSelection.dia} (#{(barSelection.dia / 25.4 * 8).toFixed(0)})</p><p className="text-xs text-slate-400">{barSelection.bar}</p></div>
                <div className="stat-box"><p className="result-label">A<sub>s,prov</sub></p><p className="result-value">{barSelection.As_provided.toFixed(0)}<span className="text-sm font-normal"> mm²</span></p></div>
                <div className="stat-box"><p className="result-label">Excess</p><p className="result-value">{barSelection.excessPct}<span className="text-sm font-normal"> %</span></p></div>
                <div className="stat-box"><p className="result-label">Bars/face</p><p className="result-value">{barsPerFace}</p></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="stat-box"><p className="result-label">Tie Ø</p><p className="result-value">Ø{tieDia} ({(tieDia / 25.4).toFixed(2)}")</p></div>
            <div className="stat-box"><p className="result-label">Spacing</p><p className="result-value">{tieSpacing} mm ({(tieSpacing / 25.4).toFixed(1)} in)</p></div>
            <div className="stat-box"><p className="result-label">Count</p><p className="result-value">{tieCount}</p></div>
            <div className="stat-box"><p className="result-label">Limits</p><p className="result-value text-[10px]">16Ø={(16 * mainBarDia)} · 48Ø<sub>tie</sub>={(48 * tieDia)} · {b}={b}</p></div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800 mb-6">
            <h4 className="font-semibold text-sm text-indigo-800 dark:text-indigo-300 mb-2">📐 Biaxial Interaction Check (Bresler)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div><span className="text-indigo-600 dark:text-indigo-400">M<sub>ux</sub>/φM<sub>nx</sub>:</span> <strong>{(Mux / (capacity.phiPn * 0.8)).toFixed(3)}</strong></div>
              <div><span className="text-indigo-600 dark:text-indigo-400">M<sub>uy</sub>/φM<sub>ny</sub>:</span> <strong>{(Muy / (capacity.phiPn * 0.6)).toFixed(3)}</strong></div>
              <div>
                <span className="text-indigo-600 dark:text-indigo-400">Ratio (α={biaxial.alpha}):</span>
                <span className={`font-bold ml-1 ${biaxial.isAcceptable ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{biaxial.interactionRatio}</span>
                <span className={`ml-2 badge ${biaxial.isAcceptable ? 'badge-success' : 'badge-danger'}`}>{biaxial.isAcceptable ? '✓ OK' : '✗ FAIL'}</span>
              </div>
            </div>
          </div>

          {/* PMM Interaction Curve */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">📈 P-M Interaction Curve</h4>
              <button onClick={() => setShowPMM(!showPMM)} className={`text-xs px-2 py-1 rounded ${showPMM ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {showPMM ? '● Points' : '○ Generate'}
              </button>
            </div>
            {showPMM && pmPoints.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400">
                      <th className="text-left py-1 pr-2">Label</th>
                      <th className="text-right px-2">P<sub>n</sub> (kN)</th>
                      <th className="text-right px-2">M<sub>n</sub> (kN·m)</th>
                      <th className="text-right pl-2">ε<sub>t</sub></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pmPoints.map((pt, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                        <td className="py-1 pr-2 text-slate-500">{pt.label || (pt.Pn > 0 ? 'Comp.' : 'Tension')}</td>
                        <td className="text-right px-2 font-mono font-bold">{pt.Pn}</td>
                        <td className="text-right px-2 font-mono">{pt.Mn}</td>
                        <td className="text-right pl-2 font-mono text-slate-400">{pt.epsTens || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-slate-400 mt-2">Use these (P<sub>n</sub>, M<sub>n</sub>) points to verify your ETABS column section in Section Designer.</p>
              </div>
            )}
          </div>

          {/* Slenderness Check */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">📏 Slenderness Check (ACI 6.2)</h4>
              <button onClick={() => setShowSlender(!showSlender)} className={`text-xs px-2 py-1 rounded ${showSlender ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {showSlender ? '● Checked' : '○ Check'}
              </button>
            </div>
            {showSlender && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-xs text-slate-500">k-factor</label>
                  <select className="text-xs py-1 px-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800" value={kFactor} onChange={(e) => setKFactor(Number(e.target.value))}>
                    <option value={0.5}>0.5 — Fixed-fixed</option>
                    <option value={0.7}>0.7 — Fixed-pinned</option>
                    <option value={1.0}>1.0 — Pinned-pinned</option>
                    <option value={2.0}>2.0 — Cantilever</option>
                  </select>
                </div>
                {slenderCheck ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded"><span className="text-slate-400">kL<sub>u</sub>/r</span><span className={`font-bold ${slenderCheck.isSlender ? 'text-red-600' : 'text-green-600'}`}>{slenderCheck.kLu_r}</span></div>
                    <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded"><span className="text-slate-400">Limit</span><span className="font-bold">{slenderCheck.limit}</span></div>
                    <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded"><span className="text-slate-400">Slender?</span><span className={slenderCheck.isSlender ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{slenderCheck.isSlender ? 'YES' : 'No'}</span></div>
                    <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded"><span className="text-slate-400">C<sub>m</sub></span><span className="font-bold">{slenderCheck.Cm}</span></div>
                    <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded"><span className="text-slate-400">P<sub>c</sub></span><span className="font-bold">{slenderCheck.Pc} kN</span></div>
                    <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded"><span className="text-slate-400">δ<sub>ns</sub></span><span className="font-bold">{slenderCheck.delta_ns}</span></div>
                    <div className="col-span-2 flex justify-between bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded font-semibold">
                      <span>M<sub>u,design</sub></span>
                      <span>{slenderCheck.Mu_initial} → <span className="text-blue-700 dark:text-blue-400">{slenderCheck.Mu_design}</span> kN·m</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Select k-factor above</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">📦 Quantity Estimate</h4>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><span className="text-slate-500 dark:text-slate-400">Steel</span><p className="font-bold font-mono">{w.val} {w.unit}</p></div>
              <div><span className="text-slate-500 dark:text-slate-400">Concrete</span><p className="font-bold font-mono">{vol.val} {vol.unit}</p></div>
              <div><span className="text-slate-500 dark:text-slate-400">ρ</span><p className="font-bold font-mono">{concVol > 0 ? (totalWeight / concVol / 100).toFixed(1) : 0} kg/m³</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
