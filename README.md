# Stock Bloc — Autonomous Financial Market Terminal & Quant AI Agent Engine

[![Canonical Live Production URL](https://img.shields.io/badge/Production%20Terminal-https%3A%2F%2Fstock--bloc.ai.studio-cyan?style=for-the-badge)](https://stock-bloc.ai.studio)
[![OpenAPI Spec](https://img.shields.io/badge/OpenAPI-3.0.1-blue?style=for-the-badge)](https://stock-bloc.ai.studio/api/v1/openapi.json)
[![LLM Specification](https://img.shields.io/badge/LLMs.txt-Agent%20Ready-emerald?style=for-the-badge)](https://stock-bloc.ai.studio/llms.txt)

**Stock Bloc** is an autonomous financial market intelligence terminal, SEC 13F whale tracker, quant AI agent arena, credit repair generator, and wealth operating system.

---

## 🌐 Canonical URLs & Agent Endpoints

- **Canonical Live Application**: [https://stock-bloc.ai.studio](https://stock-bloc.ai.studio)
- **Machine LLM Specification**: [https://stock-bloc.ai.studio/llms.txt](https://stock-bloc.ai.studio/llms.txt)
- **OpenAPI 3.0.1 Schema**: [https://stock-bloc.ai.studio/api/v1/openapi.json](https://stock-bloc.ai.studio/api/v1/openapi.json)
- **AI Plugin Manifest**: [https://stock-bloc.ai.studio/.well-known/ai-plugin.json](https://stock-bloc.ai.studio/.well-known/ai-plugin.json)
- **MCP Tool Configuration**: [https://stock-bloc.ai.studio/api/v1/mcp-config.json](https://stock-bloc.ai.studio/api/v1/mcp-config.json)
- **Data Status & Freshness API**: [https://stock-bloc.ai.studio/api/v1/data-status](https://stock-bloc.ai.studio/api/v1/data-status)

---

## 💻 Local Development & Commands

### Prerequisites
- Node.js (v18 or v20 recommended)
- npm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
Starts the Express proxy + Vite server on `http://localhost:3000` with TypeScript execution:
```bash
npm run dev
```

### 3. Build for Production
Bundles frontend static assets with Vite into `dist/` and compiles `server.ts` into a bundled CommonJS backend at `dist/server.cjs`:
```bash
npm run build
```

### 4. Start Production Server
Runs the standalone compiled Node server on port 3000:
```bash
npm run start
```

### 5. Run Model Context Protocol (MCP) Server
Runs the Model Context Protocol stdio server for Claude Desktop, Gemini, or custom AI agents:
```bash
node mcp-server.js
```

---

## 📡 Public Backend Data Contract & CDN Proxy Endpoints

Stock Bloc feeds market quotes, 13F whale filings, Dyson swarm orbital telemetry, and intelligence news through local Express CDN proxy endpoints and backend JSON writers (`scripts/fetch_market.py`, `scripts/fetch_sec.py`, `scripts/fetch_dyson.py`, `scripts/fetch_intel_feed.py`):

1. **Market Watchlist & Price Feed**: `/api/data/market` -> `market_watchlist_data.json`
   - Fields: `updated_at` (ISO-8601 UTC), `source` ("Polygon.io / Yahoo Finance Quant Watchlist Feed"), `watchlist` (array of ticker quote objects).
2. **SEC Form 13F Institutional Holdings**: `/api/data/sec` -> `sec_intel_data.json`
   - Fields: `updated_at` (ISO-8601 UTC), `source` ("U.S. SEC EDGAR System Form 13F-HR"), `funds` (array of fund objects with CIK, official EDGAR filing links, and holdings status).
3. **Dyson Swarm AI Telemetry**: `/api/data/dyson` -> `dyson_swarm_data.json`
   - Fields: `updated_at` (ISO-8601 UTC), `source` ("SpaceX / Planet Labs / NASA Orbital Telemetry Feed"), `fleet_metrics`, `orbital_shells`.
4. **Intelligence News & Podcast Feed**: `/api/data/news` -> `intel_news_feed.json`
   - Fields: `updated_at` (ISO-8601 UTC), `source` ("Financial News RSS & Podcast Aggregator"), `intel_feed` (array of news/podcast objects).
5. **Unified Data Status & Freshness**: `/api/v1/data-status`
   - Fields: `market`, `sec`, `dyson`, `news` status objects containing `updated_at` timestamps and `stale` flags.

All JSON writers and the GitHub Actions hourly sync workflow (`.github/workflows/daily_sync.yml` & `daily_update.yml`) strictly stamp `updated_at` in ISO-8601 UTC and fail with a non-zero exit code if any required file would be written without `updated_at` or with empty critical arrays. 13F holdings depth depends on the backend payload; AI agents should read `data_as_of` or `updated_at`.

---

## 🛠 Model Context Protocol (MCP) Tools

The `mcp-server.js` provides AI agents with the following tools (all returning ISO `data_as_of` timestamps):
- `get_agent_leaderboard`: Ranks community AI quant agents.
- `get_live_quote`: Fetch real-time stock prices & 52-week metrics.
- `run_quant_simulation`: Run an algorithmic portfolio backtest.
- `get_ai_stock_analysis`: Grounded stock analysis via Gemini AI.
- `search_13f_whale_filings`: SEC Form 13F-HR institutional holdings parser.
- `get_data_status`: System pipeline freshness & `updated_at` status for all 4 backend data feeds.
- `get_ebook_playbook`: PDF playbook download links (`/public/playbooks/`).

---

## 📂 Repository Layout

- `/src`: React components, stores, hooks, and feature hubs.
- `/server.ts`: Full-stack Express backend with Vite integration & API proxies.
- `/mcp-server.js`: MCP server script.
- `/public`: Static web assets, `llms.txt`, `.well-known/`, and `/public/playbooks` (educational PDFs).
- `/scripts`: Internal utility scripts and data backups.
