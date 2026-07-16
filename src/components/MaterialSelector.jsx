import React from 'react';
import { t } from '../utils/translations';
import { useApp, mpaToPsi, mpaToKsi, dimDisplay } from '../App';
import { CONCRETE_GRADES, STEEL_GRADES, COVER_OPTIONS } from '../utils/bnbcData';
import { Ec, beta1 } from '../utils/structuralMath';

export default function MaterialSelector() {
  const { materials, setMaterials, stressUnit, toggleStressUnit, dimUnit, lang } = useApp();
  const { fc, fy, cover } = materials;

  const handleChange = (field, value) => setMaterials((prev) => ({ ...prev, [field]: value }));

  const ec = Ec(fc);
  const b1 = beta1(fc);
  const fr = 0.62 * Math.sqrt(fc);

  const fcDisp = stressUnit === 'psi' ? mpaToPsi(fc) : fc;
  const fyDisp = stressUnit === 'psi' ? mpaToPsi(fy) : fy;
  const sUnit = stressUnit === 'psi' ? 'psi' : 'MPa';
  const cv = dimDisplay(cover, dimUnit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('mat.title', lang)}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">BNBC 2020 / ACI 318-19 material properties</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={toggleStressUnit}
            className="px-3 py-2 rounded-lg text-xs font-medium transition bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">
            Stress: <strong>{stressUnit === 'mpa' ? 'MPa' : 'psi'}</strong> ↻
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Concrete */}
        <div className="card">
          <h3 className="card-header">🟤 Concrete Properties</h3>
          <div className="space-y-4">
            <div className="input-group">
              <label>Concrete Grade (f'c)</label>
              <select value={fc} onChange={(e) => {
                const g = CONCRETE_GRADES.find((x) => x.fc === Number(e.target.value));
                handleChange('fc', Number(e.target.value)); handleChange('concreteLabel', g?.label || '');
              }}>
                {CONCRETE_GRADES.map((g) => (
                  <option key={g.fc} value={g.fc}>{g.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                <strong>{fc} MPa</strong> = <strong>{mpaToPsi(fc)} psi</strong> = <strong>{mpaToKsi(fc)} ksi</strong>
              </p>
            </div>
            <div className="input-group">
              <label>Custom f'c ({sUnit})</label>
              <input type="number" min={stressUnit === 'psi' ? 2000 : 10} max={stressUnit === 'psi' ? 9000 : 60}
                step={stressUnit === 'psi' ? 100 : 0.5} value={fcDisp}
                onChange={(e) => handleChange('fc', stressUnit === 'psi' ? Number(e.target.value) / 145.038 : Number(e.target.value))} />
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Derived Properties</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500 dark:text-slate-400">Ec</span><p className="font-mono font-bold">{ec.toFixed(0)} MPa</p><p className="text-[10px] text-slate-400">{(ec / 1000).toFixed(1)} GPa</p></div>
                <div><span className="text-slate-500 dark:text-slate-400">β₁</span><p className="font-mono font-bold">{b1.toFixed(3)}</p></div>
                <div><span className="text-slate-500 dark:text-slate-400">√f'c</span><p className="font-mono font-bold">{Math.sqrt(fc).toFixed(2)}</p><p className="text-[10px] text-slate-400">{(Math.sqrt(fc * 145.038)).toFixed(0)} √psi</p></div>
                <div><span className="text-slate-500 dark:text-slate-400">fr</span><p className="font-mono font-bold">{fr.toFixed(2)} MPa</p><p className="text-[10px] text-slate-400">{(fr * 145.038).toFixed(1)} psi</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Steel */}
        <div className="card">
          <h3 className="card-header">⚙️ Steel Reinforcement Properties</h3>
          <div className="space-y-4">
            <div className="input-group">
              <label>Steel Grade (fy)</label>
              <select value={fy} onChange={(e) => {
                const g = STEEL_GRADES.find((x) => x.fy === Number(e.target.value));
                handleChange('fy', Number(e.target.value)); handleChange('steelLabel', g?.label || '');
              }}>
                {STEEL_GRADES.map((g) => (
                  <option key={g.fy} value={g.fy}>{g.label} ({mpaToPsi(g.fy)} psi / {mpaToKsi(g.fy)} ksi)</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                <strong>{fy} MPa</strong> = <strong>{mpaToPsi(fy)} psi</strong> = <strong>{mpaToKsi(fy)} ksi</strong>
              </p>
            </div>
            <div className="input-group">
              <label>Custom fy ({sUnit})</label>
              <input type="number" min={stressUnit === 'psi' ? 40000 : 200} max={stressUnit === 'psi' ? 100000 : 700}
                step={stressUnit === 'psi' ? 1000 : 10} value={fyDisp}
                onChange={(e) => handleChange('fy', stressUnit === 'psi' ? Number(e.target.value) / 145.038 : Number(e.target.value))} />
            </div>
            <div className="input-group">
              <label>Clear Cover ({cv.unit})</label>
              <div className="flex gap-2">
                <input type="number" step={dimUnit === 'imperial' ? 0.25 : 5} min={dimUnit === 'imperial' ? 0.5 : 10} max={dimUnit === 'imperial' ? 4 : 100}
                  value={cv.val} className="flex-1"
                  onChange={(e) => handleChange('cover', dimUnit === 'imperial' ? Number(e.target.value) * 25.4 : Number(e.target.value))} />
                <span className="text-sm text-slate-500 dark:text-slate-400 self-center font-mono w-10">{cv.unit}</span>
              </div>
              <select className="w-full mt-1" value={cover} onChange={(e) => {
                const o = COVER_OPTIONS.find((c) => c.value === Number(e.target.value));
                handleChange('cover', Number(e.target.value)); handleChange('coverLabel', o?.label || '');
              }}>
                {COVER_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Steel Properties</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500 dark:text-slate-400">Es</span><p className="font-mono font-bold">200,000 MPa</p><p className="text-[10px] text-slate-400">29,000 ksi</p></div>
                <div><span className="text-slate-500 dark:text-slate-400">εy</span><p className="font-mono font-bold">{(fy / 200000).toFixed(4)}</p></div>
                <div><span className="text-slate-500 dark:text-slate-400">Density</span><p className="font-mono font-bold">78.5 kN/m³</p><p className="text-[10px] text-slate-400">490 lb/ft³</p></div>
                <div><span className="text-slate-500 dark:text-slate-400">Mass</span><p className="font-mono font-bold">7,850 kg/m³</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="card-header">📋 Material Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="stat-box">
            <p className="result-label">Concrete</p>
            <p className="text-lg font-bold">f'c = {fc} MPa</p>
            <p className="text-xs text-slate-400">= {mpaToPsi(fc)} psi / {mpaToKsi(fc)} ksi</p>
            <p className="text-xs text-slate-500">Ec = {ec.toFixed(0)} MPa · β₁ = {b1.toFixed(3)}</p>
          </div>
          <div className="stat-box">
            <p className="result-label">Steel</p>
            <p className="text-lg font-bold">fy = {fy} MPa</p>
            <p className="text-xs text-slate-400">= {mpaToPsi(fy)} psi / {mpaToKsi(fy)} ksi</p>
            <p className="text-xs text-slate-500">Es = 200 GPa · εy = {(fy / 200000).toFixed(4)}</p>
          </div>
          <div className="stat-box">
            <p className="result-label">Cover</p>
            <p className="text-lg font-bold">{cover} mm</p>
            <p className="text-xs text-slate-400">= {(cover / 25.4).toFixed(2)} in</p>
            <p className="text-xs text-slate-500">Per BNBC 2020 Table 6.2.6</p>
          </div>
        </div>
      </div>
    </div>
  );
}
