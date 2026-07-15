import React from 'react';
import { useApp } from '../App';

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
  const { activeTab, setActiveTab, materials } = useApp();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏗️</span>
          <div>
            <h1 className="font-bold text-base leading-tight">BNBC 2020</h1>
            <p className="text-xs text-slate-400">Structural Design Suite</p>
          </div>
        </div>
      </div>

      {/* Current Materials */}
      <div className="px-5 py-3 border-b border-slate-700 bg-slate-800/50">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Current Materials</p>
        <p className="text-xs font-mono text-emerald-300">f'c = {materials.fc} MPa</p>
        <p className="text-xs font-mono text-amber-300">fy = {materials.fy} MPa</p>
        <p className="text-xs font-mono text-slate-400">Cover = {materials.cover} mm</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm flex items-center gap-3 ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.label.split(' ')[0]}</span>
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-[10px] text-slate-400">{item.desc}</p>
            </div>
          </button>
        ))}
      </nav>

      {/* BNBC Reference */}
      <div className="px-5 py-4 border-t border-slate-700 text-[10px] text-slate-500">
        BNBC 2020 · ACI 318-19 Compliant
        <br />
        Bangladesh National Building Code
      </div>
    </aside>
  );
}
