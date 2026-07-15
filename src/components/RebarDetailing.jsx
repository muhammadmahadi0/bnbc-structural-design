import React, { useState } from 'react';
import { useApp } from '../App';
import { selectRebar, barSpacing, rebarWeight, totalSteelWeight, concreteVolume } from '../utils/structuralMath';
import { REBAR_SIZES } from '../utils/bnbcData';

export default function RebarDetailing() {
  const { materials } = useApp();
  const { fy, cover } = materials;

  // State for element type
  const [elementType, setElementType] = useState('slab');
  const [AsRequired, setAsRequired] = useState(800);
  const [sectionWidth, setSectionWidth] = useState(300);
  const [sectionDepth, setSectionDepth] = useState(500);
  const [elementLength_m, setElementLength_m] = useState(6.0);
  const [stirrupDia, setStirrupDia] = useState(10);
  const [barDiaOptions, setBarDiaOptions] = useState([10, 12, 16, 20, 25]);

  // Toggle bar diameters
  const toggleBarDia = (d) => {
    setBarDiaOptions((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  };

  // Selection
  const selection = selectRebar(AsRequired, barDiaOptions, 12);
  const spacing = selection
    ? barSpacing(sectionWidth, cover, stirrupDia, selection.dia, selection.n, 1)
    : null;

  // Weight estimator
  const mainSteelWeight = selection
    ? rebarWeight(selection.dia, selection.n * (elementLength_m + 0.5))
    : 0;

  // Concrete volume by element type
  const getConcVolume = () => {
    switch (elementType) {
      case 'slab': return concreteVolume(elementLength_m, 1.0, sectionDepth / 1000);
      case 'beam': return concreteVolume(elementLength_m, sectionWidth / 1000, sectionDepth / 1000);
      case 'column': return concreteVolume(elementLength_m, sectionWidth / 1000, sectionDepth / 1000);
      default: return 0;
    }
  };

  const concVol = getConcVolume();

  // Rebar schedule table
  const allBarOptions = REBAR_SIZES.filter((r) => barDiaOptions.includes(r.dia));
  const schedule = allBarOptions.map((bar) => {
    const n = Math.ceil(AsRequired / bar.area);
    return { ...bar, n, As_provided: n * bar.area, excess: n * bar.area - AsRequired };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">🔄 Rebar Detailing & Estimation</h2>
        <p className="text-slate-500 mt-1">Steel area selection, spacing, weight and concrete volume per BNBC 2020</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Inputs ── */}
        <div className="card lg:col-span-1">
          <h3 className="card-header">⚙️ Detailing Parameters</h3>
          <div className="space-y-4">
            <div className="input-group">
              <label>Element Type</label>
              <div className="flex gap-2">
                {['slab', 'beam', 'column'].map((t) => (
                  <button
                    key={t}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition ${
                      elementType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                    onClick={() => setElementType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Required Steel Area A<sub>s</sub> (mm²)</label>
              <input
                type="number"
                step={25}
                min={50}
                max={10000}
                value={AsRequired}
                onChange={(e) => setAsRequired(Number(e.target.value))}
              />
            </div>

            {elementType !== 'slab' && (
              <div className="input-group">
                <label>Section Width b (mm)</label>
                <input type="number" step={25} min={150} value={sectionWidth} onChange={(e) => setSectionWidth(Number(e.target.value))} />
              </div>
            )}

            <div className="input-group">
              <label>{elementType === 'slab' ? 'Slab Thickness h' : 'Section Depth h'} (mm)</label>
              <input type="number" step={10} min={75} value={sectionDepth} onChange={(e) => setSectionDepth(Number(e.target.value))} />
            </div>

            <div className="input-group">
              <label>Element Length (m)</label>
              <input type="number" step={0.5} min={1} value={elementLength_m} onChange={(e) => setElementLength_m(Number(e.target.value))} />
            </div>

            <div className="input-group">
              <label>Stirrup / Tie Ø (mm)</label>
              <select value={stirrupDia} onChange={(e) => setStirrupDia(Number(e.target.value))}>
                <option value={8}>Ø8</option>
                <option value={10}>Ø10</option>
                <option value={12}>Ø12</option>
              </select>
            </div>

            <div>
              <label>Available Bar Diameters</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[10, 12, 14, 16, 18, 20, 22, 25, 28, 32].map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleBarDia(d)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      barDiaOptions.includes(d)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    Ø{d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="card lg:col-span-2">
          <h3 className="card-header">📊 Detailing Results</h3>

          {/* Best selection */}
          {selection ? (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 mb-6">
              <h4 className="font-semibold text-sm text-emerald-800 mb-2">✅ Optimal Bar Selection</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div>
                  <span className="text-emerald-600 text-xs">Bar</span>
                  <p className="font-bold text-lg">{selection.bar} <span className="text-sm font-normal">(Ø{selection.dia})</span></p>
                </div>
                <div>
                  <span className="text-emerald-600 text-xs">No. of bars</span>
                  <p className="font-bold text-lg">{selection.n}</p>
                </div>
                <div>
                  <span className="text-emerald-600 text-xs">A<sub>s,prov</sub></span>
                  <p className="font-bold text-lg">{selection.As_provided}<span className="text-sm font-normal"> mm²</span></p>
                </div>
                <div>
                  <span className="text-emerald-600 text-xs">Excess</span>
                  <p className="font-bold text-lg">{selection.excessPct}<span className="text-sm font-normal">%</span></p>
                </div>
                <div>
                  <span className="text-emerald-600 text-xs">Weight</span>
                  <p className="font-bold text-lg">{mainSteelWeight}<span className="text-sm font-normal"> kg</span></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-6">
              <p className="text-amber-700 text-sm">No feasible bar selection — try increasing section size or adding more bar diameters.</p>
            </div>
          )}

          {/* Spacing */}
          {spacing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="stat-box">
                <p className="result-label">Clear Spacing</p>
                <p className="result-value">{spacing.clearSpacing.toFixed(0)}<span className="text-sm font-normal"> mm</span></p>
              </div>
              <div className="stat-box">
                <p className="result-label">Center-Center</p>
                <p className="result-value">{spacing.centerSpacing.toFixed(0)}<span className="text-sm font-normal"> mm</span></p>
              </div>
              <div className="stat-box">
                <p className="result-label">Bars / Layer</p>
                <p className="result-value">{spacing.nPerLayer}</p>
              </div>
              <div className="stat-box">
                <p className="result-label">Layers</p>
                <p className="result-value">{spacing.layers}</p>
              </div>
            </div>
          )}

          {/* Rebar Schedule Table */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm text-slate-700 mb-3">📋 Rebar Schedule — All Options</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-3 py-2 text-left font-semibold">Bar</th>
                    <th className="px-3 py-2 text-right font-semibold">Ø (mm)</th>
                    <th className="px-3 py-2 text-right font-semibold">Area (mm²)</th>
                    <th className="px-3 py-2 text-right font-semibold">n</th>
                    <th className="px-3 py-2 text-right font-semibold">A<sub>s,prov</sub></th>
                    <th className="px-3 py-2 text-right font-semibold">Excess (%)</th>
                    <th className="px-3 py-2 text-right font-semibold">Mass (kg/m)</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr
                      key={row.dia}
                      className={`border-t border-slate-200 hover:bg-slate-50 ${
                        selection?.dia === row.dia ? 'bg-emerald-50 font-medium' : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-mono">{row.bar}</td>
                      <td className="px-3 py-2 text-right">{row.dia}</td>
                      <td className="px-3 py-2 text-right">{row.area.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right">{row.n}</td>
                      <td className="px-3 py-2 text-right">{row.As_provided.toFixed(0)}</td>
                      <td className="px-3 py-2 text-right">{Math.max(0, (row.excess / AsRequired * 100)).toFixed(1)}</td>
                      <td className="px-3 py-2 text-right">{row.mass}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quantity Summary */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-slate-700 mb-3">📦 Material Quantity Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Main bars ({elementType})</span>
                <p className="font-bold font-mono text-lg">{mainSteelWeight} kg</p>
              </div>
              <div>
                <span className="text-slate-500">Steel density</span>
                <p className="font-bold font-mono text-lg">
                  {concVol > 0 ? (mainSteelWeight / concVol / 100).toFixed(1) : '—'} kg/m³
                </p>
              </div>
              <div>
                <span className="text-slate-500">Concrete volume</span>
                <p className="font-bold font-mono text-lg">{concVol.toFixed(3)} m³</p>
              </div>
              <div>
                <span className="text-slate-500">Reinf. ratio</span>
                <p className="font-bold font-mono text-lg">
                  {sectionWidth > 0 && sectionDepth > 0
                    ? `${(AsRequired / (sectionWidth * sectionDepth) * 100).toFixed(2)}%`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
