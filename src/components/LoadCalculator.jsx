import React, { useState } from 'react';
import { useApp } from '../App';
import {
  OCCUPANCY_LOADS, FINISH_LOADS, PARTITION_LOADS,
  WIND_SPEED_ZONES, EXPOSURE_CATEGORIES,
  SEISMIC_REGIONS, SITE_CLASSES, IMPORTANCE_FACTORS,
  RESPONSE_MOD_FACTORS, KZ_TABLE, GUST_FACTOR,
  getFa, getFv, TOPOGRAPHY_FACTORS,
} from '../utils/bnbcData';
import { factoredLoad, windDesignPressure, interpolateKz, seismicDesignParams, seismicBaseShear, approxPeriod } from '../utils/structuralMath';

const r2 = (v, n = 2) => (v !== undefined && isFinite(v) ? Math.round(v * 10 ** n) / 10 ** n : 0);

export default function LoadCalculator() {
  const { loads, setLoads } = useApp();

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

  const sdl = finishLoad + partitionLoad;
  const ll = useCustomLL ? Number(customLL) || 0 : selectedOccupancy.ll;

  React.useEffect(() => {
    setLoads((prev) => ({ ...prev, sdl, ll }));
  }, [sdl, ll]);

  // ── Wind ──
  const computeWind = () => {
    const expTable = KZ_TABLE[loads.exposure] || KZ_TABLE.C;
    const Kz = interpolateKz(expTable, buildingHeight_m);
    const V = loads.windSpeed;
    const qz = 0.613 * Kz * topographyKzt * 0.85 * (V / 3.6) * (V / 3.6) * 1.0;
    return {
      V, Kz,
      qz: r2(qz, 1),
      p_windward: r2(windDesignPressure(qz, GUST_FACTOR, 0.80, qz, 0.18), 1),
      p_leeward: r2(windDesignPressure(qz, GUST_FACTOR, -0.50, qz, 0.18), 1),
      p_side: r2(windDesignPressure(qz, GUST_FACTOR, -0.70, qz, 0.18), 1),
      height: buildingHeight_m,
    };
  };

  // ── Seismic ──
  const computeSeismic = () => {
    const region = SEISMIC_REGIONS.find((r) => r.label === loads.seismicRegion);
    if (!region) return null;
    const Fa = getFa(loads.siteClass, region.ss);
    const Fv = getFv(loads.siteClass, region.s1);
    const params = seismicDesignParams(Fa, region.ss, Fv, region.s1);
    const hn = loads.floorCount * loads.floorHeight_m;
    const T = approxPeriod(hn, 'frame');
    const baseShear = seismicBaseShear(params.SDS, params.SD1, loads.rFactor, loads.importanceFactor, buildingWeight_kN, T);
    return { region, Fa, Fv, ...params, hn, T: r2(T, 3), ...baseShear };
  };

  const windData = showWindCalc ? computeWind() : null;
  const seismicData = showSeismicCalc ? computeSeismic() : null;
  const combos = factoredLoad(0, sdl, ll, windData?.p_windward || 0, seismicData?.V || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">⚖️ Load Calculator</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Dead, Live, Wind & Seismic loads per BNBC 2020</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SDL / LL */}
        <div className="card">
          <h3 className="card-header">📦 Super Dead Load & Live Load</h3>

          <div className="mb-4">
            <label>Floor Finish Load (kN/m²)</label>
            <div className="flex gap-2">
              <select className="flex-1" value={finishLoad} onChange={(e) => {
                const val = e.target.value; if (val === 'custom') return; setFinishLoad(Number(val));
              }}>
                {FINISH_LOADS.map((f) => (
                  <option key={f.label} value={f.load}>{f.label}</option>
                ))}
              </select>
              <input type="number" className="w-24" step={0.1} min={0} value={finishLoad} onChange={(e) => setFinishLoad(Number(e.target.value))} />
            </div>
          </div>

          <div className="mb-4">
            <label>Partition Wall Load (kN/m²)</label>
            <div className="flex gap-2">
              <select className="flex-1" value={partitionLoad} onChange={(e) => {
                const val = e.target.value; if (val === 'custom') return; setPartitionLoad(Number(val));
              }}>
                {PARTITION_LOADS.map((p) => (
                  <option key={p.label} value={p.load}>{p.label}</option>
                ))}
              </select>
              <input type="number" className="w-24" step={0.1} min={0} value={partitionLoad} onChange={(e) => setPartitionLoad(Number(e.target.value))} />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label>Occupancy / Live Load</label>
              <label className="flex items-center gap-2 text-xs font-normal text-slate-600 dark:text-slate-400">
                <input type="checkbox" checked={useCustomLL} onChange={() => setUseCustomLL(!useCustomLL)} />
                Custom LL
              </label>
            </div>
            {useCustomLL ? (
              <input type="number" step={0.5} min={0} placeholder="Enter LL (kN/m²)" value={customLL} onChange={(e) => setCustomLL(e.target.value)} className="w-full" />
            ) : (
              <select className="w-full" value={selectedOccupancy.occupancy} onChange={(e) => {
                const occ = OCCUPANCY_LOADS.find((o) => o.occupancy === e.target.value);
                if (occ) setSelectedOccupancy(occ);
              }}>
                {OCCUPANCY_LOADS.map((o) => (
                  <option key={o.occupancy} value={o.occupancy}>{o.occupancy} — LL = {o.ll} kN/m²</option>
                ))}
              </select>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Super Dead Load (SDL)</span><span className="font-bold">{sdl.toFixed(1)} kN/m²</span></div>
            <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Live Load (LL)</span><span className="font-bold">{ll.toFixed(1)} kN/m²</span></div>
            <div className="flex justify-between text-base pt-2 border-t border-slate-200 dark:border-slate-600">
              <span className="text-slate-700 dark:text-slate-300">Factored w<sub>u</sub> = 1.2D + 1.6L</span>
              <span className="font-bold text-blue-700 dark:text-blue-400">{(1.2 * sdl + 1.6 * ll).toFixed(1)} kN/m²</span>
            </div>
          </div>
        </div>

        {/* Load Combos */}
        <div className="card">
          <h3 className="card-header">🔗 LRFD Load Combinations</h3>
          <div className="space-y-2">
            {Object.entries(combos).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">{key}</span>
                <span className="font-bold font-mono">{r2(val, 2)} kN/m²</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3">BNBC 2020 Sec 2.3 — LRFD load combinations</p>
        </div>
      </div>

      {/* ── Wind Load ── */}
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
              <div className="input-group">
                <label>Basic Wind Speed</label>
                <select value={loads.windSpeed} onChange={(e) => setLoads((p) => ({ ...p, windSpeed: Number(e.target.value) }))}>
                  {WIND_SPEED_ZONES.map((w) => (<option key={w.value} value={w.value}>{w.label}</option>))}
                </select>
              </div>
              <div className="input-group">
                <label>Exposure Category</label>
                <select value={loads.exposure} onChange={(e) => setLoads((p) => ({ ...p, exposure: e.target.value }))}>
                  {EXPOSURE_CATEGORIES.map((e) => (<option key={e.value} value={e.value}>{e.label}</option>))}
                </select>
              </div>
              <div className="input-group">
                <label>Topography K<sub>zt</sub></label>
                <select value={topographyKzt} onChange={(e) => setTopographyKzt(Number(e.target.value))}>
                  {TOPOGRAPHY_FACTORS.map((t) => (<option key={t.kzt} value={t.kzt}>{t.label}</option>))}
                </select>
              </div>
              <div className="input-group">
                <label>Building Height (m)</label>
                <input type="number" step={0.5} min={3} value={buildingHeight_m} onChange={(e) => setBuildingHeight_m(Number(e.target.value))} />
              </div>
            </div>
            {windData && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Wind Pressure Results</h4>
                {[
                  [`Kz at ${windData.height}m`, windData.Kz.toFixed(3)],
                  ['qz (velocity pressure)', `${windData.qz} N/m²`],
                  ['Windward (+0.8) p', `${windData.p_windward} N/m²`, 'text-blue-700 dark:text-blue-400'],
                  ['Leeward (−0.5) p', `${windData.p_leeward} N/m²`, 'text-amber-600 dark:text-amber-400'],
                  ['Side (−0.7) p', `${windData.p_side} N/m²`, 'text-red-600 dark:text-red-400'],
                ].map(([l, v, c], i) => (
                  <div key={i} className={`flex justify-between ${c || ''}`}>
                    <span dangerouslySetInnerHTML={{ __html: l }} /><span className="font-mono font-bold">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Seismic Load ── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="card-header mb-0 pb-0 border-b-0">🌍 Seismic Load (BNBC 2020 Sec 2.5)</h3>
          <button onClick={() => setShowSeismicCalc(!showSeismicCalc)} className={`tab ${showSeismicCalc ? 'tab-active' : 'tab-inactive'}`}>
            {showSeismicCalc ? '● Calculated' : '○ Configure'}
          </button>
        </div>

        {showSeismicCalc && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="input-group">
                <label>Seismic Region</label>
                <select value={loads.seismicRegion} onChange={(e) => setLoads((p) => ({ ...p, seismicRegion: e.target.value }))}>
                  {SEISMIC_REGIONS.map((r) => (<option key={r.label} value={r.label}>{r.label} (Ss={r.ss}, S1={r.s1})</option>))}
                </select>
              </div>
              <div className="input-group">
                <label>Site Class</label>
                <select value={loads.siteClass} onChange={(e) => setLoads((p) => ({ ...p, siteClass: e.target.value }))}>
                  {SITE_CLASSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </div>
              <div className="input-group">
                <label>Importance I<sub>e</sub></label>
                <select value={loads.importanceFactor} onChange={(e) => setLoads((p) => ({ ...p, importanceFactor: Number(e.target.value) }))}>
                  {IMPORTANCE_FACTORS.map((f) => (<option key={f.ie} value={f.ie}>{f.label}</option>))}
                </select>
              </div>
              <div className="input-group">
                <label>Response Mod (R)</label>
                <select value={loads.rFactor} onChange={(e) => setLoads((p) => ({ ...p, rFactor: Number(e.target.value) }))}>
                  {RESPONSE_MOD_FACTORS.map((f) => (<option key={f.r} value={f.r}>{f.label}</option>))}
                </select>
              </div>
              <div className="input-group">
                <label>Building Weight W (kN)</label>
                <input type="number" step={100} min={100} value={buildingWeight_kN} onChange={(e) => setBuildingWeight_kN(Number(e.target.value))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label>Floors</label>
                  <input type="number" min={1} max={50} value={loads.floorCount} onChange={(e) => setLoads((p) => ({ ...p, floorCount: Number(e.target.value) }))} />
                </div>
                <div className="input-group">
                  <label>Floor Ht (m)</label>
                  <input type="number" step={0.1} min={2.5} value={loads.floorHeight_m} onChange={(e) => setLoads((p) => ({ ...p, floorHeight_m: Number(e.target.value) }))} />
                </div>
              </div>
            </div>
            {seismicData && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Seismic Results</h4>
                {[
                  ['SMS = Fa × Ss', `${r2(seismicData.SMS, 3)}g`],
                  ['SM1 = Fv × S1', `${r2(seismicData.SM1, 3)}g`],
                  ['SDS = (⅔)SMS', `${r2(seismicData.SDS, 3)}g`, 'text-blue-700 dark:text-blue-400 font-bold'],
                  ['SD1 = (⅔)SM1', `${r2(seismicData.SD1, 3)}g`],
                  ['Fa / Fv', `${r2(seismicData.Fa, 2)} / ${r2(seismicData.Fv, 2)}`],
                  ['Period Ta', `${r2(seismicData.T, 3)} s`],
                  ['Cs (seismic coeff.)', `${r2(seismicData.Cs, 4)}`],
                ].map(([l, v, c], i) => (
                  <div key={i} className={`flex justify-between ${c || ''}`}>
                    <span dangerouslySetInnerHTML={{ __html: l }} /><span className="font-mono font-bold">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between text-lg border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Base Shear V</span>
                  <span className="font-bold text-red-700 dark:text-red-400">{r2(seismicData.V, 0)} kN</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
