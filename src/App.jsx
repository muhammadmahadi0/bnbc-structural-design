import React, { useState, createContext, useContext } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MaterialSelector from './components/MaterialSelector';
import LoadCalculator from './components/LoadCalculator';
import SlabDesign from './components/SlabDesign';
import BeamDesign from './components/BeamDesign';
import ColumnDesign from './components/ColumnDesign';
import RebarDetailing from './components/RebarDetailing';

// ── Global App State ─────────────────────────────────
export const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [materials, setMaterials] = useState({
    fc: 27.6,        // C28 — 4000 psi
    fy: 420,          // GR-420
    cover: 30,        // mm
    concreteLabel: 'C-28 / 4000 psi',
    steelLabel: 'GR-420 (420 MPa) — 60ksi',
    coverLabel: 'Beam — 30 mm (interior)',
  });

  const [loads, setLoads] = useState({
    dl: 0, sdl: 0, ll: 0,
    windSpeed: 160,
    exposure: 'C',
    seismicRegion: 'Dhaka / Narayanganj / Gazipur',
    siteClass: 'SD',
    importanceFactor: 1.0,
    rFactor: 5,
    floorHeight_m: 3.0,
    floorCount: 5,
  });

  const value = { activeTab, setActiveTab, materials, setMaterials, loads, setLoads };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'materials': return <MaterialSelector />;
      case 'loads': return <LoadCalculator />;
      case 'slab': return <SlabDesign />;
      case 'beam': return <BeamDesign />;
      case 'column': return <ColumnDesign />;
      case 'rebar': return <RebarDetailing />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppContext.Provider value={value}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </AppContext.Provider>
  );
}
