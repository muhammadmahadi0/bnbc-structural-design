# BNBC 2020 — Structural Design Suite 🏗️

A comprehensive web application for reinforced concrete building structural design, strictly following **BNBC 2020 (Bangladesh National Building Code)** and **ACI 318-19** provisions. Serves as a companion tool for ETABS users.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS 3
- **Logic Engine:** Pure JavaScript utility modules (no backend server required)
- **Deployment:** Static build (`npm run build` → `dist/`)

## File Structure
```
building-structural-design/
├── index.html                 # Entry HTML
├── package.json               # Dependencies (React, Tailwind, Vite)
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind theme
├── postcss.config.js          # PostCSS plugins
└── src/
    ├── main.jsx               # React entry point
    ├── index.css              # Tailwind directives + custom classes
    ├── App.jsx                # Root component + global context
    ├── utils/
    │   ├── bnbcData.js        # BNBC 2020 material/load/seismic databases
    │   └── structuralMath.js  # All structural engineering formulas
    └── components/
        ├── Sidebar.jsx        # Navigation sidebar
        ├── Dashboard.jsx      # Project overview + quick stats
        ├── MaterialSelector.jsx   # f'c, fy, cover selection
        ├── LoadCalculator.jsx     # DL, SDL, LL, Wind, Seismic
        ├── SlabDesign.jsx         # One-way slab design
        ├── BeamDesign.jsx         # Flexure + shear design
        ├── ColumnDesign.jsx       # Axial + biaxial design
        └── RebarDetailing.jsx     # Rebar schedule + quantity
```

## Quick Start
```bash
cd ~/building-structural-design
npm install
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build → dist/
```

## Modules

### 1. 🧱 Material Selection
- Concrete: f'c (16–41.4 MPa) from standard BNBC grades
- Steel: fy (300–550 MPa) including GR-420 (60ksi)
- Clear cover per BNBC Table 6.2.6
- Live derivation: Ec, β₁, ρ_bal, ρ_max, ρ_min

### 2. ⚖️ Load Calculator
- SDL: floor finishes (tile, marble, screed, waterproofing)
- SDL: partition walls (brick, block, glass)
- LL: 23 occupancy categories per BNBC Table 6.2.10
- **Wind:** 3 wind zones, 4 exposure categories, topography factor Kzt, Kz interpolation
- **Seismic:** 10 Bangladesh regions (Dhaka, Comilla, Sylhet, etc.), 5 site classes (SA–SE), Fa/Fv per BNBC Tables 6.2.31–32, importance factor Ie, response mod R
- LRFD load combinations: 1.4D+1.6L, 1.2D+1.6L+0.5W, 1.2D+1.0E+1.0L, etc.

### 3. 🏛️ Slab Design
- Min thickness per ACI 7.3.1.1 / BNBC (l/20, l/24, l/28, l/10) with fy modification
- Moment coefficients for simply supported, one-end continuous, both-ends continuous, cantilever
- Iterative As calculation (tension-controlled), min/max steel check
- Rebar selection + spacing, temperature/shrinkage steel

### 4. 📐 Beam Design
- Flexural As from Mu using quadratic solution
- Min/max steel per ACI 9.6.1.2
- Shear design per ACI 22.5: φVc, Vs_req, stirrup spacing
- Full bar schedule with clear spacing, weight, concrete volume

### 5. 🏗️ Column Design
- Tied/spiral axial capacity: φPn = 0.80φ[0.85f'c(Ag−Ast) + fyAst]
- Reinforcement limits (1%–8% tied, 1%–6% spiral)
- Biaxial Bresler interaction check
- Tie design: 16Ø, 48Ø_tie, min(b,h,300) spacing
- Complete quantity estimate

### 6. 🔄 Rebar Detailing
- Optimal bar selection from all standard sizes (Ø10–Ø40)
- Rebar schedule table with areas, excess %, mass/m
- Clear spacing, layering, weight calculation
- Concrete volume estimate

## BNBC 2020 References
- **Section 2.3:** Load combinations (LRFD)
- **Section 2.4:** Wind loads (Velocity pressure, exposure)
- **Section 2.5:** Seismic loads (Ss, S1, Fa, Fv, SDS, SD1)
- **Table 6.2.1:** Concrete grades
- **Table 6.2.2:** Steel grades
- **Table 6.2.6:** Clear cover requirements
- **Table 6.2.10:** Live loads (occupancy)
- **Table 6.2.31:** Site coefficient Fa
- **Table 6.2.32:** Site coefficient Fv
- **ACI 7.3.1.1:** Slab minimum thickness
- **ACI 9.6.1.2:** Min flexural reinforcement
- **ACI 22.2.2.4:** Stress block (β₁)
- **ACI 22.4.2:** Column axial capacity
- **ACI 22.5:** Shear design

## Conventions
- **Units:** lengths in mm, forces in kN, stresses in MPa
- **Loads:** kN/m² (uniform), kN/m (line), kN (point)
- **Reinforcement:** Area in mm², spacing in mm c/c
- **Seismic:** Spectral acceleration in g (fraction of gravity)

## GitHub
**Repo:** https://github.com/muhammadmahadi0/bnbc-structural-design
