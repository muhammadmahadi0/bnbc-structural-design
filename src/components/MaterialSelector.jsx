import React from 'react';
import { useApp } from '../App';
import { CONCRETE_GRADES, STEEL_GRADES, COVER_OPTIONS } from '../utils/bnbcData';
import { Ec, beta1 } from '../utils/structuralMath';

export default function MaterialSelector() {
  const { materials, setMaterials } = useApp();
  const { fc, fy, cover } = materials;

  const handleChange = (field, value) => {
    setMaterials((prev) => ({ ...prev, [field]: value }));
  };

  // Compute derived properties live
  const ec = Ec(fc);
  const b1 = beta1(fc);
  const ec_48 = 4700 * Math.sqrt(27.6);
  const fy_si = fy;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">🧱 Material Selection</h2>
        <p className="text-slate-500 mt-1">BNBC 2020 / ACI 318-19 material properties</p>
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
                {CONCRETE_GRADES.map((g) => (
                  <option key={g.fc} value={g.fc}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Custom f'c (MPa)</label>
              <input
                type="number"
                min={10}
                max={60}
                step={0.5}
                value={fc}
                onChange={(e) => handleChange('fc', Number(e.target.value))}
              />
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Derived Properties</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Modulus E<sub>c</sub></span>
                  <p className="font-mono font-bold">{ec.toFixed(0)} MPa</p>
                </div>
                <div>
                  <span className="text-slate-500">β<sub>1</sub></span>
                  <p className="font-mono font-bold">{b1.toFixed(3)}</p>
                </div>
                <div>
                  <span className="text-slate-500">√f'c</span>
                  <p className="font-mono font-bold">{Math.sqrt(fc).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Modulus of rupture f<sub>r</sub></span>
                  <p className="font-mono font-bold">{(0.62 * Math.sqrt(fc)).toFixed(2)} MPa</p>
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
                {STEEL_GRADES.map((g) => (
                  <option key={g.fy} value={g.fy}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Custom f<sub>y</sub> (MPa)</label>
              <input
                type="number"
                min={200}
                max={700}
                step={10}
                value={fy}
                onChange={(e) => handleChange('fy', Number(e.target.value))}
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

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Steel Properties</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">E<sub>s</sub></span>
                  <p className="font-mono font-bold">200,000 MPa</p>
                </div>
                <div>
                  <span className="text-slate-500">ε<sub>y</sub> (fy/Es)</span>
                  <p className="font-mono font-bold">{(fy_si / 200000).toFixed(4)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Density</span>
                  <p className="font-mono font-bold">78.5 kN/m³</p>
                </div>
                <div>
                  <span className="text-slate-500">Unit mass</span>
                  <p className="font-mono font-bold">7,850 kg/m³</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Material Summary Card */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="card-header">📋 Material Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="stat-box">
            <p className="result-label">Concrete</p>
            <p className="text-lg font-bold text-slate-800">f'c = {fc} MPa</p>
            <p className="text-xs text-slate-500">E<sub>c</sub> = {ec.toFixed(0)} MPa · β₁ = {b1.toFixed(3)}</p>
          </div>
          <div className="stat-box">
            <p className="result-label">Steel</p>
            <p className="text-lg font-bold text-slate-800">fy = {fy} MPa</p>
            <p className="text-xs text-slate-500">Es = 200 GPa · ε<sub>y</sub> = {(fy / 200000).toFixed(4)}</p>
          </div>
          <div className="stat-box">
            <p className="result-label">Cover</p>
            <p className="text-lg font-bold text-slate-800">{cover} mm</p>
            <p className="text-xs text-slate-500">Per BNBC 2020 Table 6.2.6</p>
          </div>
        </div>
      </div>
    </div>
  );
}
