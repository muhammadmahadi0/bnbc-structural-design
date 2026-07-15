import React, { useState } from 'react';
import { useApp } from '../App';
import {
  columnAxialCapacity, columnReinfLimits, biaxialInteraction,
  selectRebar, totalSteelWeight, concreteVolume,
} from '../utils/structuralMath';
import { REBAR_SIZES } from '../utils/bnbcData';

export default function ColumnDesign() {
  const { materials } = useApp();
  const { fc, fy, cover } = materials;

  const [b, setB] = useState(400);
  const [h, setH] = useState(400);
  const [columnHeight_m, setColumnHeight_m] = useState(3.0);
  const [type, setType] = useState('tied');
  const [astRatio, setAstRatio] = useState(2.0); // % reinforcement
  const [mainBarDia, setMainBarDia] = useState(20);
  const [Mux, setMux] = useState(80);
  const [Muy, setMuy] = useState(50);

  // Calculate
  const Ag = b * h;
  const Ast_target = Ag * astRatio / 100;
  const capacity = columnAxialCapacity(b, h, fc, fy, Ast_target, type);
  const limits = columnReinfLimits(Ag, type);
  const barSelection = selectRebar(Ast_target, [12, 16, 20, 25, 28, 32], 12);

  // Biaxial interaction (using capacity as phiMnx/Mny simplified)
  const biaxial = biaxialInteraction(Mux, Muy, capacity.phiPn * 0.8, capacity.phiPn * 0.6);

  // Bar layout
  const barsPerFace = barSelection ? Math.max(2, Math.ceil(barSelection.n / 4)) : 2;
  const totalBars = barsPerFace * 4 - 4; // corner bars counted once

  // Tie spacing
  const tieDia = Math.max(10, Math.min(12, mainBarDia / 2));
  const tieSpacing = Math.min(b, h, 16 * mainBarDia, 48 * tieDia, 300);
  const tieCount = Math.ceil((columnHeight_m * 1000) / tieSpacing) + 1;
  const tieLength = 2 * (b + h) / 1000 - 8 * cover / 1000 + 0.2;

  const steelBars = barSelection
    ? [{ dia: barSelection.dia, n: barSelection.n, length_m: columnHeight_m + 0.5 }]
    : [];
  const tieBars = [{ dia: tieDia, n: tieCount, length_m: tieLength }];
  const totalWeight = totalSteelWeight([...steelBars, ...tieBars]);
  const concVol = concreteVolume(columnHeight_m, b / 1000, h / 1000);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">🏗️ Column Design</h2>
        <p className="text-slate-500 mt-1">Axial capacity, biaxial bending & reinforcement per BNBC 2020 / ACI 318-19</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Input ── */}
        <div className="card lg:col-span-1">
          <h3 className="card-header">⚙️ Column Parameters</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label>b (mm)</label>
                <input type="number" step={25} min={200} max={800} value={b} onChange={(e) => setB(Number(e.target.value))} />
              </div>
              <div className="input-group">
                <label>h (mm)</label>
                <input type="number" step={25} min={200} max={800} value={h} onChange={(e) => setH(Number(e.target.value))} />
              </div>
            </div>
            <div className="input-group">
              <label>A<sub>g</sub> = {Ag.toLocaleString()} mm² ({b} × {h})</label>
            </div>
            <div className="input-group">
              <label>Column Height (m)</label>
              <input type="number" step={0.5} min={2} max={10} value={columnHeight_m} onChange={(e) => setColumnHeight_m(Number(e.target.value))} />
            </div>
            <div className="input-group">
              <label>Column Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="tied">Tied Column</option>
                <option value="spiral">Spiral Column</option>
              </select>
            </div>
            <div className="input-group">
              <label>Reinforcement Ratio ρ<sub>g</sub> (%)</label>
              <input type="number" step={0.25} min={limits.rho_min} max={limits.rho_max} value={astRatio} onChange={(e) => setAstRatio(Number(e.target.value))} />
              <p className="text-[10px] text-slate-400">Min: {limits.rho_min}% · Max: {limits.rho_max}%</p>
            </div>
            <div className="input-group">
              <label>Main Bar Diameter (mm)</label>
              <select value={mainBarDia} onChange={(e) => setMainBarDia(Number(e.target.value))}>
                {[12, 16, 20, 25, 28, 32].map((d) => (
                  <option key={d} value={d}>Ø{d}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>M<sub>ux</sub> (kN·m) — major axis</label>
              <input type="number" step={5} value={Mux} onChange={(e) => setMux(Number(e.target.value))} />
            </div>
            <div className="input-group">
              <label>M<sub>uy</sub> (kN·m) — minor axis</label>
              <input type="number" step={5} value={Muy} onChange={(e) => setMuy(Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="card lg:col-span-2">
          <h3 className="card-header">📊 Design Results</h3>

          {/* Capacity */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="stat-box">
              <p className="result-label">Nominal P<sub>n</sub></p>
              <p className="result-value">{capacity.Pn.toFixed(0)}<span className="text-sm font-normal"> kN</span></p>
            </div>
            <div className="stat-box">
              <p className="result-label">φP<sub>n</sub> (design)</p>
              <p className="result-value text-blue-700">{capacity.phiPn.toFixed(0)}<span className="text-sm font-normal"> kN</span></p>
            </div>
            <div className="stat-box">
              <p className="result-label">φ / Reduction</p>
              <p className="result-value">{capacity.phi} / {capacity.reduction}</p>
            </div>
            <div className="stat-box">
              <p className="result-label">ρ<sub>g</sub></p>
              <p className="result-value">{capacity.rho_g}<span className="text-sm font-normal"> %</span></p>
            </div>
          </div>

          {/* Reinforcing Limits */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-700">A<sub>s,min</sub> (1%)</p>
              <p className="text-lg font-bold text-green-800">{limits.As_min.toFixed(0)} mm²</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700">A<sub>s,max</sub> ({limits.rho_max}%)</p>
              <p className="text-lg font-bold text-amber-800">{limits.As_max.toFixed(0)} mm²</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-700">A<sub>s,target</sub> ({astRatio}%)</p>
              <p className="text-lg font-bold text-blue-800">{Ast_target.toFixed(0)} mm²</p>
            </div>
          </div>

          {/* Bar Selection & Layout */}
          {barSelection && (
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-slate-700 mb-3">🔄 Reinforcement Layout</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat-box">
                  <p className="result-label">Bar</p>
                  <p className="result-value">{barSelection.n} — Ø{barSelection.dia}</p>
                  <p className="text-xs text-slate-400">{barSelection.bar}</p>
                </div>
                <div className="stat-box">
                  <p className="result-label">A<sub>s,prov</sub></p>
                  <p className="result-value">{barSelection.As_provided.toFixed(0)}<span className="text-sm font-normal"> mm²</span></p>
                </div>
                <div className="stat-box">
                  <p className="result-label">Excess</p>
                  <p className="result-value">{barSelection.excessPct}<span className="text-sm font-normal"> %</span></p>
                </div>
                <div className="stat-box">
                  <p className="result-label">Bars/face</p>
                  <p className="result-value">{barsPerFace}</p>
                </div>
              </div>
            </div>
          )}

          {/* Ties */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="stat-box">
              <p className="result-label">Tie Ø</p>
              <p className="result-value">Ø{tieDia}</p>
            </div>
            <div className="stat-box">
              <p className="result-label">Tie Spacing</p>
              <p className="result-value">{tieSpacing}<span className="text-sm font-normal"> mm</span></p>
            </div>
            <div className="stat-box">
              <p className="result-label">Tie Count</p>
              <p className="result-value">{tieCount}</p>
            </div>
            <div className="stat-box">
              <p className="result-label">Per spacing limit</p>
              <p className="text-sm font-mono">16Ø={16 * mainBarDia} · 48Ø<sub>tie</sub>={48 * tieDia}</p>
            </div>
          </div>

          {/* Biaxial Interaction */}
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 mb-6">
            <h4 className="font-semibold text-sm text-indigo-800 mb-2">📐 Biaxial Interaction Check (Bresler)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div><span className="text-indigo-600">M<sub>ux</sub> / φM<sub>nx</sub>:</span> <strong>{(Mux / (capacity.phiPn * 0.8)).toFixed(3)}</strong></div>
              <div><span className="text-indigo-600">M<sub>uy</sub> / φM<sub>ny</sub>:</span> <strong>{(Muy / (capacity.phiPn * 0.6)).toFixed(3)}</strong></div>
              <div>
                <span className="text-indigo-600">Ratio (α={biaxial.alpha}):</span>
                <span className={`font-bold ml-1 ${biaxial.isAcceptable ? 'text-green-700' : 'text-red-700'}`}>
                  {biaxial.interactionRatio}
                </span>
                <span className={`ml-2 badge ${biaxial.isAcceptable ? 'badge-success' : 'badge-danger'}`}>
                  {biaxial.isAcceptable ? '✓ OK' : '✗ FAIL'}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-slate-700 mb-2">📦 Quantity Estimate</h4>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Steel weight</span>
                <p className="font-bold font-mono">{totalWeight} kg</p>
              </div>
              <div>
                <span className="text-slate-500">Concrete</span>
                <p className="font-bold font-mono">{concVol} m³</p>
              </div>
              <div>
                <span className="text-slate-500">Steel density</span>
                <p className="font-bold font-mono">{concVol > 0 ? (totalWeight / concVol / 100).toFixed(1) : 0} kg/m³</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
