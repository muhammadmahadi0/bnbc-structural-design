import React, { useState } from 'react';
import { useApp, dimDisplay, spanDisplay, volDisplay, wDisplay } from '../App';
import { selectRebar, barSpacing, rebarWeight, totalSteelWeight, concreteVolume } from '../utils/structuralMath';
import { REBAR_SIZES } from '../utils/bnbcData';

export default function RebarDetailing() {
  const { materials, dimUnit } = useApp();
  const { cover } = materials;

  const [elementType, setElementType] = useState('slab');
  const [AsRequired, setAsRequired] = useState(800);
  const [sectionWidth, setSectionWidth] = useState(300);
  const [sectionDepth, setSectionDepth] = useState(500);
  const [elementLength_m, setElementLength_m] = useState(6.0);
  const [stirrupDia, setStirrupDia] = useState(10);
  const [barDiaOptions, setBarDiaOptions] = useState([10, 12, 16, 20, 25]);

  const toggleBarDia = (d) => {
    setBarDiaOptions((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b));
  };

  const selection = selectRebar(AsRequired, barDiaOptions, 12);
  const spacing = selection
    ? barSpacing(
        elementType === 'slab' ? 1000 : sectionWidth,
        cover, stirrupDia, selection.dia, selection.n, 1
      ) : null;
  const mainSteelWeight = selection
    ? rebarWeight(selection.dia, selection.n * (elementLength_m + 0.5)) : 0;

  const getConcVolume = () => {
    switch (elementType) {
      case 'slab': return concreteVolume(elementLength_m, 1.0, sectionDepth / 1000);
      default: return concreteVolume(elementLength_m, sectionWidth / 1000, sectionDepth / 1000);
    }
  };
  const concVol = getConcVolume();

  const allBarOptions = REBAR_SIZES.filter((r) => barDiaOptions.includes(r.dia));
  const schedule = allBarOptions.map((bar) => {
    const n = Math.ceil(AsRequired / bar.area);
    return { ...bar, n, As_provided: n * bar.area, excess: n * bar.area - AsRequired };
  });

  // Display helpers
  const sw = dimDisplay(sectionWidth, dimUnit);
  const sd = dimDisplay(sectionDepth, dimUnit);
  const len = spanDisplay(elementLength_m, dimUnit);
  const vol = volDisplay(concVol, dimUnit);
  const wt = wDisplay(mainSteelWeight, dimUnit);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🔄 Rebar Detailing & Estimation</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Steel area selection, spacing, weight and concrete volume per BNBC 2020</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h3 className="card-header">⚙️ Detailing Parameters</h3>
          <div className="space-y-4">
            <div className="input-group">
              <label>Element Type</label>
              <div className="flex gap-2">
                {['slab', 'beam', 'column'].map((t) => (
                  <button key={t}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition ${elementType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                    onClick={() => setElementType(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className="input-group">
              <label>Required A<sub>s</sub> (mm²)</label>
              <input type="number" step={25} min={50} max={10000} value={AsRequired} onChange={(e) => setAsRequired(Number(e.target.value))} />
            </div>
            {elementType !== 'slab' && (
              <div className="input-group"><label>Width ({sw.unit})</label>
                <input type="number" step={dimUnit === 'imperial' ? 1 : 25} min={dimUnit === 'imperial' ? 6 : 150}
                  value={sw.val} onChange={(e) => setSectionWidth(dimUnit === 'imperial' ? Number(e.target.value) * 25.4 : Number(e.target.value))} />
              </div>
            )}
            <div className="input-group"><label>{elementType === 'slab' ? 'Thickness' : 'Depth'} ({sd.unit})</label>
              <input type="number" step={dimUnit === 'imperial' ? 0.25 : 5} min={dimUnit === 'imperial' ? 3 : 75}
                value={sd.val} onChange={(e) => setSectionDepth(dimUnit === 'imperial' ? Number(e.target.value) * 25.4 : Number(e.target.value))} />
            </div>
            <div className="input-group"><label>Length ({len.unit})</label>
              <input type="number" step={dimUnit === 'imperial' ? 0.5 : 0.5} min={dimUnit === 'imperial' ? 3 : 1}
                value={len.val} onChange={(e) => setElementLength_m(dimUnit === 'imperial' ? Number(e.target.value) * 0.3048 : Number(e.target.value))} />
            </div>
            <div className="input-group"><label>Stirrup/Tie Ø</label>
              <select value={stirrupDia} onChange={(e) => setStirrupDia(Number(e.target.value))}>
                <option value={8}>Ø8</option><option value={10}>Ø10</option><option value={12}>Ø12</option>
              </select>
            </div>
            <div>
              <label>Available Bar Ø</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[10, 12, 14, 16, 18, 20, 22, 25, 28, 32].map((d) => (
                  <button key={d} onClick={() => toggleBarDia(d)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${barDiaOptions.includes(d) ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    Ø{d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="card-header">📊 Detailing Results</h3>

          {selection ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800 mb-6">
              <h4 className="font-semibold text-sm text-emerald-800 dark:text-emerald-300 mb-2">✅ Optimal Bar Selection</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div><span className="text-emerald-600 dark:text-emerald-400 text-xs">Bar</span><p className="font-bold text-lg">{selection.bar} <span className="text-sm font-normal">(Ø{selection.dia} / #{(selection.dia / 25.4 * 8).toFixed(0)})</span></p></div>
                <div><span className="text-emerald-600 dark:text-emerald-400 text-xs">No.</span><p className="font-bold text-lg">{selection.n}</p></div>
                <div><span className="text-emerald-600 dark:text-emerald-400 text-xs">A<sub>s,prov</sub></span><p className="font-bold text-lg">{selection.As_provided}<span className="text-sm font-normal"> mm²</span></p></div>
                <div><span className="text-emerald-600 dark:text-emerald-400 text-xs">Excess</span><p className="font-bold text-lg">{selection.excessPct}<span className="text-sm font-normal">%</span></p></div>
                <div><span className="text-emerald-600 dark:text-emerald-400 text-xs">Weight</span><p className="font-bold text-lg">{mainSteelWeight} kg ({(mainSteelWeight * 2.20462).toFixed(1)} lb)</p></div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800 mb-6">
              <p className="text-amber-700 dark:text-amber-400 text-sm">No feasible selection — try adding more bar diameters or increasing section.</p>
            </div>
          )}

          {spacing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="stat-box"><p className="result-label">Clear Spacing</p><p className="result-value">{spacing.clearSpacing.toFixed(0)} mm ({(spacing.clearSpacing / 25.4).toFixed(1)} in)</p></div>
              <div className="stat-box"><p className="result-label">Center-Center</p><p className="result-value">{spacing.centerSpacing.toFixed(0)} mm ({(spacing.centerSpacing / 25.4).toFixed(1)} in)</p></div>
              <div className="stat-box"><p className="result-label">Bars/Layer</p><p className="result-value">{spacing.nPerLayer}</p></div>
              <div className="stat-box"><p className="result-label">Layers</p><p className="result-value">{spacing.layers}</p></div>
            </div>
          )}

          <div className="mb-6 overflow-x-auto">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">📋 Rebar Schedule — All Options</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700">
                  <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">Bar</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">Ø (mm)</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">Area (mm²)</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">n</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">A<sub>s,prov</sub></th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">Excess %</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">Mass (kg/m)</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.dia}
                    className={`border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selection?.dia === row.dia ? 'bg-emerald-50 dark:bg-emerald-900/20 font-medium' : ''}`}>
                    <td className="px-3 py-2 font-mono text-slate-800 dark:text-slate-200">{row.bar}</td>
                    <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-200">{row.dia}</td>
                    <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-200">{row.area.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-200">{row.n}</td>
                    <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-200">{row.As_provided.toFixed(0)}</td>
                    <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-200">{Math.max(0, (row.excess / AsRequired * 100)).toFixed(1)}</td>
                    <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-200">{row.mass}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">📦 Material Quantity Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-slate-500 dark:text-slate-400">Main bars</span><p className="font-bold font-mono text-lg">{wt.val} {wt.unit}</p></div>
              <div><span className="text-slate-500 dark:text-slate-400">Steel density</span><p className="font-bold font-mono text-lg">{concVol > 0 ? (mainSteelWeight / concVol / 100).toFixed(1) : '—'} kg/m³</p></div>
              <div><span className="text-slate-500 dark:text-slate-400">Concrete</span><p className="font-bold font-mono text-lg">{vol.val} {vol.unit}</p></div>
              <div><span className="text-slate-500 dark:text-slate-400">ρ ratio</span><p className="font-bold font-mono text-lg">
                {sectionWidth > 0 && sectionDepth > 0 ? `${(AsRequired / (sectionWidth * sectionDepth) * 100).toFixed(2)}%` : '—'}
              </p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
