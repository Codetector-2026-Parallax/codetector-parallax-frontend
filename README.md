# Codetector Parallax — Frontend SPA

A high-performance Single Page Application (SPA) designed for SQL forensics competitions, built with **React 18**, **Vite 5**, and **TypeScript**, styled using the authentic **Dell 1996 Catalog Grid Design System** (Antique Gold in Dark and Light themes).

The frontend serves as the primary portal for contest participants and proctors (BTC). It provides real-time case investigation dossiers, sequential challenge progression, interactive 22-table ERD exploration, instant submission feedback, and an administrative oversight dashboard.

---

## 1. Features & Capabilities

- **Dell 1996 Catalog Grid UI**:
  - Implements the bespoke Antique Gold retro aesthetic specified in `DESIGN-dell-1996.md` and `DESIGN-dell-1996-dark.md`.
  - Instant theme switcher between **Dark Mode** (`🌙 DARK`) and **Light Mode** (`☀️ LIGHT`).
  - Monospace telemetry data, bevelled metallic frames, dot-matrix status indicators, and nostalgic CRT/catalog styling.

- **Resizable 3-Pane Workstation**:
  - **Left Pane (Sidebar)**: Sequential question list (Q1 to Q8), lock/unlock indicators, points value, and completion status.
  - **Center Pane (Case Dossier)**: Investigation backstory, evidence cards, hint store, 2x Risk Move ("Nước cờ mạo hiểm") trigger, answer submission input, attempt limit counter (max 6), and real-time grading feedback.
  - **Right Pane (ERD Canvas)**: Interactive schema browser rendering all 22 forensics tables (`munihard`), complete with pan/zoom, table search, primary/foreign key connections, and column type inspectors.
  - Draggable dividers allow contestants to customize pane widths according to their screen setup.

- **Contest Mechanics**:
  - **Sequential Gating**: Questions unlock sequentially as earlier stages are solved.
  - **Hint Purchasing**: Deducts points in exchange for forensic hints.
  - **2x Risk Move ("Nước cờ mạo hiểm")**: Optional gamble before submitting—doubles points on a correct answer on the next attempt, or imposes a penalty on failure.
  - **Zero Answer Leakage**: All validation is executed server-side; client bundles and state contain zero answer keys.

- **Proctor / Admin Control Room**:
  - Live scoreboard and team progress breakdown.
  - Real-time submission logs and attempt audits.
  - Manual score adjustment and hint request overrides.

---

## 2. Architecture & File Structure

```
codetector-parallax-frontend/
├── index.html                  # HTML entry point (Dell 1996 viewport & font preloads)
├── package.json                # React 18, Vite 5, TypeScript 5 dependencies
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite bundler config with /api reverse proxy
├── public/                     # Static media and icons
└── src/
    ├── main.tsx                # React DOM root bootstrapping
    ├── App.tsx                 # 3-pane resizable layout & application root state
    ├── api.ts                  # Fetch API wrapper (JWT storage, X-Codetector-Client header)
    ├── types.ts                # TypeScript interfaces (Questions, Submissions, ERD, User)
    │
    ├── components/
    │   ├── TopBanner.tsx       # Header with team badge, live score, timer, and theme toggle
    │   ├── QuestionSidebar.tsx # Collapsible sidebar with sequential question cards
    │   ├── CaseRecordView.tsx  # Investigation dossier, hint buy, Risk Move, and submit panel
    │   ├── ErdCanvas.tsx       # Interactive 22-table SVG/Canvas ERD visualizer
    │   ├── AdminDashboard.tsx  # Real-time BTC monitoring and leaderboard management
    │   └── AuthLogin.tsx       # Team & Admin login modal
    │
    └── theme/
        ├── dell1996.css        # Dell 1996 design system CSS variables and retro bevels
        └── theme.ts            # Dark/Light theme switching and localStorage persistence
```

---

## 3. API Communication & Security Integration

The frontend communicates with the backend via a reverse proxy configured in `vite.config.ts`:

- In development mode, all requests matching `/api/*` are automatically proxied to `http://localhost:4000`.
- All requests dispatched through `src/api.ts` automatically append:
  - `X-Codetector-Client: parallax-web` (Required by the backend anti-automation defense layer).
  - `Authorization: Bearer <token>` when a team is authenticated.
- Tokens are safely persisted in browser `localStorage` under the key `codetector_jwt`.
- Production builds disable sourcemaps (`sourcemap: false`) to prevent reverse engineering of internal structures.

---

## 4. Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm 9.x or higher
- The backend API running at `http://localhost:4000` (see [Backend README](../codetector-parallax-backend/README.md))

### Installation
```powershell
# Navigate to the frontend directory
cd codetector-parallax

# Install dependencies
npm install
```

### Development Server
```powershell
npm run dev
```
The application will launch at `http://localhost:5173`. Any changes to files in `src/` will hot-reload automatically.

### Production Build & Preview
```powershell
# Type-check and compile static bundle into dist/
npm run build

# Preview production build locally
npm run preview
```

---

## 5. Companion Services

This frontend is designed to operate in tandem with:
- **Backend API**: [codetector-parallax-backend](../codetector-parallax-backend/README.md) on port `4000`.
- **SQL Query Editor**: [codetector-parallax-sql-editor](../codetector-parallax-sql-editor/README.md) on port `3000`.
- **Master Ecosystem Overview**: [Root README](../README.md).
