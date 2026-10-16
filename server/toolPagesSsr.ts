import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { issueUiCookie } from './uiSession.js';

export interface ToolPageSpec {
  canonicalSlug: string;
  aliases: string[];
  name: string;
  badge: string;
  category: string;
  title: string;
  description: string;
  endpointMethod: string;
  endpointPath: string;
  priceDisplay: string;
  priceUsd: number;
  freeInfoPage?: string;
  structuredSection: string;
}

function escapeXml(unsafe: string): string {
  return String(unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export const TOOL_PAGES: Record<string, ToolPageSpec> = {
  sec: {
    canonicalSlug: 'sec',
    aliases: ['sec', 'sec-analyst', 'sec-job', 'sec-filing', 'sec-filings'],
    name: 'Stock Bloc SEC Analyst',
    badge: 'SEC ANALYST',
    category: 'SEC & Fundamental Intelligence',
    title: 'Stock Bloc SEC Analyst | Form 10-K, 10-Q & 8-K Filing Analysis',
    description: 'Stock Bloc SEC Analyst: Autonomous Form 10-K, 10-Q, and 8-K filing analysis, revenue quality checks, and risk factor audits. Paid endpoint: POST /api/v1/sec/job with {"ticker":"AAPL","filingType":"10-K"} ($0.05 USDC). Free info page: GET /api/v1/sec/analyst.',
    endpointMethod: 'POST',
    endpointPath: '/api/v1/sec/job',
    priceDisplay: '$0.05',
    priceUsd: 0.05,
    freeInfoPage: 'GET /api/v1/sec/analyst',
    structuredSection: `<section id="tool-details" class="tool-spec" data-tool="sec" data-canonical-url="https://stockbloc.ai.studio/tools/sec">
  <header>
    <h1>Stock Bloc SEC Analyst</h1>
    <p class="tool-tagline">Autonomous SEC Form 10-K, 10-Q, and 8-K filing analysis, revenue quality audits, and forensic accounting risk checks.</p>
  </header>
  <div class="tool-endpoints">
    <h2>API Endpoints</h2>
    <div class="endpoint-item paid-endpoint">
      <h3>Paid Analysis Job: <code>POST /api/v1/sec/job</code></h3>
      <p class="price-badge">Price: <strong>$0.05 USDC</strong> (via x402 pay-per-call on Base)</p>
      <p>Request payload example:</p>
      <pre><code>{"ticker":"AAPL","filingType":"10-K"}</code></pre>
      <pre><code>{"ticker":"AAPL","filingType":"10-K","mode":"diff"}</code></pre>
    </div>
    <div class="endpoint-item free-endpoint">
      <h3>Free Information &amp; Status Page: <code>GET /api/v1/sec/analyst</code></h3>
      <p>Free documentation, capability status, and model specifications.</p>
    </div>
  </div>
  <div class="tool-settlement">
    <h2>Payment Protocol</h2>
    <p>Settled via x402 protocol in USDC on Base (network: <code>eip155:8453</code>, contract: <code>0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</code>).</p>
  </div>
  <div class="tool-discovery">
    <h2>Machine Discovery &amp; Specifications</h2>
    <ul>
      <li><a href="https://stockbloc.ai.studio/.well-known/x402" rel="discovery">x402 Protocol Specification (/.well-known/x402)</a></li>
      <li><a href="https://stockbloc.ai.studio/openapi.json" rel="service-desc">OpenAPI 3.1 Specification (/openapi.json)</a></li>
      <li><a href="https://stockbloc.ai.studio/agents/manifest.json" rel="manifest">Agent Capability Manifest (/agents/manifest.json)</a></li>
    </ul>
  </div>
</section>`
  },

  'market-data': {
    canonicalSlug: 'market-data',
    aliases: ['market-data', 'market', 'quote', 'quotes', 'stock-quote'],
    name: 'Stock quotes for US tickers',
    badge: 'MARKET DATA',
    category: 'Market Equities',
    title: 'Stock Bloc Market Data | Stock quotes for US tickers',
    description: 'Stock quotes for US tickers with pricing, market capitalization, volume, and valuation ratios. Endpoint: GET /api/v1/market/quote?symbol=AAPL ($0.01 USDC via x402 on Base).',
    endpointMethod: 'GET',
    endpointPath: '/api/v1/market/quote?symbol=AAPL',
    priceDisplay: '$0.01',
    priceUsd: 0.01,
    structuredSection: `<section id="tool-details" class="tool-spec" data-tool="market-data" data-canonical-url="https://stockbloc.ai.studio/tools/market-data">
  <header>
    <h1>Stock quotes for US tickers</h1>
    <p class="tool-tagline">Stock quotes for US tickers with pricing, market capitalization, volume, and valuation ratios.</p>
  </header>
  <div class="tool-endpoints">
    <h2>API Endpoints</h2>
    <div class="endpoint-item paid-endpoint">
      <h3>Stock Quote Endpoint: <code>GET /api/v1/market/quote?symbol=AAPL</code></h3>
      <p class="price-badge">Price: <strong>$0.01 USDC</strong> (via x402 pay-per-call on Base)</p>
      <p>Query parameters: <code>symbol</code> (US stock ticker symbol, e.g. AAPL, NVDA, MSFT)</p>
    </div>
  </div>
  <div class="tool-settlement">
    <h2>Payment Protocol</h2>
    <p>Settled via x402 protocol in USDC on Base (network: <code>eip155:8453</code>, contract: <code>0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</code>).</p>
  </div>
  <div class="tool-discovery">
    <h2>Machine Discovery &amp; Specifications</h2>
    <ul>
      <li><a href="https://stockbloc.ai.studio/.well-known/x402" rel="discovery">x402 Protocol Specification (/.well-known/x402)</a></li>
      <li><a href="https://stockbloc.ai.studio/openapi.json" rel="service-desc">OpenAPI 3.1 Specification (/openapi.json)</a></li>
      <li><a href="https://stockbloc.ai.studio/agents/manifest.json" rel="manifest">Agent Capability Manifest (/agents/manifest.json)</a></li>
    </ul>
  </div>
</section>`
  },

  '13f': {
    canonicalSlug: '13f',
    aliases: ['13f', '13f-intel', '13f-filings', 'hedge-funds'],
    name: 'SEC 13F Institutional Whale Holdings',
    badge: '13F INTEL',
    category: 'Institutional Holdings',
    title: 'Stock Bloc 13F Whale Intel | Institutional Holdings & Filings',
    description: 'Holdings are from quarterly SEC 13F-HR filings, not real-time. Paid endpoint: GET /api/data/sec ($0.10 USDC via x402 on Base).',
    endpointMethod: 'GET',
    endpointPath: '/api/data/sec',
    priceDisplay: '$0.10',
    priceUsd: 0.10,
    structuredSection: `<section id="tool-details" class="tool-spec" data-tool="13f" data-canonical-url="https://stockbloc.ai.studio/tools/13f">
  <header>
    <h1>SEC 13F Institutional Whale Holdings</h1>
    <p class="tool-tagline">Holdings are from quarterly SEC 13F-HR filings, not real-time. Track institutional smart money accumulation and quarterly hedge fund shifts.</p>
  </header>
  <div class="tool-endpoints">
    <h2>API Endpoints</h2>
    <div class="endpoint-item paid-endpoint">
      <h3>13F Institutional Holdings Dataset: <code>GET /api/data/sec</code></h3>
      <p class="price-badge">Price: <strong>$0.10 USDC</strong> (via x402 pay-per-call on Base)</p>
      <p>Data provenance: Holdings are from quarterly SEC 13F-HR filings, not real-time.</p>
    </div>
  </div>
  <div class="tool-settlement">
    <h2>Payment Protocol</h2>
    <p>Settled via x402 protocol in USDC on Base (network: <code>eip155:8453</code>, contract: <code>0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</code>).</p>
  </div>
  <div class="tool-discovery">
    <h2>Machine Discovery &amp; Specifications</h2>
    <ul>
      <li><a href="https://stockbloc.ai.studio/.well-known/x402" rel="discovery">x402 Protocol Specification (/.well-known/x402)</a></li>
      <li><a href="https://stockbloc.ai.studio/openapi.json" rel="service-desc">OpenAPI 3.1 Specification (/openapi.json)</a></li>
      <li><a href="https://stockbloc.ai.studio/agents/manifest.json" rel="manifest">Agent Capability Manifest (/agents/manifest.json)</a></li>
    </ul>
  </div>
</section>`
  },

  forecast: {
    canonicalSlug: 'forecast',
    aliases: ['forecast', 'forecasts', 'price-forecast'],
    name: 'Quantitative Price Forecasts',
    badge: 'FORECASTS',
    category: 'Predictive Intelligence',
    title: 'Stock Bloc Price Forecasts | Brier-Calibrated Market Forecasts',
    description: 'Brier-calibrated quantitative stock price forecasts with probabilistic confidence intervals. Paid endpoint: POST /api/v1/intelligence/forecasts ($0.05 USDC via x402 on Base).',
    endpointMethod: 'POST',
    endpointPath: '/api/v1/intelligence/forecasts',
    priceDisplay: '$0.05',
    priceUsd: 0.05,
    structuredSection: `<section id="tool-details" class="tool-spec" data-tool="forecast" data-canonical-url="https://stockbloc.ai.studio/tools/forecast">
  <header>
    <h1>Quantitative Price Forecasts</h1>
    <p class="tool-tagline">Brier-calibrated directional stock price forecasts with probabilistic confidence intervals and verifiable track records.</p>
  </header>
  <div class="tool-endpoints">
    <h2>API Endpoints</h2>
    <div class="endpoint-item paid-endpoint">
      <h3>Price Forecast Endpoint: <code>POST /api/v1/intelligence/forecasts</code></h3>
      <p class="price-badge">Price: <strong>$0.05 USDC</strong> (via x402 pay-per-call on Base)</p>
      <p>Request payload example:</p>
      <pre><code>{"ticker":"NVDA","timeframe":"30d","expectedDirection":"bullish","confidence":0.78}</code></pre>
    </div>
  </div>
  <div class="tool-settlement">
    <h2>Payment Protocol</h2>
    <p>Settled via x402 protocol in USDC on Base (network: <code>eip155:8453</code>, contract: <code>0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</code>).</p>
  </div>
  <div class="tool-discovery">
    <h2>Machine Discovery &amp; Specifications</h2>
    <ul>
      <li><a href="https://stockbloc.ai.studio/.well-known/x402" rel="discovery">x402 Protocol Specification (/.well-known/x402)</a></li>
      <li><a href="https://stockbloc.ai.studio/openapi.json" rel="service-desc">OpenAPI 3.1 Specification (/openapi.json)</a></li>
      <li><a href="https://stockbloc.ai.studio/agents/manifest.json" rel="manifest">Agent Capability Manifest (/agents/manifest.json)</a></li>
    </ul>
  </div>
</section>`
  },

  research: {
    canonicalSlug: 'research',
    aliases: ['research', 'research-memo', 'memo'],
    name: 'Institutional Research Memos',
    badge: 'RESEARCH MEMOS',
    category: 'Quantitative Research',
    title: 'Stock Bloc Research Memos | Institutional Quant Theses',
    description: 'Institutional quantitative investment research memos and peer-reviewed market theses. Paid endpoint: POST /api/v1/intelligence/research ($0.10 USDC via x402 on Base).',
    endpointMethod: 'POST',
    endpointPath: '/api/v1/intelligence/research',
    priceDisplay: '$0.10',
    priceUsd: 0.10,
    structuredSection: `<section id="tool-details" class="tool-spec" data-tool="research" data-canonical-url="https://stockbloc.ai.studio/tools/research">
  <header>
    <h1>Institutional Research Memos</h1>
    <p class="tool-tagline">Publish and access peer-reviewed quantitative investment research memos and thesis models.</p>
  </header>
  <div class="tool-endpoints">
    <h2>API Endpoints</h2>
    <div class="endpoint-item paid-endpoint">
      <h3>Research Memo Endpoint: <code>POST /api/v1/intelligence/research</code></h3>
      <p class="price-badge">Price: <strong>$0.10 USDC</strong> (via x402 pay-per-call on Base)</p>
      <p>Request payload example:</p>
      <pre><code>{"ticker":"NVDA","title":"Semiconductor Supply Chain Analysis","content":"Hyperscaler CapEx backtests..."}</code></pre>
    </div>
  </div>
  <div class="tool-settlement">
    <h2>Payment Protocol</h2>
    <p>Settled via x402 protocol in USDC on Base (network: <code>eip155:8453</code>, contract: <code>0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</code>).</p>
  </div>
  <div class="tool-discovery">
    <h2>Machine Discovery &amp; Specifications</h2>
    <ul>
      <li><a href="https://stockbloc.ai.studio/.well-known/x402" rel="discovery">x402 Protocol Specification (/.well-known/x402)</a></li>
      <li><a href="https://stockbloc.ai.studio/openapi.json" rel="service-desc">OpenAPI 3.1 Specification (/openapi.json)</a></li>
      <li><a href="https://stockbloc.ai.studio/agents/manifest.json" rel="manifest">Agent Capability Manifest (/agents/manifest.json)</a></li>
    </ul>
  </div>
</section>`
  },

  'sb-score': {
    canonicalSlug: 'sb-score',
    aliases: ['sb-score', 'sbscore', 'score'],
    name: 'Stock Bloc SB Score Factor Model',
    badge: 'SB SCORE',
    category: 'Quantitative Ratings',
    title: 'Stock Bloc SB Score | Quant Factor Model & Stock Rating',
    description: 'Audited 0-100 composite quantitative factor score across Momentum, Trend, RSI, Volume, and Volatility. Paid endpoint: GET /api/v1/intelligence/sb-score?ticker=AAPL ($0.05 USDC via x402 on Base).',
    endpointMethod: 'GET',
    endpointPath: '/api/v1/intelligence/sb-score?ticker=AAPL',
    priceDisplay: '$0.05',
    priceUsd: 0.05,
    structuredSection: `<section id="tool-details" class="tool-spec" data-tool="sb-score" data-canonical-url="https://stockbloc.ai.studio/tools/sb-score">
  <header>
    <h1>Stock Bloc SB Score</h1>
    <p class="tool-tagline">Audited 0-100 quantitative composite score across Momentum, Trend, RSI, Volume, and Volatility.</p>
  </header>
  <div class="tool-endpoints">
    <h2>API Endpoints</h2>
    <div class="endpoint-item paid-endpoint">
      <h3>SB Score Endpoint: <code>GET /api/v1/intelligence/sb-score?ticker=AAPL</code></h3>
      <p class="price-badge">Price: <strong>$0.05 USDC</strong> (via x402 pay-per-call on Base)</p>
      <p>Query parameters: <code>ticker</code> (US stock ticker, e.g. AAPL, NVDA, TSLA, PLTR)</p>
    </div>
  </div>
  <div class="tool-settlement">
    <h2>Payment Protocol</h2>
    <p>Settled via x402 protocol in USDC on Base (network: <code>eip155:8453</code>, contract: <code>0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</code>).</p>
  </div>
  <div class="tool-discovery">
    <h2>Machine Discovery &amp; Specifications</h2>
    <ul>
      <li><a href="https://stockbloc.ai.studio/.well-known/x402" rel="discovery">x402 Protocol Specification (/.well-known/x402)</a></li>
      <li><a href="https://stockbloc.ai.studio/openapi.json" rel="service-desc">OpenAPI 3.1 Specification (/openapi.json)</a></li>
      <li><a href="https://stockbloc.ai.studio/agents/manifest.json" rel="manifest">Agent Capability Manifest (/agents/manifest.json)</a></li>
    </ul>
  </div>
</section>`
  }
};

export function resolveToolSpec(rawSlug: string): ToolPageSpec | null {
  if (!rawSlug) return null;
  const slug = rawSlug.trim().toLowerCase();
  return TOOL_PAGES[slug] || null;
}

export function getBaseIndexHtml(): string {
  const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
  if (fs.existsSync(distIndexPath)) {
    return fs.readFileSync(distIndexPath, 'utf-8');
  }
  const rootIndexPath = path.join(process.cwd(), 'index.html');
  if (fs.existsSync(rootIndexPath)) {
    return fs.readFileSync(rootIndexPath, 'utf-8');
  }
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Stock Bloc</title></head><body><div id="root"></div></body></html>';
}

export function renderToolPageHtml(tool: ToolPageSpec, reqHost: string): string {
  let html = getBaseIndexHtml();
  const canonicalUrl = `https://${reqHost}/tools/${tool.canonicalSlug}`;
  const ogImageUrl = `https://${reqHost}/api/og?title=${encodeURIComponent(tool.name)}&subtitle=${encodeURIComponent(tool.priceDisplay + ' USDC via x402 on Base')}&badge=${encodeURIComponent(tool.badge)}&category=Tools`;

  // 1. Title tag
  if (/<title>.*?<\/title>/i.test(html)) {
    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeXml(tool.title)}</title>`);
  } else {
    html = html.replace(/<\/head>/i, `<title>${escapeXml(tool.title)}</title></head>`);
  }

  // 2. Meta description
  if (/<meta\s+name="description"\s+content=".*?"\s*\/?>/i.test(html)) {
    html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${escapeXml(tool.description)}" />`);
  } else {
    html = html.replace(/<\/head>/i, `<meta name="description" content="${escapeXml(tool.description)}" /></head>`);
  }

  // 3. Canonical link
  if (/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i.test(html)) {
    html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i, `<link rel="canonical" href="${escapeXml(canonicalUrl)}" />`);
  } else {
    html = html.replace(/<\/head>/i, `<link rel="canonical" href="${escapeXml(canonicalUrl)}" /></head>`);
  }

  // 4. OpenGraph tags
  const ogTags = [
    { prop: 'og:title', content: tool.title },
    { prop: 'og:description', content: tool.description },
    { prop: 'og:url', content: canonicalUrl },
    { prop: 'og:image', content: ogImageUrl },
    { prop: 'og:type', content: 'website' }
  ];

  for (const tag of ogTags) {
    const regex = new RegExp(`<meta\\s+property="${tag.prop}"\\s+content=".*?"\\s*\\/?>`, 'i');
    if (regex.test(html)) {
      html = html.replace(regex, `<meta property="${tag.prop}" content="${escapeXml(tag.content)}" />`);
    } else {
      html = html.replace(/<\/head>/i, `<meta property="${tag.prop}" content="${escapeXml(tag.content)}" /></head>`);
    }
  }

  // 5. Twitter card tags
  const twitterTags = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: tool.title },
    { name: 'twitter:description', content: tool.description },
    { name: 'twitter:image', content: ogImageUrl }
  ];

  for (const tag of twitterTags) {
    const regex = new RegExp(`<meta\\s+name="${tag.name}"\\s+content=".*?"\\s*\\/?>`, 'i');
    if (regex.test(html)) {
      html = html.replace(regex, `<meta name="${tag.name}" content="${escapeXml(tag.content)}" />`);
    } else {
      html = html.replace(/<\/head>/i, `<meta name="${tag.name}" content="${escapeXml(tag.content)}" /></head>`);
    }
  }

  // 6. Discovery links in head
  const discoveryHead = `<link rel="discovery" href="https://stockbloc.ai.studio/.well-known/x402" />\n<link rel="service-desc" href="https://stockbloc.ai.studio/openapi.json" />\n<link rel="manifest" href="https://stockbloc.ai.studio/agents/manifest.json" />`;
  html = html.replace(/<\/head>/i, `${discoveryHead}\n</head>`);

  // 7. Inject structured section so curl/bots see it immediately without JavaScript
  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', `<div id="root">\n${tool.structuredSection}\n</div>`);
  } else if (html.includes('<div id="root">')) {
    html = html.replace('<div id="root">', `<div id="root">\n${tool.structuredSection}\n`);
  } else {
    html = html.replace(/<body[^>]*>/i, (m) => `${m}\n${tool.structuredSection}\n`);
  }

  return html;
}

export function handleToolPageRequest(req: Request, res: Response): void {
  const rawParam = req.params?.slug || (req.params as any)?.[0] || req.path.replace(/^\/tools\/?/, '');
  const slug = (rawParam || '').trim().toLowerCase();

  // Legacy tool URL redirects: preserve path and query
  const LEGACY_TOOL_REDIRECTS: Record<string, string> = {
    'sec-analyst': '/tools/sec',
    'sec-13f': '/tools/13f',
    'research-memo': '/tools/research',
  };

  let redirectTarget: string | null = null;
  for (const [oldSlug, newPath] of Object.entries(LEGACY_TOOL_REDIRECTS)) {
    if (slug === oldSlug) {
      redirectTarget = newPath;
      break;
    } else if (slug.startsWith(oldSlug + '/')) {
      redirectTarget = newPath + slug.slice(oldSlug.length);
      break;
    }
  }

  if (redirectTarget) {
    const search = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(301, redirectTarget + search);
    return;
  }

  const tool = resolveToolSpec(slug);

  if (!tool) {
    if (req.accepts && req.accepts('json') && !req.accepts('html')) {
      res.status(404).json({
        status: 'error',
        code: 'TOOL_NOT_FOUND',
        message: `Unknown tool slug: ${slug}`,
        availableTools: ['sec', 'market-data', '13f', 'forecast', 'research', 'sb-score']
      });
      return;
    }
    res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>404 Tool Not Found | Stock Bloc</title>
    <meta name="robots" content="noindex" />
  </head>
  <body style="font-family: sans-serif; background: #0a0a0a; color: #f3f4f6; padding: 2rem;">
    <h1 style="color: #f43f5e;">404 Tool Not Found</h1>
    <p>Unknown tool slug: <code>${escapeXml(slug)}</code></p>
    <p>Available tools:</p>
    <ul>
      <li><a href="/tools/sec" style="color: #00f2ff;">SEC Analyst (/tools/sec)</a></li>
      <li><a href="/tools/market-data" style="color: #00f2ff;">Stock quotes for US tickers (/tools/market-data)</a></li>
      <li><a href="/tools/13f" style="color: #00f2ff;">SEC 13F Whale Intel (/tools/13f)</a></li>
      <li><a href="/tools/forecast" style="color: #00f2ff;">Price Forecasts (/tools/forecast)</a></li>
      <li><a href="/tools/research" style="color: #00f2ff;">Research Memos (/tools/research)</a></li>
      <li><a href="/tools/sb-score" style="color: #00f2ff;">SB Score (/tools/sb-score)</a></li>
    </ul>
  </body>
</html>`);
    return;
  }

  try {
    issueUiCookie(res);
  } catch (cookieErr) {
    // Non-fatal if headers sent or mock
  }

  const host = (req.get ? req.get('host') : req.headers?.host) || 'stockbloc.ai.studio';
  const html = renderToolPageHtml(tool, host);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.send(html);
}
