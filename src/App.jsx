import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MaterialSelector from './components/MaterialSelector';
import LoadCalculator from './components/LoadCalculator';
import SlabDesign from './components/SlabDesign';
import BeamDesign from './components/BeamDesign';
import ColumnDesign from './components/ColumnDesign';
import RebarDetailing from './components/RebarDetailing';

// ── Stress Units (MPa ↔ psi/ksi) ─────────────────────
export const mpaToPsi = (v) => Math.round(v * 145.038);
export const mpaToKsi = (v) => (v / 6.89476).toFixed(1);
export const psiToMpa = (v) => v / 145.038;
export const ksiToMpa = (v) => v * 6.89476;

// ── Dimension Units (mm ↔ in, m ↔ ft) ────────────────
export const mmToIn = (mm) => mm / 25.4;
export const inToMm = (inch) => inch * 25.4;
export const mToFt = (m) => m / 0.3048;
export const ftToM = (ft) => ft * 0.3048;
export const m3ToFt3 = (m3) => m3 * 35.315;
export const kgToLb = (kg) => kg * 2.20462;

// Display helpers — returns object { val, unit }
export function dimDisplay(mm, dimUnit) {
  if (dimUnit === 'imperial') return { val: +(mm / 25.4).toFixed(2), unit: 'in' };
  return { val: mm, unit: 'mm' };
}
export function spanDisplay(m, dimUnit) {
  if (dimUnit === 'imperial') return { val: +(m / 0.3048).toFixed(2), unit: 'ft' };
  return { val: m, unit: 'm' };
}
export function volDisplay(m3, dimUnit) {
  if (dimUnit === 'imperial') return { val: +(m3 * 35.315).toFixed(3), unit: 'ft³' };
  return { val: +m3.toFixed(3), unit: 'm³' };
}
export function wDisplay(kg, dimUnit) {
  if (dimUnit === 'imperial') return { val: +(kg * 2.20462).toFixed(1), unit: 'lb' };
  return { val: +kg.toFixed(1), unit: 'kg' };
}

// ── Global App State ─────────────────────────────────
export const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebar, setMobileSidebar] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('bnbc-dark-mode') === 'true';
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('bnbc-dark-mode', darkMode);
  }, [darkMode]);
  useEffect(() => { setMobileSidebar(false); }, [activeTab]);

  // Language (en / bn)
  const [lang, setLang] = useState(() => localStorage.getItem('bnbc-lang') || 'en');
  useEffect(() => { localStorage.setItem('bnbc-lang', lang); }, [lang]);

  // Stress unit (MPa / psi)
  const [stressUnit, setStressUnit] = useState(() => localStorage.getItem('bnbc-stress') || 'mpa');
  useEffect(() => { localStorage.setItem('bnbc-stress', stressUnit); }, [stressUnit]);

  // Dimension unit (metric / imperial)
  const [dimUnit, setDimUnit] = useState(() => localStorage.getItem('bnbc-dim') || 'metric');
  useEffect(() => { localStorage.setItem('bnbc-dim', dimUnit); }, [dimUnit]);

  // Materials state (stored in MPa + mm internally)
  const [materials, setMaterials] = useState({
    fc: 28,
    fy: 420,
    cover: 30,
    concreteLabel: 'C-28 (28 MPa ≈ 4060 psi)',
    steelLabel: 'GR-420 / 60 ksi (420 MPa)',
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

  const toggleDarkMode = useCallback(() => setDarkMode((p) => !p), []);
  const toggleLang = useCallback(() => setLang((p) => (p === 'en' ? 'bn' : 'en')), []);
  const toggleStressUnit = useCallback(() => setStressUnit((p) => (p === 'mpa' ? 'psi' : 'mpa')), []);
  const toggleDimUnit = useCallback(() => setDimUnit((p) => (p === 'metric' ? 'imperial' : 'metric')), []);

  const value = {
    activeTab, setActiveTab,
    materials, setMaterials,
    loads, setLoads,
    darkMode, toggleDarkMode,
    lang, toggleLang,
    stressUnit, setStressUnit, toggleStressUnit,
    dimUnit, setDimUnit, toggleDimUnit,
    mobileSidebar, setMobileSidebar,
  };

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
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="hidden md:block"><Sidebar /></div>

        {mobileSidebar && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebar(false)} />
            <div className="absolute left-0 top-0 h-full w-72"><Sidebar /></div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileSidebar(true)}
                  className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200" aria-label="Menu">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">🏗️ BNBC 2020</span>
              </div>

              {/* Translate button — mobile */}
              <button onClick={toggleLang}
                className="px-2 py-1 text-xs font-semibold rounded-lg border transition-colors
                  bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600
                  text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">
                {lang === 'en' ? 'বাংলা' : 'English'}
              </button>
            </div>
            {renderContent()}
          </div>
        </main>

        {/* Floating controls — bottom-right corner */}
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
          {/* Language toggle */}
          <button onClick={toggleLang}
            className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-sm font-bold transition-all duration-300 hover:scale-110
              bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200"
            aria-label="Toggle language">
            {lang === 'en' ? 'বাং' : 'EN'}
          </button>

          {/* Dark mode toggle */}
          <button onClick={toggleDarkMode}
            className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-all duration-300 hover:scale-110
              bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-amber-300"
            aria-label="Toggle dark mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </AppContext.Provider>
  );
}
