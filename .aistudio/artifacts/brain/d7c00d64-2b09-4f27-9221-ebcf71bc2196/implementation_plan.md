# Intel Feed Video Sequencing Fix & Dyson Swarm Command Upgrade

This update resolves video ordering, timestamp parsing, and deduplication issues across the YouTube & Intel Feed so official Stock Bloc releases always lead the stream followed by newest chronological dispatches, while elevating the Dyson Swarm hub into an obsidian-glass aerospace telemetry command deck.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core product and design priorities have been confirmed from your answers:

- **Confirmed Decision 1 — Default Video Sequencing**: Official Stock Bloc (`@stockbloc`) videos are pinned first (sorted newest-to-oldest among official releases), immediately followed by all other monitored channels and dispatches in strict newest-to-oldest chronological order. Users can still switch to strict chronological, catalyst-priority, or popularity sorting at any time via the sort bar.
- **Confirmed Decision 2 — Timestamp Parsing & Deduplication**: Canonical 11-character YouTube video ID extraction and epoch-millisecond timestamp preservation across server RSS sync, client RSS fallback, and static JSON feeds eliminate duplicate cards and midnight-rounding sort collisions.
- **Confirmed Decision 3 — Dyson Swarm Full-Suite Upgrade**: We will deliver all four prioritized Dyson Swarm enhancements:
  1. **Obsidian-Glass Command Deck & Grouped Sub-Tab Navigation**
  2. **Live 1Hz T-Minus Launch Countdown Telemetry Strip & Mission Readiness Matrix**
  3. **Upgraded Interactive 3D Orbital Globe & Solar Swarm Telemetry HUD**
  4. **Expanded Starship $/kg Launch Economics & Orbital Compute Arbitrage Models**

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Deterministic Intel Feed Sequencing**: Ensures every sync path (5:00 AM EST server background sync, client RSS sync, and unified Intel Feed merger) preserves exact upload timestamps, deduplicates items by canonical YouTube ID, and pins official Stock Bloc videos at the top of the feed followed by the latest chronological dispatches.
  2. **Dyson Swarm Aerospace Command Deck**: Transforms the Dyson Swarm section into a high-precision space infrastructure and orbital economics workstation with live launch countdowns, grouped module navigation, an interactive 3D constellation & solar collector HUD, and expanded Starship/SBSP financial arbitrage modeling.
- **Target Audience / Persona**: Quantitative retail and institutional investors tracking AI compute power bottlenecks, orbital broadband constellations, SpaceX launch economics, and high-conviction market intelligence.
- **Key Value**: Eliminates buried official content and out-of-order video dispatches while turning the Dyson Swarm section into an interactive, empirically grounded aerospace telemetry and financial modeling suite.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Intel Feed Discovery & Playback**:
     - Upon opening the **YouTube & Intel Feed** (or **YouTube Hub**), the user immediately sees official `@stockbloc` releases pinned at the top of the stream, followed by the newest dispatches from All-In, Peter Diamandis, Limitless, and Alexander Wissner-Gross in exact chronological sequence.
     - Users can toggle between **Official Pin + Newest (Default)**, **Strict Newest**, **Oldest First**, **Catalysts & Breaking**, and **Most Viewed**, with instant client-side re-sequencing and zero duplicate entries.
  2. **Dyson Swarm Command & Telemetry**:
     - Users land on the **Dyson Swarm Obsidian Command Deck**, featuring a live 1Hz ticking `T-Minus` launch countdown banner, fleet telemetry KPIs, and a **Mission Readiness & Orbital Shell Matrix**.
     - Instead of scrolling through 13 flat buttons, users navigate via 4 structured mission groups (**Live Telemetry & Launches**, **Orbital Economics & Power Arbitrage**, **Constellation & Vehicles**, and **Deep Research & Video Vault**) with instant sub-tab switching.
  3. **3D Globe & Orbital Economics Exploration**:
     - In the **Interactive 3D Starlink & Dyson Globe**, users can filter orbital shells, toggle the **Dyson Solar Collector Ring** and **Optical Laser Mesh**, adjust orbital propagation speed (`0.5x` to `5x`), and inspect real-time shell telemetry (altitude, inclination, orbital velocity, solar capture GW).
     - In the **Starship $/kg Engine** and **SBSP vs AI Microgrids** modules, users can click one-click mission presets or scrub interactive sliders to model orbital AI compute radiative cooling and launch cost decay curves.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Calibrated aerospace telemetry meets Stock Bloc dark obsidian glassmorphism—evoking mission control precision and institutional authority.
  - *Color Palette & Mood*:
    - **60% Dominant Canvas**: Deep space obsidian (`#030812` / `#060D1A`).
    - **30% Structural Surfaces**: Multi-layered smoked obsidian glass (`rgba(7, 17, 30, 0.82)`) with 1px specular cyan/slate hairline borders (`rgba(34, 211, 238, 0.22)`).
    - **10% Precision Telemetry Accents**: Electric Cyan (`#22D3EE`) for primary orbital/laser telemetry, Telemetry Bronze/Amber (`#F59E0B`) for solar irradiance and countdown alerts, and Emerald (`#10B981`) for nominal mission readiness.
  - *Typography & Hierarchy*: Bold geometric display headers paired with `font-mono tabular-nums` across all countdown clocks, orbital velocities, $/kg readouts, and timestamps to prevent layout jitter.
  - *Component Styling & Layout*: Asymmetric split consoles for economic simulators (parameter scrubbers on the left, live multi-curve charts and telemetry readouts on the right) and full-bleed 3D WebGL viewport with translucent HUD overlays.

- **Interactive Feedback & Motion**:
  - Real-time 1Hz countdown clock updates with tabular numerals.
  - Smooth 150ms spring micro-interactions on mission group pills, preset buttons, and 3D camera transitions.
  - Text-first semantic status indicators (`● Nominal`, `▲ Deploying`, `● Active`) for immediate visual clarity.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Two-Tier Default Video Sequencing (`Stock Bloc Official First -> Chronological Newest`)**
  - *Chosen Approach*: Restore the Stock Bloc priority comparator in both server-side and client-side sync pipelines, and set the unified feed's default sort mode to pin `isStockBloc` items first (ordered newest-to-oldest among Stock Bloc videos) followed by all other items ordered by exact epoch timestamp (`b.timestamp - a.timestamp`). Also provide a separate **"Strict Newest"** sort button for users who want unpinned pure chronological order across all channels.
  - *Why*: Previously, the Stock Bloc comparator was blanked out in the sort function, causing official Stock Bloc videos from May/Dec to sink to the very bottom of the 50-video array below daily podcast uploads. Pinning official videos first while keeping third-party channels strictly chronological satisfies both brand priority and real-time freshness.
  - *Alternatives Considered*: Interleaving channels round-robin was considered, but it obscures true chronological order for breaking daily dispatches.

- **Decision 2: Canonical 11-Character YouTube ID Deduplication & Epoch Timestamp Preservation**
  - *Chosen Approach*: Extract the canonical 11-character YouTube video ID from any `youtubeId`, `video_id`, `watch_url`, `embed_url`, or `link` field before building the `unifiedMap` in `normalizeAndUnifyFeed`, and prioritize the numeric `v.timestamp` epoch field before falling back to `parseFeedDate(v.publishedDate)`.
  - *Why*: Previously, `normalizeAndUnifyFeed` ignored `v.timestamp` on `YouTubeVideo` objects and re-parsed the formatted string `"@allin • Aug 10, 2026"`, which stripped hours/minutes/seconds and caused videos published on the same day to sort arbitrarily. Moreover, items present in both `intel_news_feed.json` (keyed by `id: "sb_official_01"`) and `INITIAL_YOUTUBE_VIDEOS` (keyed by `youtubeId: "r9mDbMcMemg"`) could duplicate or overwrite newer timestamps with older ones.

- **Decision 3: Categorized Dyson Swarm Navigation & Integrated Live Telemetry**
  - *Chosen Approach*: Organize the 13 Dyson Swarm sub-tabs into 4 high-level mission categories while preserving direct URL deep-linking (`useSubTabUrl`) and all existing sub-tab IDs.
  - *Why*: Grouping the 13 modules into 4 scannable mission categories eliminates horizontal tab overflow while keeping every existing module 1 click away and preserving backward compatibility with deep links.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        YOUTUBE & INTEL FEED PIPELINE                       │
├──────────────────────┬───────────────────────────┬─────────────────────────┤
│ Server 5AM RSS Sync  │ Client RSS / Seed Store   │ Static Intel JSON Feed  │
│ (/api/intel/youtube) │ (youtubeSync + youtube.ts)│ (/api/data/news)        │
└──────────┬───────────┴─────────────┬─────────────┴────────────┬────────────┘
           │                         │                          │
           ▼                         ▼                          ▼
┌────────────────────────────────────────────────────────────────────────────┐
│            Canonical Deduplication & Timestamp Normalizer                  │
│  • Extracts 11-char YouTube ID across video_id / watch_url / embed_url     │
│  • Preserves exact numeric epoch ms (v.timestamp) before string parsing    │
│  • Merges takeaways, summaries, and latest timestamps without duplicates   │
└────────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│             Deterministic Sequencer (sortUnifiedFeed)                      │
│  • Default (OFFICIAL_NEWEST): Pins @stockbloc first, then newest epoch ms  │
│  • Modes: Official+Newest | Strict Newest | Oldest | Catalysts | Popular   │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                      DYSON SWARM AEROSPACE COMMAND DECK                    │
├────────────────────────────────────────────────────────────────────────────┤
│  1. Hero Command Deck & Live 1Hz T-Minus Launch Countdown Telemetry Strip  │
│  2. Mission Readiness & Orbital Shell Status Matrix                        │
│  3. Categorized 4-Zone Module Navigator (13 Sub-Tabs Preserved)            │
├─────────────────────────┬─────────────────────────┬────────────────────────┤
│ Interactive 3D Globe    │ Starship $/kg Engine    │ SBSP & Orbital Compute │
│ • 5 LEO Shells + Dyson  │ • Presets (F9, V2, V3)  │ • Power + Radiative    │
│   Solar Collector Ring  │ • Reusability & Cadence │   Cooling Arbitrage    │
│ • Speed Scrubber (0.5-5x│   Sensitivity Curves    │ • Grid Queue Bypass    │
│ • Live Shell Inspector  │ • Payload Mass Matrix   │   Alpha Calculator     │
└─────────────────────────┴─────────────────────────┴────────────────────────┘
```

- **Data Model & State**:
  - `UnifiedFeedItem`: Retains `id`, `youtubeId`, `timestamp` (exact epoch ms), `publishedDate`, `isStockBloc`, `isAlexWg`, `itemCategory`, `keyTakeaways`, and `viewCount`.
  - `FeedSortOption`: Supports `"OFFICIAL"` (default: Stock Bloc pinned first, then newest chronological), `"NEWEST"` (strict newest chronological across all channels), `"OLDEST"`, `"CATALYSTS"`, and `"POPULAR"`.
  - `DysonSwarmHub` State:
    - Live 1Hz countdown state (`TimeRemaining`) computed every second from the next upcoming launch target ISO timestamp.
    - Active Mission Category + `activeSubTab` synced with URL query parameters via `useSubTabUrl`.
    - `Starlink3DGlobe` state: `selectedShellFilter`, `showLaserMesh`, `showDysonSolarRing`, `orbitSpeedMultiplier` (`0.5 | 1 | 2 | 5`), and interactive shell telemetry readout.

- **Interactive Component & State Mapping**:
  - **Feed Sequencer & Filter Bar**: Clicking any feed source tab (`ALL FEEDS`, `STOCK BLOC YT`, `DISPATCHES`, `SAVED`) or sort button (`Official First`, `Strict Newest`, `Oldest First`, `Catalysts`, `Most Viewed`) immediately re-computes `filteredAndSortedFeed` deterministically.
  - **YouTubeHub Top Releases**: Re-sequences `INITIAL_YOUTUBE_VIDEOS` and `syncYouTubeFeeds` so Stock Bloc official videos are always positioned first in the default array, ensuring the "Primary Intel Focus: Top Releases #1 & #2" spotlight showcases official Stock Bloc content first.
  - **Dyson Live Launch Countdown**: Runs a `setInterval(..., 1000)` timer updating days, hours, minutes, and seconds until the next orbital launch window, with one-click Google Calendar and `.ics` export handlers.
  - **3D Globe Telemetry HUD**: Toggling shells, laser links, Dyson collector ring, or propagation speed updates `useRef` state read directly by the Three.js `requestAnimationFrame` loop for zero-lag 60fps rendering.
  - **Orbital Economics & Arbitrage Presets**: Clicking vehicle/cluster presets updates all coupled sliders (`annualCadence`, `payloadCapacityTons`, `boosterReuses`, `dataCenterPowerMW`, `orbitalCoolingSavingsPct`) and immediately recalculates Recharts curves and tabular KPI cards.
