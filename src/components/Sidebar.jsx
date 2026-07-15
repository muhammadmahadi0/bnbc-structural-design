import React from 'react';
import { useApp, dimDisplay, spanDisplay } from '../App';

const NAV_ITEMS = [
  { id: 'dashboard', label: '📊 Dashboard', desc: 'Project overview' },
  { id: 'materials', label: '🧱 Materials', desc: 'Concrete & Steel' },
  { id: 'loads', label: '⚖️  Loads', desc: 'DL, LL, Wind, Seismic' },
  { id: 'slab', label: '🏛️  Slab Design', desc: 'Thickness & Rebar' },
  { id: 'beam', label: '📐 Beam Design', desc: 'Flexure & Shear' },
  { id: 'column', label: '🏗️  Column Design', desc: 'Axial & Biaxial' },
  { id: 'rebar', label: '🔄 Rebar Detailing', desc: 'Scheduling & Qty' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, materials, mobileSidebar, setMobileSidebar,
          stressUnit, toggleStressUnit, dimUnit, toggleDimUnit } = useApp();
  const { fc, fy, cover } = materials;

  const fcDisp = stressUnit === 'psi' ? `${Math.round(fc * 145.038)} psi` : `${fc} MPa`;
  const fyDisp = stressUnit === 'psi' ? `${Math.round(fy * 145.038)} psi` : `${fy} MPa`;
  const cv = dimDisplay(cover, dimUnit);

  return (
    <aside className="h-full w-72 bg-slate-900 dark:bg-slate-950 text-white flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-slate-700 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏗️</span>
            <div>
              <h1 className="font-bold text-base leading-tight">BNBC 2020</h1>
              <p className="text-[10px] text-slate-400">Structural Design Suite</p>
            </div>
          </div>
          {mobileSidebar !== undefined && (
            <button onClick={() => setMobileSidebar?.(false)}
              className="md:hidden p-1 text-slate-400 hover:text-white" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Current Materials */}
      <div className="px-5 py-3 border-b border-slate-700 dark:border-slate-800 bg-slate-800/50">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Materials & Units</p>
        <p className="text-xs font-mono text-emerald-300">f'c = {fcDisp}</p>
        <p className="text-xs font-mono text-amber-300">fy = {fyDisp}</p>
        <p className="text-xs font-mono text-slate-400">Cover = {cv.val} {cv.unit}</p>
        <div className="flex gap-1 mt-2">
          <button onClick={toggleStressUnit}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition">
            {stressUnit === 'mpa' ? '→ psi' : '→ MPa'}
          </button>
          <button onClick={toggleDimUnit}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition">
            {dimUnit === 'metric' ? '→ ft/in' : '→ mm/m'}
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm flex items-center gap-3 ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}>
            <span className="text-lg shrink-0">{item.label.split(' ')[0]}</span>
            <div className="min-w-0">
              <p className="font-medium truncate">{item.label}</p>
              <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
            </div>
          </button>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-slate-700 dark:border-slate-800 text-[10px] text-slate-500">
        BNBC 2020 · ACI 318-19 Compliant<br />Bangladesh National Building Code
      </div>
    </aside>
  );
}
