import fs from 'fs';
import path from 'path';
import { fetchRealStockQuote } from './marketQuoteService.js';

export interface NormalizedLaunchItem {
  id: string;
  name: string;
  missionName: string;
  provider: string;
  rocket: string;
  launchSite: string;
  net: string;
  date_utc: string;
  windowStart: string | null;
  windowEnd: string | null;
  status: string;
  statusAbbrev: string;
  missionDescription: string;
  missionType: string;
  orbitName: string | null;
  image: string | null;
  url: string | null;
  webcastUrl: string;
}

export interface LaunchesResponse {
  upcoming: NormalizedLaunchItem[];
  past: NormalizedLaunchItem[];
  asOf: string;
  source: string;
  stale: boolean;
}

export interface StarlinkCatalogSummary {
  totalInOrbit: number;
  operationalCount: number;
  raisingOrPartialCount: number;
  decayedCount: number;
  latestLaunchDate: string | null;
  inclinationBreakdown: {
    shell53Deg: number;
    shell43Deg: number;
    polarSso97Deg: number;
    otherOr33To70Deg: number;
  };
  asOf: string;
  source: string;
  stale: boolean;
}

export interface SpaceNewsItem {
  id: number | string;
  title: string;
  url: string;
  image_url?: string;
  news_site: string;
  summary: string;
  published_at: string;
  updated_at?: string;
}

export interface SpaceEquityQuote {
  symbol: string;
  name: string;
  role: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  lastUpdated: string | null;
  priceLabel: string;
  available: boolean;
}

export interface SpaceQuotesResponse {
  asOf: string;
  quotes: SpaceEquityQuote[];
  unavailableTickers: string[];
}

const USER_AGENT = 'StockBloc-SpaceTelemetry/1.0 (https://stockbloc.ai.studio)';
const LAUNCH_CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes
const SATCAT_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (gentle on CelesTrak)
const NEWS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const QUOTES_CACHE_TTL_MS = 60 * 1000; // 60 seconds

function getCacheDir(): string {
  const custom = process.env.SB_DATA_DIR?.trim();
  if (custom) return custom;
  return path.join(process.cwd(), 'server', 'data');
}

function readDiskJson<T>(filename: string): T | null {
  try {
    const filePath = path.join(getCacheDir(), filename);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeDiskJson(filename: string, payload: unknown): void {
  if (process.env.NODE_ENV === 'test' && !process.env.SB_DATA_DIR) {
    return;
  }
  try {
    const dir = getCacheDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, filename);
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch {
    // Non-blocking disk persistence failure
  }
}

function normalizeLl2Launch(item: any): NormalizedLaunchItem {
  const name = String(item?.name || 'Orbital Launch');
  const parts = name.split('|').map((s: string) => s.trim());
  const rocket = parts.length > 1 ? parts[0] : String(item?.rocket?.configuration?.name || 'Launch Vehicle');
  const missionName = parts.length > 1 ? parts.slice(1).join(' | ') : name;
  const net = String(item?.net || item?.window_start || new Date().toISOString());

  return {
    id: String(item?.id || `ll2_${Math.random().toString(36).slice(2, 9)}`),
    name,
    missionName,
    provider: String(item?.lsp_name || item?.launch_service_provider?.name || 'Launch Provider'),
    rocket,
    launchSite: String(item?.location || item?.pad?.location?.name || item?.pad || 'Orbital Launch Complex'),
    net,
    date_utc: net,
    windowStart: item?.window_start || null,
    windowEnd: item?.window_end || null,
    status: String(item?.status?.name || 'Scheduled'),
    statusAbbrev: String(item?.status?.abbrev || 'TBD'),
    missionDescription: String(item?.mission || item?.mission_description || ''),
    missionType: String(item?.mission_type || 'Orbital Mission'),
    orbitName: item?.orbit?.name || null,
    image: item?.image || null,
    url: item?.url || null,
    webcastUrl:
      item?.vidURLs?.[0]?.url ||
      (String(item?.lsp_name || '').toLowerCase().includes('spacex')
        ? 'https://www.spacex.com/launches'
        : 'https://thespacedevs.com/llapi'),
  };
}

let launchesMemCache: { ts: number; data: LaunchesResponse } | null = null;
let launchesInFlight: Promise<LaunchesResponse> | null = null;

export async function getUpcomingAndRecentLaunches(forceRefresh = false): Promise<LaunchesResponse> {
  const now = Date.now();
  if (!forceRefresh && launchesMemCache && now - launchesMemCache.ts < LAUNCH_CACHE_TTL_MS) {
    return launchesMemCache.data;
  }
  if (!forceRefresh && !launchesMemCache) {
    const disk = readDiskJson<LaunchesResponse>('ll2_launches_cache.json');
    if (disk && disk.asOf) {
      const diskAge = now - new Date(disk.asOf).getTime();
      if (!Number.isNaN(diskAge) && diskAge < LAUNCH_CACHE_TTL_MS) {
        launchesMemCache = { ts: new Date(disk.asOf).getTime(), data: disk };
        return disk;
      }
    }
  }
  if (launchesInFlight) return launchesInFlight;

  launchesInFlight = (async () => {
    try {
      const headers = { 'User-Agent': USER_AGENT, Accept: 'application/json' };
      const [upRes, prevRes] = await Promise.all([
        fetch('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=12&mode=list', {
          headers,
          signal: AbortSignal.timeout(7000),
        }),
        fetch('https://ll.thespacedevs.com/2.2.0/launch/previous/?limit=8&mode=list', {
          headers,
          signal: AbortSignal.timeout(7000),
        }),
      ]);

      if (!upRes.ok && !prevRes.ok) {
        throw new Error(`Launch Library 2 HTTP ${upRes.status}/${prevRes.status}`);
      }

      const upJson: any = upRes.ok ? await upRes.json() : { results: [] };
      const prevJson: any = prevRes.ok ? await prevRes.json() : { results: [] };

      const upcoming = Array.isArray(upJson?.results) ? upJson.results.map(normalizeLl2Launch) : [];
      const past = Array.isArray(prevJson?.results) ? prevJson.results.map(normalizeLl2Launch) : [];

      const payload: LaunchesResponse = {
        upcoming,
        past,
        asOf: new Date().toISOString(),
        source: 'Launch Library 2 (thespacedevs.com)',
        stale: false,
      };

      launchesMemCache = { ts: Date.now(), data: payload };
      writeDiskJson('ll2_launches_cache.json', payload);
      return payload;
    } catch {
      if (launchesMemCache?.data) {
        return {
          ...launchesMemCache.data,
          stale: true,
          source: `${launchesMemCache.data.source} (cached)`,
        };
      }
      const disk = readDiskJson<LaunchesResponse>('ll2_launches_cache.json');
      if (disk) {
        return {
          ...disk,
          stale: true,
          source: `${disk.source} (cached)`,
        };
      }
      return {
        upcoming: [],
        past: [],
        asOf: new Date().toISOString(),
        source: 'Launch Library 2 unavailable',
        stale: true,
      };
    } finally {
      launchesInFlight = null;
    }
  })();

  return launchesInFlight;
}

let satcatMemCache: { ts: number; data: StarlinkCatalogSummary } | null = null;
let satcatInFlight: Promise<StarlinkCatalogSummary> | null = null;

export async function getStarlinkCatalogSummary(forceRefresh = false): Promise<StarlinkCatalogSummary> {
  const now = Date.now();
  if (!forceRefresh && satcatMemCache && now - satcatMemCache.ts < SATCAT_CACHE_TTL_MS) {
    return satcatMemCache.data;
  }
  if (!forceRefresh && !satcatMemCache) {
    const disk = readDiskJson<StarlinkCatalogSummary>('celestrak_starlink_cache.json');
    if (disk && disk.asOf) {
      const diskAge = now - new Date(disk.asOf).getTime();
      if (!Number.isNaN(diskAge) && diskAge < SATCAT_CACHE_TTL_MS) {
        satcatMemCache = { ts: new Date(disk.asOf).getTime(), data: disk };
        return disk;
      }
    }
  }
  if (satcatInFlight) return satcatInFlight;

  satcatInFlight = (async () => {
    try {
      const res = await fetch('https://celestrak.org/satcat/records.php?GROUP=starlink&FORMAT=json', {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        throw new Error(`CelesTrak SATCAT HTTP ${res.status}`);
      }
      const records: any = await res.json();
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error('CelesTrak SATCAT returned empty payload');
      }

      let totalInOrbit = 0;
      let operationalCount = 0;
      let raisingOrPartialCount = 0;
      let decayedCount = 0;
      let latestLaunchDate: string | null = null;
      const inc = {
        shell53Deg: 0,
        shell43Deg: 0,
        polarSso97Deg: 0,
        otherOr33To70Deg: 0,
      };

      for (const row of records) {
        const decayDate = row?.DECAY_DATE ? String(row.DECAY_DATE).trim() : '';
        if (decayDate) {
          decayedCount++;
          continue;
        }
        totalInOrbit++;
        const ops = String(row?.OPS_STATUS_CODE || '').trim();
        if (ops === '+') {
          operationalCount++;
        } else {
          raisingOrPartialCount++;
        }
        const launchDate = row?.LAUNCH_DATE ? String(row.LAUNCH_DATE).trim() : '';
        if (launchDate && (!latestLaunchDate || launchDate > latestLaunchDate)) {
          latestLaunchDate = launchDate;
        }
        const deg = Number(row?.INCLINATION);
        if (!Number.isNaN(deg)) {
          if (deg >= 51 && deg <= 56) inc.shell53Deg++;
          else if (deg >= 40 && deg < 51) inc.shell43Deg++;
          else if (deg >= 95 && deg <= 102) inc.polarSso97Deg++;
          else inc.otherOr33To70Deg++;
        }
      }

      const summary: StarlinkCatalogSummary = {
        totalInOrbit,
        operationalCount,
        raisingOrPartialCount,
        decayedCount,
        latestLaunchDate,
        inclinationBreakdown: inc,
        asOf: new Date().toISOString(),
        source: 'CelesTrak SATCAT Catalog (celestrak.org/satcat)',
        stale: false,
      };

      satcatMemCache = { ts: Date.now(), data: summary };
      writeDiskJson('celestrak_starlink_cache.json', summary);
      return summary;
    } catch {
      if (satcatMemCache?.data) {
        return {
          ...satcatMemCache.data,
          stale: true,
          source: `${satcatMemCache.data.source} (cached)`,
        };
      }
      const disk = readDiskJson<StarlinkCatalogSummary>('celestrak_starlink_cache.json');
      if (disk) {
        return {
          ...disk,
          stale: true,
          source: `${disk.source} (cached)`,
        };
      }
      return {
        totalInOrbit: 0,
        operationalCount: 0,
        raisingOrPartialCount: 0,
        decayedCount: 0,
        latestLaunchDate: null,
        inclinationBreakdown: {
          shell53Deg: 0,
          shell43Deg: 0,
          polarSso97Deg: 0,
          otherOr33To70Deg: 0,
        },
        asOf: new Date().toISOString(),
        source: 'CelesTrak SATCAT unavailable',
        stale: true,
      };
    } finally {
      satcatInFlight = null;
    }
  })();

  return satcatInFlight;
}

let newsMemCache: { ts: number; data: { items: SpaceNewsItem[]; asOf: string; source: string; stale: boolean } } | null = null;
let newsInFlight: Promise<{ items: SpaceNewsItem[]; asOf: string; source: string; stale: boolean }> | null = null;

export async function getSpaceNewsFeed(forceRefresh = false): Promise<{
  items: SpaceNewsItem[];
  asOf: string;
  source: string;
  stale: boolean;
}> {
  const now = Date.now();
  if (!forceRefresh && newsMemCache && now - newsMemCache.ts < NEWS_CACHE_TTL_MS) {
    return newsMemCache.data;
  }
  if (newsInFlight) return newsInFlight;

  newsInFlight = (async () => {
    try {
      const res = await fetch('https://api.spaceflightnewsapi.net/v4/articles?limit=15', {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        throw new Error(`Spaceflight News v4 HTTP ${res.status}`);
      }
      const json: any = await res.json();
      const items: SpaceNewsItem[] = Array.isArray(json?.results) ? json.results : [];
      const newestPublished = items[0]?.published_at || new Date().toISOString();

      const payload = {
        items,
        asOf: newestPublished,
        source: 'Spaceflight News API v4 (spaceflightnewsapi.net)',
        stale: false,
      };
      newsMemCache = { ts: Date.now(), data: payload };
      writeDiskJson('space_news_cache.json', payload);
      return payload;
    } catch {
      if (newsMemCache?.data) {
        return {
          ...newsMemCache.data,
          stale: true,
          source: `${newsMemCache.data.source} (cached)`,
        };
      }
      const disk = readDiskJson<{ items: SpaceNewsItem[]; asOf: string; source: string; stale: boolean }>('space_news_cache.json');
      if (disk) {
        return { ...disk, stale: true, source: `${disk.source} (cached)` };
      }
      return {
        items: [],
        asOf: new Date().toISOString(),
        source: 'Spaceflight News API v4 unavailable',
        stale: true,
      };
    } finally {
      newsInFlight = null;
    }
  })();

  return newsInFlight;
}

const SPACE_POWER_EQUITIES: Array<{ symbol: string; name: string; role: string }> = [
  { symbol: 'RKLB', name: 'Rocket Lab USA', role: 'Orbital Launch & Spacecraft' },
  { symbol: 'ASTS', name: 'AST SpaceMobile', role: 'Direct-to-Cell LEO Broadband' },
  { symbol: 'LUNR', name: 'Intuitive Machines', role: 'Lunar Surface Delivery' },
  { symbol: 'PL', name: 'Planet Labs PBC', role: 'Daily Earth Observation Fleet' },
  { symbol: 'BE', name: 'Bloom Energy', role: 'On-Site AI Solid-Oxide Power' },
  { symbol: 'CEG', name: 'Constellation Energy', role: 'Baseload Nuclear PPAs' },
  { symbol: 'TLN', name: 'Talen Energy', role: 'Co-Located Data Center Power' },
];

let quotesMemCache: { ts: number; data: SpaceQuotesResponse } | null = null;

export async function getSpaceTelemetryQuotes(forceRefresh = false): Promise<SpaceQuotesResponse> {
  const now = Date.now();
  if (!forceRefresh && quotesMemCache && now - quotesMemCache.ts < QUOTES_CACHE_TTL_MS) {
    return quotesMemCache.data;
  }

  const results = await Promise.allSettled(
    SPACE_POWER_EQUITIES.map(async (item) => {
      const q = await fetchRealStockQuote(item.symbol, forceRefresh);
      return { item, q };
    })
  );

  const quotes: SpaceEquityQuote[] = [];
  const unavailableTickers: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const entry = SPACE_POWER_EQUITIES[i];
    const settled = results[i];
    if (settled.status === 'fulfilled' && settled.value.q && typeof settled.value.q.price === 'number') {
      const q = settled.value.q;
      quotes.push({
        symbol: entry.symbol,
        name: q.name || entry.name,
        role: entry.role,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        lastUpdated: q.lastUpdated || q.data_as_of || null,
        priceLabel: q.priceLabel || 'Market Quote',
        available: true,
      });
    } else {
      unavailableTickers.push(entry.symbol);
      quotes.push({
        symbol: entry.symbol,
        name: entry.name,
        role: entry.role,
        price: null,
        change: null,
        changePercent: null,
        lastUpdated: null,
        priceLabel: 'Unavailable',
        available: false,
      });
    }
  }

  const payload: SpaceQuotesResponse = {
    asOf: new Date().toISOString(),
    quotes,
    unavailableTickers,
  };
  quotesMemCache = { ts: Date.now(), data: payload };
  return payload;
}

export async function getDysonFeedSummary(forceRefresh = false) {
  const [launches, satcat, news] = await Promise.all([
    getUpcomingAndRecentLaunches(forceRefresh),
    getStarlinkCatalogSummary(forceRefresh),
    getSpaceNewsFeed(forceRefresh),
  ]);

  const nowMs = Date.now();
  const nextConfirmedLaunch =
    launches.upcoming.find((l) => {
      const t = new Date(l.net).getTime();
      return !Number.isNaN(t) && t > nowMs;
    }) || null;

  const timestamps = [launches.asOf, satcat.asOf, news.asOf]
    .map((iso) => new Date(iso).getTime())
    .filter((ms) => !Number.isNaN(ms) && ms > 0);
  const newestUpstreamMs = timestamps.length > 0 ? Math.max(...timestamps) : 0;
  const realUpdatedAt = newestUpstreamMs > 0 ? new Date(newestUpstreamMs).toISOString() : null;
  const allDown = launches.stale && satcat.stale && news.stale && launches.upcoming.length === 0 && satcat.totalInOrbit === 0 && news.items.length === 0;

  return {
    status: allDown ? 'unavailable' : 'ok',
    updated_at: realUpdatedAt,
    source: 'Launch Library 2 / CelesTrak SATCAT / Spaceflight News v4',
    stale: allDown || (satcat.stale && launches.stale && news.stale),
    fleet_metrics: {
      active_satellites: satcat.operationalCount > 0 ? satcat.operationalCount : null,
      total_in_orbit: satcat.totalInOrbit > 0 ? satcat.totalInOrbit : null,
      raising_or_partial: satcat.raisingOrPartialCount,
      decayed_historical: satcat.decayedCount,
      latest_starlink_launch_date: satcat.latestLaunchDate,
      inclination_breakdown: satcat.inclinationBreakdown,
      satcat_as_of: satcat.asOf,
      satcat_source: satcat.source,
      satcat_stale: satcat.stale,
    },
    next_launch: nextConfirmedLaunch,
    upcoming_launches_count: launches.upcoming.length,
    recent_news_as_of: news.asOf,
  };
}
