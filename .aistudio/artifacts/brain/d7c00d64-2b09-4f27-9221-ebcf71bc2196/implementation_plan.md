# Stock Bloc — Obsidian Glassmorphic UI & Navigation Upgrade

An architectural and visual refinement of the Stock Bloc quantitative workstation that elevates the signature dark obsidian, cyan, and bronze aesthetic with richer glassmorphic depth, fluid micro-interactions, a streamlined command header, and decluttered watchlist controls.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design and architectural decisions incorporate your confirmed preferences from the clarification step. Please review and click **Proceed** to execute the upgrade.

- **Confirmed Decision 1 — Priority Scope**: Focus the UI upgrade on the **Main Watchlist**, **Stock Cards**, and **Header Navigation** so the core quantitative workstation feels cohesive, fast, and uncluttered.
- **Confirmed Decision 2 — Visual Direction**: Elevate the existing dark obsidian, electric cyan, and bronze palette using **richer multi-layered glassmorphic depth**, subtle specular border highlights, and **smooth spring-driven micro-interactions**.
- **Confirmed Decision 3 — Navigation & Banner Decluttering**: **Streamline top navigation** and consolidate redundant stacked banners, action rows, and status strips above the watchlist so market data takes center stage immediately above the fold.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the primary Stock Bloc market workstation from a densely stacked multi-bar interface into a sleek, institutional-grade glassmorphic terminal where navigation, live ticker tape, intelligence status, and interactive stock cards flow with clear visual hierarchy.
- **Target Audience / Persona**: Quantitative retail traders, institutional researchers, and Web3/AI market analysts who rely on rapid visual scanning of price action, SB Scores, and intraday sparklines without visual fatigue.
- **Key Value**: Significantly increases above-the-fold data density and visual clarity by removing duplicate navigation buttons and merging fragmented control bars into a unified glassmorphic command deck.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Streamlined Command Header & Navigation**:
   - Users land on a unified, floating obsidian-glass header bar featuring the Stock Bloc identity, live feed status pill, global command search (`⌘K`), AI Copilot trigger, and primary workspace switcher.
   - Redundant duplicate links between the top action toolbar and desktop navigation bar (such as duplicate Community, Compare, YouTube, and Web3 buttons) are consolidated into clean, categorized navigation groups with smooth glass dropdown menus and active indicator beams.
2. **Consolidated Watchlist Control Deck**:
   - Instead of five separate stacked horizontal bars above the stock list (Marquee Ticker, Intelligence Header, Affiliate Bar, Quick Action Row, Category Tabs, and Sort Bar), the workspace presents a **compact, high-contrast Ticker Ribbon** followed by a **Unified Watchlist Command Deck**.
   - The Unified Watchlist Command Deck combines live feed freshness, Line/Candlestick chart mode toggles, collapsible SB Score tier legend, sector category filters, and sorting pills into a cohesive two-tier glassmorphic panel.
3. **Elevated Glassmorphic Stock Cards**:
   - Each stock card features refined dark-matter glassmorphic depth (`backdrop-blur-2xl`), crisp 1px specular top-edge illumination, tabular numeral alignment (`tabular-nums`), an interactive 24H Line/Heikin-Ashi Candlestick scrubbable chart, and a cleaner, high-contrast bottom metrics strip (24H range bar, Relative Volume, Market Cap, 52W range, and RSI).

### Visual Identity & Theme
- **Aesthetic Direction**: Atmospheric Minimalism & High-Craft Dark UI fused with Stock Bloc's signature Cyber-Quant Obsidian identity.
- **Color Palette & Mood**:
  - **Canvas**: Deep Obsidian Void (`#02060D` to `#050D1A`) with subtle radial cyan/bronze ambient luminescence.
  - **Glass Surfaces**: Multi-layered translucent slate-obsidian (`rgba(6, 16, 28, 0.72)`) with specular inner top borders (`rgba(34, 211, 238, 0.22)`) and theme-adaptive radial glows for special assets (Bitcoin Orange `#F7931A`, Gold `#F59E0B`, Silver `#CBD5E1`, Copper `#EA580C`, Polkadot Purple `#A855F7`, Bullish Emerald `#10B981`, Bearish Crimson `#EF4444`).
  - **Accents**: Electric Cyan (`#00F0FF` / `#22D3EE`) for primary interactive focus, Warm Bronze/Amber (`#F59E0B`) for high-conviction/pinned highlights, and Emerald (`#10B981`) for positive momentum.
- **Typography & Hierarchy**:
  - **Display & Tickers**: Crisp geometric display typography (`Zen Dots` / `Orbitron`) for ticker symbols and brand headers.
  - **Financial Telemetry**: Strict `JetBrains Mono` / `Martian Mono` with `tabular-nums` on all prices, percentage changes, SB Scores, volume counters, and range bars to guarantee zero horizontal jitter during live quote syncs.

### Interactive Feedback & Motion
- **Spring Micro-Interactions**: Smooth hover elevation (`translateY(-2px)`), subtle border luminance intensification, and tactile press scaling (`scale(0.985)`) across stock cards and filter pills.
- **Live Sync & Price Flash Polish**: Refined directional price update flashes (emerald/crimson ambient sweep) and non-intrusive live sync indicators.
- **Interactive Sparkline Scrubbing**: Responsive crosshair beacon and floating glass HUD pill when scrubbing across 24H intraday line or Heikin-Ashi candlestick charts.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Consolidating Top Navigation & Eliminating Duplicate Buttons**
  - *Chosen Approach*: Keep global utilities (Search `⌘K`, AI Copilot, Live Data Status, My Bloc, and Account/Pro access) in the top Header bar, and house all primary domain destinations (Watchlist & Markets, AI & Tech, Real Estate, Credit, Agents & Web3, Education, Community, and Store) in the streamlined Navigation Bar directly below.
  - *Why*: Previously, items like Community, Compare, Web3, and YouTube appeared simultaneously in both the Header toolbar and the TopNavbar, creating horizontal crowding and visual noise.
  - *Alternatives Considered*: Moving all navigation into a collapsible sidebar — passed over to preserve full horizontal width for the watchlist and multi-column intelligence hubs.

- **Decision 2: Merging Fragmented Watchlist Banners into a Unified Command Deck**
  - *Chosen Approach*: Integrate the quick-sync actions, SB Score explainer trigger, chart style switcher (Line vs. Candles), and brokerage partner link directly into the Watchlist Intelligence & Filter Deck, while making the 4-tier SB Score legend compact and toggleable.
  - *Why*: Reclaims over 160px of vertical viewport height so users immediately see more live stock cards above the fold on both desktop and mobile viewports.
  - *Alternatives Considered*: Hiding sorting or category tabs behind a modal — rejected because one-click sector filtering and SB Score sorting are core high-frequency trader workflows.

- **Decision 3: Multi-Layered Specular Glassmorphism on Stock Cards**
  - *Chosen Approach*: Upgrade stock card surfaces with refined inner top-edge specular highlights, cleaner badge spacing, and a structured tabular bottom telemetry bar with a visual 24H range progress track.
  - *Why*: Preserves every custom asset theme (Gold, Silver, Copper, Bitcoin Orange, Purple, Bullish/Bearish) and alien corner hieroglyphs while making the typography and charts effortless to scan at a glance.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STOCK BLOC WORKSTATION SHELL                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Streamlined Glass Header                                           │  │
│  │    [Brand Identity] ── [Live Feed Status Pill] ── [⌘K | Copilot | Pro]│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 2. Unified Desktop Navigation Bar & Categorized Glass Dropdowns       │  │
│  │    [Markets] [AI & Tech] [Real Estate] [Credit] [Agents/Web3] [More]  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 3. Compact Live Ticker Tape Ribbon (SPCX • QQQ • DXYZ • Watchlist)    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│                        MAIN WATCHLIST WORKSPACE                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 4. Watchlist Intelligence & Filter Command Deck                       │  │
│  │    • Row A: Market Status, Data Freshness, SB Score Guide, Line/Candle│  │
│  │    • Row B: Sector Bloc Tabs (All, My Bloc, Robotics, Tsunami, etc.)  │  │
│  │    • Row C: Unified Sort Controls (SB Score, Cap, Gainers, Vol, CSV)  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 5. Glassmorphic Stock Card Grid / List                                │  │
│  │    ┌───────────────────────────────────────────────────────────────┐  │  │
│  │    │ [★] $SYMBOL [SB 88]    │  24H Interactive   │     $184.50     │  │  │
│  │    │ Company Name & Badges  │  Line / HA Candle  │  [1D +4.25% ▲]  │  │  │
│  │    ├────────────────────────┴────────────────────┴─────────────────┤  │  │
│  │    │ 24H [$178 ━━●━ $186]  •  VOL 42M (1.4x)  •  CAP $2.1T  •  RSI │  │  │
│  │    └───────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Market State (`useMarketStore`)**: Continues to drive live quote synchronization (`/api/data/market`), `watchlistChartStyle` (`"line"` | `"candlestick"`), `watchlistDataDensity` (`"detailed"` | `"compact"`), and data freshness timestamps without altering any backend routes or payment configurations.
- **User State (`useUserStore`)**: Preserves starred tickers (`My Bloc`), pinned state, and portfolio quick-save actions.

### Interactive Component & State Mapping
- **Header & Navigation Bar**:
  - Clicking any primary tab or dropdown item triggers haptic feedback, updates `activeTab` and URL route state, and smoothly transitions the main viewport.
  - Clicking the live feed health pill opens the `DataStatusPanel` modal; clicking `⌘K` opens the `CommandPalette`; clicking `Copilot` opens `AiCopilotModal`.
- **Watchlist Command Deck**:
  - Toggling `Line` vs `Candles` immediately updates all rendered `StockCard` sparklines between smooth SVG glow curves and 22-bar Heikin-Ashi candlesticks with SMA/VWAP overlays.
  - Clicking the `SB Score Guide` button opens the interactive `SBScoreGuideModal` or toggles the inline tier breakdown.
  - Selecting a Sector Category tab or Sort pill dynamically filters and orders `filteredStocks` with smooth layout animations (`AnimatePresence`) and one-click CSV export.
- **Stock Card Micro-Interactions**:
  - Hovering or touch-scrubbing across the center chart displays live OHLC/price tooltips at the cursor beacon.
  - Swiping left reveals quick-action drawers (Save to Portfolio, Share Card, Pin/Unpin, Remove); clicking the card body opens the comprehensive `StockDetailModal`.
