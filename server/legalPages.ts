import type { Express, Request, Response } from 'express';

const SHARED_STYLES = `
  :root {
    --bg: #030712;
    --card-bg: #0b1120;
    --card-border: #1e293b;
    --accent: #22d3ee;
    --text: #f8fafc;
    --text-body: #e2e8f0;
    --text-muted: #94a3b8;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    background-color: var(--bg);
    color: var(--text-body);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.65;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    padding: 1.25rem 1rem 3rem;
  }
  .page-wrap {
    max-width: 760px;
    margin: 0 auto;
  }
  .top-nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 1.25rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--card-border);
    font-size: 0.875rem;
  }
  .top-nav a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
  }
  .top-nav a:hover {
    text-decoration: underline;
  }
  .top-nav-links {
    display: flex;
    gap: 1.25rem;
  }
  main {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 12px;
    padding: 1.75rem 1.25rem;
  }
  @media (min-width: 640px) {
    body {
      padding: 2.5rem 1.5rem 4rem;
    }
    main {
      padding: 2.5rem 2.75rem;
    }
  }
  h1 {
    color: var(--text);
    font-size: 1.75rem;
    line-height: 1.25;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }
  @media (min-width: 640px) {
    h1 {
      font-size: 2.1rem;
    }
  }
  .effective-date {
    color: var(--text-muted);
    font-size: 0.95rem;
    margin-bottom: 1.75rem;
  }
  h2 {
    color: var(--text);
    font-size: 1.2rem;
    line-height: 1.35;
    font-weight: 700;
    margin-top: 1.75rem;
    margin-bottom: 0.65rem;
  }
  p {
    margin-bottom: 1rem;
    overflow-wrap: break-word;
  }
  ul {
    margin: 0.5rem 0 1rem 1.35rem;
  }
  li {
    margin-bottom: 0.5rem;
    overflow-wrap: break-word;
  }
  a {
    color: var(--accent);
    text-decoration: underline;
    word-break: break-word;
  }
  strong {
    color: var(--text);
    font-weight: 600;
  }
  footer {
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--card-border);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    color: var(--text-muted);
    font-size: 0.875rem;
  }
  footer a {
    color: var(--accent);
    text-decoration: none;
  }
  footer a:hover {
    text-decoration: underline;
  }
  .footer-links {
    display: flex;
    gap: 1.25rem;
  }
`;

export function renderTermsPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Stock Bloc Terms of Service</title>
  <meta name="description" content="Stock Bloc Terms of Service. Effective date: November 18, 2026." />
  <link rel="canonical" href="https://stockbloc.ai.studio/terms" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://stockbloc.ai.studio/terms" />
  <meta property="og:title" content="Stock Bloc Terms of Service" />
  <meta property="og:description" content="Stock Bloc Terms of Service. Effective date: November 18, 2026." />
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="page-wrap">
    <nav class="top-nav" aria-label="Site navigation">
      <a href="/">Stock Bloc</a>
      <div class="top-nav-links">
        <a href="/terms" aria-current="page">Terms of Service</a>
        <a href="/privacy">Privacy Policy</a>
      </div>
    </nav>
    <main>
      <h1>Stock Bloc Terms of Service</h1>
      <p class="effective-date">Effective date: November 18, 2026</p>

      <h2>1. What Stock Bloc is</h2>
      <p>Stock Bloc is a financial research service at stockbloc.ai.studio. It has two parts:</p>
      <ul>
        <li>A free terminal for people: market data, quant scores, SEC filing research, and 13F institutional holdings.</li>
        <li>A pay-per-call API for AI agents: the same research, delivered over HTTP and MCP, paid per call in USDC on the Base blockchain using the x402 payment protocol.</li>
      </ul>
      <p>Stock Bloc is read-only research. It does not connect to any broker or exchange account, does not place trades, and does not hold anyone's funds.</p>

      <h2>2. No account, no API key</h2>
      <p>There is no signup and no API key. Human visitors use the free terminal directly. Agents pay per call: an unpaid call returns an HTTP 402 challenge with the price, the agent pays in USDC on Base, then retries the call.</p>

      <h2>3. Pricing</h2>
      <p>Current per-call prices, in USDC on Base:</p>
      <ul>
        <li>Market quotes: $0.01</li>
        <li>SEC 13F holdings, filing diffs, and quant scores: $0.05 to $0.10</li>
        <li>Earnings pack: $0.35</li>
      </ul>
      <p>The live price list is published at <a href="https://stockbloc.ai.studio/.well-known/x402">https://stockbloc.ai.studio/.well-known/x402</a>. Prices may change; the price in the 402 challenge at the time of the call is the price charged.</p>

      <h2>4. Payments</h2>
      <p>Payments are on-chain USDC transfers on Base, settled through the x402 protocol. Once a payment settles on-chain, it cannot be reversed by Stock Bloc. If a paid call fails to return data because of a Stock Bloc error, contact us at <a href="mailto:thestockbloc@gmail.com">thestockbloc@gmail.com</a> and we will look into it.</p>

      <h2>5. Not investment advice</h2>
      <p>Everything Stock Bloc returns is research and data, not investment advice, not a recommendation to buy or sell any security, and not a promise of returns. Do your own research. Past performance does not predict future results.</p>

      <h2>6. Data accuracy</h2>
      <p>Data comes from public sources, including SEC filings and market data providers. We work to keep it accurate and current, but we do not guarantee that any figure, score, or filing summary is complete, correct, or up to date. Filing data reflects the documents as filed; restatements and corrections happen.</p>

      <h2>7. Acceptable use</h2>
      <p>Do not use Stock Bloc to break the law, to mislead others about what the data says, to resell the service as your own without permission, or to attack, overload, or probe the service in ways that degrade it for others. We may block abusive traffic.</p>

      <h2>8. Availability</h2>
      <p>The service is provided as is, with no guarantee of uptime. We may change, suspend, or stop any part of the service at any time.</p>

      <h2>9. Liability</h2>
      <p>To the fullest extent allowed by law, Stock Bloc is not liable for trading losses, decisions made from its data, or any indirect or consequential damages. If you paid for a call, our total liability for that call is limited to the amount you paid for it.</p>

      <h2>10. Changes to these terms</h2>
      <p>We may update these terms. The version at this URL is the current one. Continued use after an update means you accept the updated terms.</p>

      <h2>11. Contact</h2>
      <p>Questions: <a href="mailto:thestockbloc@gmail.com">thestockbloc@gmail.com</a></p>
    </main>
    <footer>
      <span>Stock Bloc</span>
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/terms">Terms of Service</a>
        <a href="/privacy">Privacy Policy</a>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

export function renderPrivacyPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Stock Bloc Privacy Policy</title>
  <meta name="description" content="Stock Bloc Privacy Policy. Effective date: November 18, 2026." />
  <link rel="canonical" href="https://stockbloc.ai.studio/privacy" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://stockbloc.ai.studio/privacy" />
  <meta property="og:title" content="Stock Bloc Privacy Policy" />
  <meta property="og:description" content="Stock Bloc Privacy Policy. Effective date: November 18, 2026." />
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="page-wrap">
    <nav class="top-nav" aria-label="Site navigation">
      <a href="/">Stock Bloc</a>
      <div class="top-nav-links">
        <a href="/terms">Terms of Service</a>
        <a href="/privacy" aria-current="page">Privacy Policy</a>
      </div>
    </nav>
    <main>
      <h1>Stock Bloc Privacy Policy</h1>
      <p class="effective-date">Effective date: November 18, 2026</p>

      <h2>1. The short version</h2>
      <p>Stock Bloc has no accounts, no signup, and no API keys. We do not ask for your name, email, or any personal information to use the service. The main thing to know: agent payments are on-chain USDC transfers on the Base blockchain, and wallet addresses in on-chain payments are public by design.</p>

      <h2>2. What we collect</h2>
      <ul>
        <li><strong>Agent payments:</strong> When an agent pays for a call, the payment is a USDC transfer on Base. The paying wallet address, amount, and transaction are recorded on the public blockchain. We do not link wallet addresses to real-world identities.</li>
        <li><strong>Server logs:</strong> Like most websites, our servers may log request details (time, endpoint, response status) to operate, debug, and protect the service. We do not use these logs to identify individuals.</li>
        <li><strong>Emails you send us:</strong> If you email <a href="mailto:thestockbloc@gmail.com">thestockbloc@gmail.com</a>, we receive whatever you include in that email.</li>
      </ul>

      <h2>3. What we do not collect</h2>
      <p>No accounts, no passwords, no tracking cookies for advertising, no sale of personal data. We do not run ads on the service.</p>

      <h2>4. Third parties</h2>
      <ul>
        <li><strong>Base blockchain:</strong> Payments settle on Base, a public blockchain. Anyone can view on-chain transactions.</li>
        <li><strong>x402 protocol:</strong> Payment challenges and settlement follow the x402 protocol.</li>
        <li><strong>Data providers:</strong> Market and filing data comes from public sources and third-party data providers.</li>
      </ul>

      <h2>5. Data retention</h2>
      <p>Server logs are kept only as long as needed to operate the service. On-chain payment records are permanent on the Base blockchain and cannot be deleted by us.</p>

      <h2>6. Children</h2>
      <p>Stock Bloc is not directed at children under 13, and we do not knowingly collect information from them.</p>

      <h2>7. Changes</h2>
      <p>We may update this policy. The version at this URL is the current one.</p>

      <h2>8. Contact</h2>
      <p>Questions: <a href="mailto:thestockbloc@gmail.com">thestockbloc@gmail.com</a></p>
    </main>
    <footer>
      <span>Stock Bloc</span>
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/terms">Terms of Service</a>
        <a href="/privacy">Privacy Policy</a>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

export function registerLegalRoutes(app: Express): void {
  app.get(['/terms', '/terms/', '/terms.html'], (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(renderTermsPageHtml());
  });

  app.get(['/privacy', '/privacy/', '/privacy.html'], (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(renderPrivacyPageHtml());
  });
}
