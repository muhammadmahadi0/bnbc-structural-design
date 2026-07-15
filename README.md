<div align="center">

# 🏗️ BNBC 2020 — Structural Design Suite

**A comprehensive web application for reinforced concrete building structural design**

**[🌐 structuralbd.netlify.app](https://structuralbd.netlify.app)**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)
![BNBC](https://img.shields.io/badge/BNBC-2020-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**React · Vite · Tailwind CSS · BNBC 2020 · ACI 318-19**

[Live Demo](https://structuralbd.netlify.app) •
[Features](#-features) •
[Modules](#-modules) •
[Quick Start](#-quick-start) •
[BNBC Reference](#-bnbc-2020-references)

</div>

---

> **Production-ready companion tool for ETABS users.** Every calculation strictly follows **Bangladesh National Building Code 2020 (BNBC 2020)** and **ACI 318-19** provisions. No backend server required — runs entirely in the browser.

---

## ✨ Features

- ✅ **Material Selection** — f'c, fy, cover with live derived properties (Ec, β₁, ρ)
- ✅ **Load Calculator** — SDL (finishes, partitions), LL (23 occupancy types), Wind & Seismic loads
- ✅ **Slab Design** — One-way slab: min thickness, moment coeffs, iterative As, bar selection + spacing
- ✅ **Beam Design** — Flexural As (quadratic solution), shear stirrups per ACI 22.5, full bar schedule
- ✅ **Column Design** — Tied/spiral axial capacity (φPn), min/max ρ, biaxial Bresler check
- ✅ **Rebar Detailing** — Optimal bar selection (Ø10–Ø40), schedule table, spacing, weight, concrete volume
- ✅ **Bangladesh-Specific** — 10 seismic regions (Dhaka, Comilla, Sylhet, etc.), 5 site classes (SA–SE), wind zones
- ✅ **Dark Mode** — Toggle at bottom-right corner, persists via localStorage
- ✅ **Dual Units** — MPa ↔ psi/ksi, mm ↔ in, m ↔ ft, kg ↔ lb, m³ ↔ ft³
- ✅ **Mobile Responsive** — Hamburger sidebar, stacked grids on small screens

---

## 🧩 Modules

| Module | Description |
|---|---|
| **📊 Dashboard** | Project overview, material stats, reinforcement ratios, BNBC quick reference |
| **🧱 Materials** | Concrete grade (f'c 16–40 MPa), steel grade (fy 300–550 MPa), clear cover per BNBC Table 6.2.6 |
| **⚖️ Loads** | Floor finishes, partition walls, 23 occupancy live loads, wind (3 zones × 4 exposures), seismic (10 regions × 5 site classes) |
| **🏛️ Slab** | Min thickness (l/20, l/24, l/28, l/10), moment coefficients, tension-controlled As, temperature steel |
| **📐 Beam** | Flexural reinforcement, shear stirrups (φVc, Vs, spacing), bar layout, quantity estimate |
| **🏗️ Column** | Tied/spiral axial capacity, reinforcement limits (1–8%), biaxial Bresler interaction, tie design |
| **🔄 Rebar** | Optimal bar selection, full schedule table, clear spacing, weight, concrete volume |

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/muhammadmahadi0/bnbc-structural-design.git
cd bnbc-structural-design

# Install
npm install

# Dev server (http://localhost:5173)
npm run dev

# Production build
npm run build
```

---

## 🌐 Deployment

### 🔴 Live Site

<p align="center">
  <a href="https://structuralbd.netlify.app">
    <strong>🌐 structuralbd.netlify.app</strong>
  </a>
  <br>
  <sub>Deployed on Netlify — automatic deploys from GitHub</sub>
</p>

### Netlify (recommended)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/muhammadmahadi0/bnbc-structural-design)

Or deploy manually:
1. Connect your GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. A `netlify.toml` is already included — no extra config needed

### Static hosting (any)

Upload the `dist/` folder to any static host (Vercel, GitHub Pages, Firebase, etc.)

---

## 📐 Calculation Engine

The `src/utils/structuralMath.js` file contains **40+ pure functions** implementing:

- **Material:** `Ec()`, `beta1()`, `rhoBal()`, `rhoMax()`, `rhoMin()`, `AsMin()`, `effectiveDepth()`
- **Loads:** `factoredLoad()` — all LRFD combinations
- **Wind:** `windVelocityPressure()`, `windDesignPressure()`, `interpolateKz()`
- **Seismic:** `seismicDesignParams()` (SDS, SD1), `seismicBaseShear()` (Cs, V), `approxPeriod()`
- **Slab:** `slabMinThickness()`, `slabFactoredLoad()`, `slabBendingMoment()`, `slabRequiredSteel()`
- **Beam:** `beamAsFromMu()`, `beamShearDesign()`, `beamFlexuralDesign()`, `beamEstimate()`
- **Column:** `columnAxialCapacity()`, `columnReinfLimits()`, `biaxialInteraction()`
- **Rebar:** `selectRebar()`, `barSpacing()`, `rebarWeight()`, `totalSteelWeight()`, `concreteVolume()`

---

## 📖 BNBC 2020 References

| Section | Content |
|---|---|
| **Sec 2.3** | Load combinations (LRFD) |
| **Sec 2.4** | Wind loads — velocity pressure, exposure categories |
| **Sec 2.5** | Seismic loads — Ss, S1, Fa, Fv, SDS, SD1, base shear |
| **Table 6.2.1** | Concrete grades |
| **Table 6.2.2** | Steel grades |
| **Table 6.2.6** | Clear cover requirements |
| **Table 6.2.10** | Live loads by occupancy |
| **Table 6.2.31** | Site coefficient Fa |
| **Table 6.2.32** | Site coefficient Fv |
| **ACI 7.3.1.1** | Slab minimum thickness |
| **ACI 9.6.1.2** | Minimum flexural reinforcement |
| **ACI 22.2.2.4** | Equivalent stress block (β₁) |
| **ACI 22.4.2** | Column axial capacity |
| **ACI 22.5** | Shear design |

---

## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| [React 18](https://reactjs.org/) | UI framework |
| [Vite 5](https://vitejs.dev/) | Build tool & dev server |
| [Tailwind CSS 3](https://tailwindcss.com/) | Utility-first CSS |
| [Netlify](https://www.netlify.com/) | Deployment (SPA) |

---

## 📁 Project Structure

```
bnbc-structural-design/
├── index.html                 # Entry HTML
├── netlify.toml               # Netlify deployment config
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx               # React entry point
    ├── index.css              # Tailwind + custom classes
    ├── App.jsx                # Root + global context
    ├── utils/
    │   ├── bnbcData.js        # BNBC 2020 databases
    │   └── structuralMath.js  # Engineering formulas
    └── components/
        ├── Sidebar.jsx
        ├── Dashboard.jsx
        ├── MaterialSelector.jsx
        ├── LoadCalculator.jsx
        ├── SlabDesign.jsx
        ├── BeamDesign.jsx
        ├── ColumnDesign.jsx
        └── RebarDetailing.jsx
```

---

## 👨‍💻 Author

**Muhammad Mahdi** — [@muhammadmahadi0](https://github.com/muhammadmahadi0)

<div align="center">
  <sub>Built with ❤️ for the Bangladesh structural engineering community</sub>
  <br>
  <sub>BNBC 2020 · ACI 318-19 · Bangladesh National Building Code</sub>
  <br>
  <a href="https://structuralbd.netlify.app">🌐 structuralbd.netlify.app</a>
</div>
