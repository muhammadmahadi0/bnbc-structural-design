import React, { useState } from 'react';
import { useApp, spanDisplay } from '../App';
import { t } from '../utils/translations';
import {
  OCCUPANCY_LOADS, FINISH_LOADS, PARTITION_LOADS,
  WIND_SPEED_ZONES, EXPOSURE_CATEGORIES,
  SEISMIC_REGIONS, SITE_CLASSES, IMPORTANCE_FACTORS,
  RESPONSE_MOD_FACTORS, KZ_TABLE, GUST_FACTOR,
  getFa, getFv, TOPOGRAPHY_FACTORS,
  getSDC, sptToSiteClass,
} from '../utils/bnbcData';
import {
  factoredLoad, windDesignPressure, interpolateKz,
  seismicDesignParams, seismicBaseShear, approxPeriod,
} from '../utils/structuralMath';

const r2 = (v, n = 2) => (v !== undefined && isFinite(v) ? Math.round(v * 10 ** n) / 10 ** n : 0);

const emptySPT = () => ({ depth: 1.5, nValue: 15 });

export default function LoadCalculator() {
  const { loads, setLoads, dimUnit, lang } = useApp();

  const [selectedOccupancy, setSelectedOccupancy] = useState(OCCUPANCY_LOADS[0]);
  const [finishLoad, setFinishLoad] = useState(1.0);
  const [partitionLoad, setPartitionLoad] = useState(1.0);
  const [customLL, setCustomLL] = useState('');
  const [buildingHeight_m, setBuildingHeight_m] = useState(15);
  const [buildingWeight_kN, setBuildingWeight_kN] = useState(10000);
  const [useCustomLL, setUseCustomLL] = useState(false);
  const [showWindCalc, setShowWindCalc] = useState(false);
  const [showSeismicCalc, setShowSeismicCalc] = useState(false);
  const [topographyKzt, setTopographyKzt] = useState(1.0);
  const [selectedSystem, setSelectedSystem] = useState(RESPONSE_MOD_FACTORS[0]);

  // ── SPT-N state ──
  const [sptRows, setSptRows] = useState([emptySPT()]);
  const [useSpt, setUseSpt] = useState(false);

  const sdl = finishLoad + partitionLoad;
  const ll = useCustomLL ? Number(customLL) || 0 : selectedOccupancy.ll;

  React.useEffect(() => { setLoads((p) => ({ ...p, sdl, ll })); }, [sdl, ll]);

  // ── SPT-N avg & site class ──
  const sptAvg = sptRows.reduce((s, r) => s + r.nValue, 0) / (sptRows.length || 1);
  const sptResult = useSpt ? sptToSiteClass(sptAvg) : null;

  // ── Wind ──
  const computeWind = () => {
    const expTable = KZ_TABLE[loads.exposure] || KZ_TABLE.C;
    const Kz = interpolateKz(expTable, buildingHeight_m);
    const V = loads.windSpeed;
    const qz = 0.613 * Kz * topographyKzt * 0.85 * (V / 3.6) * (V / 3.6) * 1.0;
    return {
      V, Kz: r2(Kz, 3), qz: r2(qz, 1),
      p_windward: r2(windDesignPressure(qz, GUST_FACTOR, 0.80, qz, 0.18), 1),
      p_leeward:  r2(windDesignPressure(qz, GUST_FACTOR, -0.50, qz, 0.18), 1),
      p_side:     r2(windDesignPressure(qz, GUST_FACTOR, -0.70, qz, 0.18), 1),
      height: buildingHeight_m,
    };
  };

  // ── Seismic ──
  const computeSeismic = () => {
    const region = SEISMIC_REGIONS.find((r) => r.label === loads.seismicRegion);
    if (!region) return null;
    const siteClassActual = sptResult ? sptResult.siteClass : loads.siteClass;
    const Fa = getFa(siteClassActual, region.ss);
    const Fv = getFv(siteClassActual, region.s1);
    const params = seismicDesignParams(Fa, region.ss, Fv, region.s1);
    const hn = loads.floorCount * loads.floorHeight_m;
    const T = approxPeriod(hn, 'frame');
    const bs = seismicBaseShear(params.SDS, params.SD1, selectedSystem.r, loads.importanceFactor, buildingWeight_kN, T);
    const sdc = getSDC(params.SDS, params.SD1);
    return { region, Fa, Fv, ...params, hn, T: r2(T, 3), ...bs, sdc, omega: selectedSystem.omega, cd: selectedSystem.cd };
  };

  const windData = showWindCalc ? computeWind() : null;
  const seismicData = showSeismicCalc ? computeSeismic() : null;
  const combos = factoredLoad(0, sdl, ll, windData?.p_windward || 0, seismicData?.V || 0);

  const bh = spanDisplay(buildingHeight_m, dimUnit);
  const fh = spanDisplay(loads.floorHeight_m, dimUnit);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('load.title', lang)}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Dead, Live, Wind & Seismic loads per BNBC 2020</p>
      </div>

      {/* ─── Row 1: SDL/LL + Combos ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="card-header">📦 Super Dead Load & Live Load</h3>
          <div className="mb-4">
            <label>Floor Finish Load (kN/m²)</label>
            <div className="flex gap-2">
              <select className="flex-1" value={finishLoad} onChange={(e) => { const v = e.target.value; if (v === 'custom') return; setFinishLoad(Number(v)); }}>
                {FINISH_LOADS.map((f) => (<option key={f.label} value={f.load}>{f.label}</option>))}
              </select>
              <input type="number" className="w-24" step={0.1} min={0} value={finishLoad} onChange={(e) => setFinishLoad(Number(e.target.value))} />
            </div>
          </div>
          <div className="mb-4">
            <label>Partition Wall Load (kN/m²)</label>
            <div className="flex gap-2">
              <select className="flex-1" value={partitionLoad} onChange={(e) => { const v = e.target.value; if (v === 'custom') return; setPartitionLoad(Number(v)); }}>
                {PARTITION_LOADS.map((p) => (<option key={p.label} value={p.load}>{p.label}</option>))}
              </select>
              <input type="number" className="w-24" step={0.1} min={0} value={partitionLoad} onChange={(e) => setPartitionLoad(Number(e.target.value))} />
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label>Occupancy / Live Load</label>
              <label className="flex items-center gap-2 text-xs font-normal text-slate-600 dark:text-slate-400">
                <input type="checkbox" checked={useCustomLL} onChange={() => setUseCustomLL(!useCustomLL)} /> Custom LL
              </label>
            </div>
            {useCustomLL ? (
              <input type="number" step={0.5} min={0} placeholder="LL (kN/m²)" value={customLL} onChange={(e) => setCustomLL(e.target.value)} className="w-full" />
            ) : (
              <select className="w-full" value={selectedOccupancy.occupancy} onChange={(e) => {
                const o = OCCUPANCY_LOADS.find((x) => x.occupancy === e.target.value); if (o) setSelectedOccupancy(o);
              }}>
                {OCCUPANCY_LOADS.map((o) => (<option key={o.occupancy} value={o.occupancy}>{o.occupancy} — LL = {o.ll} kN/m²</option>))}
              </select>
            )}
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>SDL</span><span className="font-bold">{sdl.toFixed(1)} kN/m²</span></div>
            <div className="flex justify-between"><span>LL</span><span className="font-bold">{ll.toFixed(1)} kN/m²</span></div>
            <div className="flex justify-between text-base pt-2 border-t border-slate-200 dark:border-slate-600">
              <span>Factored w<sub>u</sub></span>
              <span className="font-bold text-blue-700 dark:text-blue-400">{(1.2 * sdl + 1.6 * ll).toFixed(1)} kN/m²</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-header">🔗 LRFD Load Combinations</h3>
          <div className="space-y-2">
            {Object.entries(combos).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">{k}</span>
                <span className="font-bold font-mono">{r2(v, 2)} kN/m²</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3">BNBC 2020 Sec 2.3 — LRFD</p>
        </div>
      </div>

      {/* ─── Wind ─── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="card-header mb-0 pb-0 border-b-0">💨 Wind Load (BNBC 2020 Sec 2.4)</h3>
          <button onClick={() => setShowWindCalc(!showWindCalc)} className={`tab ${showWindCalc ? 'tab-active' : 'tab-inactive'}`}>
            {showWindCalc ? '● Calculated' : '○ Configure'}
          </button>
        </div>
        {showWindCalc && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="input-group"><label>Basic Wind Speed</label>
                <select value={loads.windSpeed} onChange={(e) => setLoads((p) => ({ ...p, windSpeed: Number(e.target.value) }))}>
                  {WIND_SPEED_ZONES.map((w) => (<option key={w.value} value={w.value}>{w.label}</option>))}
                </select>
              </div>
              <div className="input-group"><label>Exposure</label>
                <select value={loads.exposure} onChange={(e) => setLoads((p) => ({ ...p, exposure: e.target.value }))}>
                  {EXPOSURE_CATEGORIES.map((e) => (<option key={e.value} value={e.value}>{e.label}</option>))}
                </select>
              </div>
              <div className="input-group"><label>Topography K<sub>zt</sub></label>
                <select value={topographyKzt} onChange={(e) => setTopographyKzt(Number(e.target.value))}>
                  {TOPOGRAPHY_FACTORS.map((t) => (<option key={t.kzt} value={t.kzt}>{t.label}</option>))}
                </select>
              </div>
              <div className="input-group">
                <label>Building Height ({bh.unit})</label>
                <input type="number" step={dimUnit === 'imperial' ? 5 : 0.5} min={dimUnit === 'imperial' ? 10 : 3}
                  value={bh.val} onChange={(e) => setBuildingHeight_m(dimUnit === 'imperial' ? Number(e.target.value) * 0.3048 : Number(e.target.value))} />
              </div>
            </div>
            {windData && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-semibold mb-2">Wind Results</h4>
                {[
                  [`Kz at ${windData.height}m`, windData.Kz.toFixed(3)],
                  ['qz (velocity pressure)', `${windData.qz} N/m²`],
                  ['Windward (+0.8)', `${windData.p_windward} N/m²`, 'text-blue-700 dark:text-blue-400'],
                  ['Leeward (−0.5)', `${windData.p_leeward} N/m²`, 'text-amber-600'],
                  ['Side (−0.7)', `${windData.p_side} N/m²`, 'text-red-600'],
                ].map(([l, v, c], i) => (
                  <div key={i} className={`flex justify-between ${c || ''}`}><span>{l}</span><span className="font-mono font-bold">{v}</span></div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Seismic ─── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="card-header mb-0 pb-0 border-b-0">🌍 Seismic Load (BNBC 2020 Sec 2.5)</h3>
          <button onClick={() => setShowSeismicCalc(!showSeismicCalc)} className={`tab ${showSeismicCalc ? 'tab-active' : 'tab-inactive'}`}>
            {showSeismicCalc ? '● Calculated' : '○ Configure'}
          </button>
        </div>
        {showSeismicCalc && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ─── LEFT: Inputs ─── */}
            <div className="space-y-3">
              <div className="input-group"><label>Seismic Region</label>
                <select value={loads.seismicRegion} onChange={(e) => setLoads((p) => ({ ...p, seismicRegion: e.target.value }))}>
                  {SEISMIC_REGIONS.map((r) => (<option key={r.label} value={r.label}>{r.label}</option>))}
                </select>
              </div>

              {/* Site Class — manual or SPT-derived */}
              <div className="flex items-center justify-between">
                <label className="mb-0 font-medium text-xs text-slate-600 dark:text-slate-400">Site Class</label>
                <label className="flex items-center gap-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                  <input type="checkbox" checked={useSpt} onChange={() => setUseSpt(!useSpt)} /> Use SPT-N
                </label>
              </div>
              {useSpt ? (
                <div className="space-y-2">
                  {sptRows.map((row, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="number" className="flex-1" placeholder="Depth (m)" step={0.5} min={0.5}
                        value={row.depth} onChange={(e) => {
                          const n = [...sptRows]; n[i] = { ...n[i], depth: Number(e.target.value) }; setSptRows(n);
                        }} />
                      <input type="number" className="flex-1" placeholder="N-value" step={1} min={0} max={100}
                        value={row.nValue} onChange={(e) => {
                          const n = [...sptRows]; n[i] = { ...n[i], nValue: Number(e.target.value) }; setSptRows(n);
                        }} />
                      {sptRows.length > 1 && (
                        <button onClick={() => setSptRows(sptRows.filter((_, j) => j !== i))}
                          className="text-red-500 hover:text-red-700 text-lg leading-none px-1">×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setSptRows([...sptRows, emptySPT()])}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline">+ Add depth</button>
                  {sptResult && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      Ø N<sub>avg</sub> = {sptAvg.toFixed(0)} → <span className="underline decoration-dotted">{sptResult.siteClass}</span> ({sptResult.label})
                    </div>
                  )}
                </div>
              ) : (
                <div className="input-group">
                  <select value={loads.siteClass} onChange={(e) => setLoads((p) => ({ ...p, siteClass: e.target.value }))}>
                    {SITE_CLASSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                  </select>
                </div>
              )}

              <div className="input-group"><label>Importance I<sub>e</sub></label>
                <select value={loads.importanceFactor} onChange={(e) => setLoads((p) => ({ ...p, importanceFactor: Number(e.target.value) }))}>
                  {IMPORTANCE_FACTORS.map((f) => (<option key={f.ie} value={f.ie}>{f.label}</option>))}
                </select>
              </div>
              <div className="input-group"><label>Seismic Force-Resisting System</label>
                <select value={selectedSystem.r} onChange={(e) => {
                  const f = RESPONSE_MOD_FACTORS.find((x) => x.r === Number(e.target.value));
                  if (f) { setSelectedSystem(f); setLoads((p) => ({ ...p, rFactor: f.r })); }
                }}>
                  {RESPONSE_MOD_FACTORS.map((f) => (
                    <option key={`${f.r}-${f.label}`} value={f.r}>{f.label} — Ω₀={f.omega} C<sub>d</sub>={f.cd}</option>
                  ))}
                </select>
              </div>

              {/* Building Weight — manual or area-based */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">🏢 Building Seismic Weight (W)</label>
                <div className="flex gap-2">
                  <input type="number" step={100} min={0} className="flex-1" placeholder="W (kN)"
                    value={buildingWeight_kN} onChange={(e) => setBuildingWeight_kN(Number(e.target.value))} />
                  <span className="text-xs self-center text-slate-400">kN</span>
                </div>
                <details className="text-xs text-slate-500 dark:text-slate-400">
                  <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">Auto-calc from floor area</summary>
                  <div className="mt-2 space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <input type="number" step={10} min={0} className="flex-1" placeholder="Floor area (m²)"
                        id="floorAreaInput" />
                      <span className="text-xs self-center text-slate-400">m²</span>
                    </div>
                    <div className="flex gap-2">
                      <input type="number" step={0.5} min={0} className="flex-1" value={sdl + ll * 0.25}
                        id="seismicDLInput" placeholder="DL + 0.25LL (kN/m²)" disabled />
                      <span className="text-xs self-center text-slate-400">kN/m²</span>
                    </div>
                    <button onClick={() => {
                      const area = Number(document.getElementById('floorAreaInput').value);
                      if (area > 0) {
                        const weightPerFloor = area * (sdl + ll * 0.25);
                        const totalW = weightPerFloor * (loads.floorCount || 1);
                        setBuildingWeight_kN(Math.round(totalW));
                      }
                    }} className="btn-primary text-xs px-3 py-1.5 rounded">Calculate W</button>
                  </div>
                </details>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="input-group"><label>Floors</label>
                  <input type="number" min={1} max={50} value={loads.floorCount} onChange={(e) => setLoads((p) => ({ ...p, floorCount: Number(e.target.value) }))} />
                </div>
                <div className="input-group"><label>Floor Ht ({fh.unit})</label>
                  <input type="number" step={dimUnit === 'imperial' ? 0.5 : 0.1} min={dimUnit === 'imperial' ? 8 : 2.5}
                    value={fh.val} onChange={(e) => setLoads((p) => ({ ...p, floorHeight_m: dimUnit === 'imperial' ? Number(e.target.value) * 0.3048 : Number(e.target.value) }))} />
                </div>
              </div>
            </div>

            {/* ─── RIGHT: Results ─── */}
            {seismicData ? (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">📊 Seismic Results</h4>
                  {seismicData.sdc && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      seismicData.sdc === 'D' ? 'bg-red-100 text-red-700 dark:bg-red-800/50 dark:text-red-300' :
                      seismicData.sdc === 'C' ? 'bg-amber-100 text-amber-700 dark:bg-amber-800/50 dark:text-amber-300' :
                      'bg-green-100 text-green-700 dark:bg-green-800/50 dark:text-green-300'
                    }`}>SDC = {seismicData.sdc}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    ['Spectral', `${r2(seismicData.SDS, 3)}g / ${r2(seismicData.SD1, 3)}g`, 'SDS / SD1'],
                    ['Fa / Fv', `${r2(seismicData.Fa, 2)} / ${r2(seismicData.Fv, 2)}`],
                    ['Period Ta', `${seismicData.T} s`],
                    ['Cs (coeff.)', `${r2(seismicData.Cs, 4)}`],
                  ].map(([l, v], i) => (
                    <div key={i} className="flex justify-between border-b border-slate-200/50 dark:border-slate-600/50 pb-1">
                      <span className="text-slate-500 dark:text-slate-400">{l}</span>
                      <span className="font-mono font-bold">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-lg pt-2 mt-1 border-t border-slate-200 dark:border-slate-600">
                  <span className="font-bold">Base Shear V</span>
                  <span className="font-bold text-red-700 dark:text-red-400">{r2(seismicData.V, 0)} kN</span>
                </div>
                <hr className="border-slate-200 dark:border-slate-600" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div><span className="text-slate-400">R</span> <span className="font-bold">{selectedSystem.r}</span></div>
                  <div><span className="text-slate-400">Ω₀</span> <span className="font-bold">{seismicData.omega}</span></div>
                  <div><span className="text-slate-400">C<sub>d</sub></span> <span className="font-bold">{seismicData.cd}</span></div>
                  <div><span className="text-slate-400">I<sub>e</sub></span> <span className="font-bold">{loads.importanceFactor}</span></div>
                  <div><span className="text-slate-400">W</span> <span className="font-bold">{r2(buildingWeight_kN, 0)} kN</span></div>
                  <div><span className="text-slate-400">h<sub>n</sub></span> <span className="font-bold">{seismicData.hn} m</span></div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-8 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                Configure seismic inputs on the left, then click "● Calculated" to see parameters
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
