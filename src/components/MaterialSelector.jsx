import React from 'react';
import { useApp, mpaToPsi, mpaToKsi } from '../App';
import { CONCRETE_GRADES, STEEL_GRADES, COVER_OPTIONS } from '../utils/bnbcData';
import { Ec, beta1 } from '../utils/structuralMath';

export default function MaterialSelector() {
  const { materials, setMaterials, unitSystem, toggleUnit } = useApp();
  const { fc, fy, cover } = materials;

  const handleChange = (field, value) => {
    setMaterials((prev) => ({ ...prev, [field]: value }));
  };

  const ec = Ec(fc);
  const b1 = beta1(fc);
  const fr = 0.62 * Math.sqrt(fc);

  const fcDisplay = unitSystem === 'psi' ? mpaToPsi(fc) : fc;
  const fyDisplay = unitSystem === 'psi' ? mpaToPsi(fy) : fy;
  const fcUnit = unitSystem === 'psi' ? 'psi' : 'MPa';
  const fyUnit = unitSystem === 'psi' ? 'psi' : 'MPa';

  // Build concrete options with dual-unit labels
  const concreteOptions = CONCRETE_GRADES.map((g) => ({
    ...g,
    label: `${g.label} (${mpaToPsi(g.fc)} psi)`,
  }));

  const steelOptions = STEEL_GRADES.map((g) => ({
    ...g,
    label: `${g.label} (${mpaToPsi(g.fy)} psi / ${mpaToKsi(g.fy)} ksi)`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🧱 Material Selection</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">BNBC 2020 / ACI 318-19 material properties</p>
        </div>
        <button
          onClick={toggleUnit}
          className="px-4 py-2 rounded-lg text-sm font-medium transition bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 self-start"
        >
          Display: <strong>{unitSystem === 'mpa' ? 'MPa' : 'psi / ksi'}</strong> ↻
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Concrete ── */}
        <div className="card">
          <h3 className="card-header">🟤 Concrete Properties</h3>
          <div className="space-y-4">
            <div className="input-group">
              <label>Concrete Grade (f'c)</label>
              <select
                value={fc}
                onChange={(e) => {
                  const grade = CONCRETE_GRADES.find((g) => g.fc === Number(e.target.value));
                  handleChange('fc', Number(e.target.value));
                  handleChange('concreteLabel', grade?.label || '');
                }}
              >
                {concreteOptions.map((g) => (
                  <option key={g.fc} value={g.fc}>{g.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Current: <strong>{fc} MPa</strong> = <strong>{mpaToPsi(fc)} psi</strong> = <strong>{mpaToKsi(fc)} ksi</strong>
              </p>
            </div>

            <div className="input-group">
              <label>Custom f'c ({fcUnit})</label>
              <input
                type="number"
                min={unitSystem === 'psi' ? 2000 : 10}
                max={unitSystem === 'psi' ? 9000 : 60}
                step={unitSystem === 'psi' ? 100 : 0.5}
                value={fcDisplay}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  handleChange('fc', unitSystem === 'psi' ? v / 145.038 : v);
                }}
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Derived Properties</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Modulus E<sub>c</sub></span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{ec.toFixed(0)} MPa</p>
                  <p className="text-[10px] text-slate-400">{(ec / 1000).toFixed(1)} GPa</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">β<sub>1</sub></span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{b1.toFixed(3)}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">√f'c</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{Math.sqrt(fc).toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400">{(Math.sqrt(fc * 145.038)).toFixed(0)} √psi</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Modulus of rupture f<sub>r</sub></span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{fr.toFixed(2)} MPa</p>
                  <p className="text-[10px] text-slate-400">{(fr * 145.038).toFixed(1)} psi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Steel ── */}
        <div className="card">
          <h3 className="card-header">⚙️ Steel Reinforcement Properties</h3>
          <div className="space-y-4">
            <div className="input-group">
              <label>Steel Grade (f<sub>y</sub>)</label>
              <select
                value={fy}
                onChange={(e) => {
                  const grade = STEEL_GRADES.find((g) => g.fy === Number(e.target.value));
                  handleChange('fy', Number(e.target.value));
                  handleChange('steelLabel', grade?.label || '');
                }}
              >
                {steelOptions.map((g) => (
                  <option key={g.fy} value={g.fy}>{g.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Current: <strong>{fy} MPa</strong> = <strong>{mpaToPsi(fy)} psi</strong> = <strong>{mpaToKsi(fy)} ksi</strong>
              </p>
            </div>

            <div className="input-group">
              <label>Custom f<sub>y</sub> ({fyUnit})</label>
              <input
                type="number"
                min={unitSystem === 'psi' ? 40000 : 200}
                max={unitSystem === 'psi' ? 100000 : 700}
                step={unitSystem === 'psi' ? 1000 : 10}
                value={fyDisplay}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  handleChange('fy', unitSystem === 'psi' ? v / 145.038 : v);
                }}
              />
            </div>

            <div className="input-group">
              <label>Clear Cover</label>
              <select
                value={cover}
                onChange={(e) => {
                  const opt = COVER_OPTIONS.find((c) => c.value === Number(e.target.value));
                  handleChange('cover', Number(e.target.value));
                  handleChange('coverLabel', opt?.label || '');
                }}
              >
                {COVER_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Steel Properties</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">E<sub>s</sub></span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">200,000 MPa</p>
                  <p className="text-[10px] text-slate-400">29,000 ksi</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">ε<sub>y</sub> (fy/Es)</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{(fy / 200000).toFixed(4)}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Density</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">78.5 kN/m³</p>
                  <p className="text-[10px] text-slate-400">490 lb/ft³</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Mass</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">7,850 kg/m³</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Material Summary Card */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="card-header">📋 Material Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="stat-box">
            <p className="result-label">Concrete</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">f'c = {fc} MPa</p>
            <p className="text-xs text-slate-400">= {mpaToPsi(fc)} psi / {mpaToKsi(fc)} ksi</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">E<sub>c</sub> = {ec.toFixed(0)} MPa · β₁ = {b1.toFixed(3)}</p>
          </div>
          <div className="stat-box">
            <p className="result-label">Steel</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">fy = {fy} MPa</p>
            <p className="text-xs text-slate-400">= {mpaToPsi(fy)} psi / {mpaToKsi(fy)} ksi</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Es = 200 GPa · ε<sub>y</sub> = {(fy / 200000).toFixed(4)}</p>
          </div>
          <div className="stat-box">
            <p className="result-label">Cover</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{cover} mm</p>
            <p className="text-xs text-slate-400">= {(cover / 25.4).toFixed(2)} in</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Per BNBC 2020 Table 6.2.6</p>
          </div>
        </div>
      </div>
    </div>
  );
}
