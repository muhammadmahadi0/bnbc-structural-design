# BNBC 2020 — Structural Design Suite 🏗️

**A comprehensive web application for reinforced concrete building structural design**, strictly following **BNBC 2020 (Bangladesh National Building Code)** and **ACI 318-19** provisions. Serves as a companion tool for ETABS users.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS 3
- **Logic Engine:** Pure JS utility modules (`structuralMath.js` + `bnbcData.js`)
- **State:** React Context (no external state libs)
- **Deployment:** Static build (`npm run build` → `dist/`)

## File Structure
```
building-structural-design/
├── index.html                 # Entry HTML
├── package.json               # Dependencies
├── vite.config.js             # Vite config → host 0.0.0.0:5173
├── tailwind.config.js         # Tailwind + darkMode: 'class'
├── netlify.toml               # Netlify deploy config
├── README.md                  # GitHub readme
├── AGENTS.md                  # This file
└── src/
    ├── main.jsx               # React 18 createRoot
    ├── index.css              # Tailwind + custom card/input styles
    ├── App.jsx                # Root + Context (darkMode, stressUnit, dimUnit, materials, loads)
    ├── utils/
    │   ├── bnbcData.js        # BNBC 2020 databases (concrete, steel, loads, wind, seismic, rebar)
    │   └── structuralMath.js  # 40+ pure engineering functions
    └── components/
        ├── Sidebar.jsx        # Nav + material summary + unit toggles
        ├── Dashboard.jsx      # Project overview
        ├── MaterialSelector.jsx   # f'c, fy, cover + derived props
        ├── LoadCalculator.jsx     # SDL, LL, Wind (Kz/Kzt/Cp), Seismic (SDS/SD1/V)
        ├── SlabDesign.jsx         # One-way slab thickness, moment, rebar
        ├── BeamDesign.jsx         # Flexure (quadratic As), shear (stirrups)
        ├── ColumnDesign.jsx       # Axial (tied/spiral), biaxial Bresler, ties
        └── RebarDetailing.jsx     # Bar schedule, spacing, weight, concrete vol
```

## Features

### Module 1: 🧱 Material Selection
- **Concrete:** BNBC grades C‑16 through C‑40 (16–40 MPa) with psi equivalents
- **Steel:** GR‑300/400/420/500/550 (300–550 MPa) with ksi equivalents
- **Clear cover:** Presets per BNBC Table 6.2.6 (slab/beam/column/foundation)
- **Derived:** Ec = 4700√f'c MPa, β₁ (0.85→0.65), ρ_bal, ρ_max = 0.75ρ_bal, ρ_min
- **Dual display:** MPa ↔ psi/ksi everywhere

### Module 2: ⚖️ Load Calculator
- **SDL:** Floor finishes (tile, marble, screed, terrazzo, waterproofing) + partition walls (brick, block, glass)
- **Live Load:** 23 occupancy categories per BNBC Table 6.2.10
- **Wind Load (BNBC Sec 2.4):**
  - 3 basic wind speed zones (160/180/210 km/h)
  - 4 exposure categories (A–D) with Kz tables + interpolation
  - Topography factor Kzt (flat 1.0 → steep ridge 1.4)
  - Directionality Kd = 0.85, gust G = 0.85
  - Design pressure: p = qz·G·Cp − qh·GCpi (windward +0.8, leeward −0.5, side −0.7)
- **Seismic Load (BNBC Sec 2.5/6.2):**
  - 10 Bangladesh regions (Dhaka, Comilla, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh, Tangail)
  - 5 site classes SA–SE with Fa/Fv interpolation per Tables 6.2.31–32
  - **SPT-N → Site Class** auto-conversion (input depth + N-values, auto-calc N_avg)
  - **Seismic Design Category (SDC)** per BNBC Table 6.6.1 (A → D based on SDS/SD1)
  - **Ω₀ (Overstrength factor) & Cd (Deflection amplification)** added to all lateral systems
  - SDS = ⅔·Fa·Ss, SD1 = ⅔·Fv·S1
  - Cs = SDS/(R/Ie) ≤ SD1/(T·R/Ie) ≥ 0.044·SDS·Ie ≥ 0.01
  - Approximate period Ta = 0.0466·hn⁰·⁹
  - **Building Weight:** Manual entry or auto-calc from floor area × (DL + 0.25LL) × stories
- **LRFD Combos:** 1.4D+1.6L, 1.2D+1.6L+0.5W, 1.2D+1.0W+1.0L, 0.9D+1.0W, 1.2D+1.0E+0.75L, 0.9D+1.0E

### Module 3: 🏛️ Slab Design
- **Hybrid approach:** Basic h_min reference (L/20–L/28 + fy adj) for quick estimates
- Detailed BNBC exact thickness → links to dedicated **[slabthickness.netlify.app](https://slabthickness.netlify.app/)** (9 edge conditions, iterative self-weight, ACI moment coefficients)
- Manual h input with "Min" reset button
- One-way: auto moment coefficients (1/8, 1/10, 1/14, 1/2)
- Two-way: manual Mu entry (values from slabthickness), or use auto simple one-way calc
- Iterative tension-controlled As (max 50 iterations, NaN-safe)
- Temperature/shrinkage steel per ACI 24.4
- Rebar selection + spacing in mm & inches

### Module 4: 📐 Beam Design
- Flexural As from Mu using quadratic formula (discriminant check)
- Min steel: 0.25√f'c/fy·b·d ≥ 1.4/fy·b·d per ACI 9.6.1.2
- Max steel: ρ_max = 0.75ρ_bal (tension-controlled)
- Shear: φVc = 0.75·0.17·√f'c·b·d per ACI 22.5
- Stirrup spacing: Av·fyt·d / Vs, with max limits min(d/2, 600) / min(d/4, 300)
- ✅ **Deflection check (ACI 24.2):** Ie (cracked), Mcr, Ma, immediate + long-term deflection, pass/fail per L/480 or L/240
- Full bar + weight + concrete estimate per beam

### Module 5: 🏗️ Column Design
- Tied: φPn_max = 0.80·φ·[0.85f'c(Ag−Ast) + fy·Ast] with φ = 0.65
- Spiral: φPn_max = 0.85·φ·[0.85f'c(Ag−Ast) + fy·Ast] with φ = 0.75
- Reinforcement limits: min 1%, max 8% (tied) / 6% (spiral) per ACI 10.6.1
- Biaxial Bresler interaction: (Mux/φMnx)^α + (Muy/φMny)^α ≤ 1.0
- Tie spacing: min(16Ø_main, 48Ø_tie, b, h, 300 mm)
- ✅ **PMM interaction curve:** 25+ points via strain compatibility (φPn_max → balance → pure bending), for ETABS Section Designer verification
- ✅ **Slenderness check (ACI 6.2):** kLu/r, stability limit, Cm, Pc, δns, moment magnification

### Module 6: 🔄 Rebar Detailing
- Optimal bar selection from Ø10–Ø40 (all standard BNBC sizes)
- Complete schedule table with area (mm²), n, As_prov, excess %, mass/m
- Clear spacing with layering
- Weight (kg/lb) + concrete volume (m³/ft³) estimation

## BNBC 2020 Compliance
| Section | Topic | Status |
|---------|-------|--------|
| 2.3 | Load combinations (LRFD) | ✅ Implemented (6 combos) |
| 2.4 | Wind loads | ✅ Implemented |
| 2.5 | Seismic loads | ✅ Implemented |
| 3.1 | Concrete grades | ✅ C‑16 to C‑40 |
| 3.2 | Steel grades | ✅ GR‑300 to GR‑550 |
| 6.2.1 | Concrete grades table | ✅ |
| 6.2.2 | Steel grades table | ✅ |
| 6.2.6 | Clear cover | ✅ |
| 6.2.10 | Live loads (occupancy) | ✅ 23 categories |
| 6.2.31 | Site coefficient Fa | ✅ Interpolated |
| 6.2.32 | Site coefficient Fv | ✅ Interpolated |
| ACI 7.3.1.1 | Slab min thickness | ✅ |
| ACI 9.6.1.2 | Min flexural reinforcement | ✅ |
| ACI 10.6.1 | Column reinforcement limits | ✅ |
| ACI 19.2.2.1 | Concrete modulus Ec | ✅ |
| ACI 22.2.2.4 | Stress block β₁ | ✅ |
| ACI 22.4.2 | Column axial capacity | ✅ Tied + spiral |
| ACI 22.5 | Shear design | ✅ |
| ACI 24.4 | Temp/shrinkage steel | ✅ |
| ACI 24.3.2 | Flexural crack control spacing | ✅ Fixed |
| ACI 13.6 | Two-way slab (Direct Design) | ✅ |
| ACI 24.2 | Deflection (immediate + long-term) | ✅ |
| ACI 6.2 | Column slenderness (kLu/r, δns) | ✅ |

## Units & Conventions
- **Internal:** lengths in mm, forces in kN, stresses in MPa
- **Dual display:** MPa ↔ psi/ksi, mm ↔ in, m ↔ ft, kg ↔ lb, m³ ↔ ft³
- **Language:** English ↔ বাংলা toggle (top-right corner, persists in localStorage)
- **Dark mode:** Toggle at bottom-right corner (persists in localStorage)
- **Mobile:** Responsive sidebar with hamburger overlay

## Quick Start
```bash
cd ~/building-structural-design
npm install
npm run dev      # → http://localhost:5173
npm run build    # → dist/
```

## Netlify Deploy
```bash
# Option 1: Import from GitHub
# https://app.netlify.com/start/deploy?repository=https://github.com/muhammadmahadi0/bnbc-structural-design

# Option 2: CLI
npx netlify deploy --prod --dir=dist
```

## GitHub
**Repo:** `https://github.com/muhammadmahadi0/bnbc-structural-design`
