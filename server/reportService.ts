import type { Request, Response } from 'express';
import { db } from './firebaseAdmin.js';
import { getRecordedStripeSessionAsync } from './stripePaymentProvider.js';
import { buildFilingDiff, FilingDiffResult, FinancialChange, RiskFactorItem, RiskFactorChanges } from './secFilingDiff.js';

/**
 * Escapes characters for safe inclusion in HTML.
 */
export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats financial dollar / share amounts cleanly.
 */
function formatNumber(num: number | null | undefined, unit: string): string {
  if (num === null || num === undefined) return 'N/A';
  if (unit === 'USD') {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`;
    return `${sign}$${abs.toLocaleString()}`;
  }
  if (unit === 'shares') {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B shares`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M shares`;
    return `${sign}${abs.toLocaleString()} shares`;
  }
  if (unit === 'derived') {
    return `${(num * 100).toFixed(1)}%`;
  }
  return `${num.toLocaleString()} ${unit}`;
}

/**
 * Renders the initial /report form landing page.
 */
export function renderReportPageHtml(): string {
  const paymentLinkUrl = process.env.STRIPE_PAYMENT_LINK_URL || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>What changed in this company's latest 10-K or 10-Q</title>
  <style>
    :root {
      --bg: #030712;
      --card-bg: #0f172a;
      --card-border: #1e293b;
      --accent: #06b6d4;
      --accent-hover: #0891b2;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --error: #f43f5e;
      --gold: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .container {
      max-width: 620px;
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 2.25rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      background: rgba(6, 182, 212, 0.15);
      color: var(--accent);
      border: 1px solid rgba(6, 182, 212, 0.3);
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 0.75rem;
      color: #ffffff;
    }
    .subtitle {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1.75rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #e2e8f0;
    }
    input[type="text"], select {
      width: 100%;
      background: #090d16;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      padding: 0.85rem 1rem;
      font-size: 1rem;
      color: #ffffff;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input[type="text"]:focus, select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
    }
    .price-tag {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 0.5rem;
      padding: 0.85rem 1rem;
      margin-bottom: 1.25rem;
    }
    .price-tag .amount {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--gold);
    }
    .price-tag .note {
      font-size: 0.825rem;
      color: #cbd5e1;
    }
    .btn-submit {
      width: 100%;
      background: var(--accent);
      color: #030712;
      border: none;
      border-radius: 0.5rem;
      padding: 0.95rem 1.25rem;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
    }
    .btn-submit:hover {
      background: var(--accent-hover);
    }
    .btn-submit:active {
      transform: scale(0.99);
    }
    .disclaimer {
      font-size: 0.775rem;
      color: #64748b;
      margin-top: 1.25rem;
      text-align: center;
      line-height: 1.4;
    }
    .sample-link-box {
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid #1e293b;
      text-align: center;
      font-size: 0.85rem;
    }
    .sample-link-box a {
      color: var(--accent);
      text-decoration: none;
      font-weight: 500;
    }
    .sample-link-box a:hover {
      text-decoration: underline;
    }
    .error-box {
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fda4af;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      margin-bottom: 1.25rem;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">SEC EDGAR Deep Audit</div>
    <h1>What changed in this company's latest 10-K or 10-Q</h1>
    <p class="subtitle">Autonomous forensic comparison of financial statements, balance sheets, and Item 1A risk factor changes directly from official SEC EDGAR filings.</p>

    <div id="errorBox" class="error-box"></div>

    <form id="reportForm" method="GET" action="/report/checkout">
      <div class="form-group">
        <label for="ticker">Stock Ticker Symbol</label>
        <input type="text" id="ticker" name="ticker" placeholder="e.g. AAPL, NVDA, TSLA, MSFT" maxlength="6" autofocus required autocomplete="off" />
      </div>

      <div class="form-group">
        <label for="formType">Filing Form Type</label>
        <select id="formType" name="form">
          <option value="10-K" selected>Form 10-K (Annual Report)</option>
          <option value="10-Q">Form 10-Q (Quarterly Report)</option>
        </select>
      </div>

      <div class="price-tag">
        <div>
          <div class="amount">$9</div>
          <div class="note">One-time payment via credit card or Apple Pay</div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Instant Report</span>
        </div>
      </div>

      <button type="submit" id="submitBtn" class="btn-submit">Continue to Secure Checkout ($9) &rarr;</button>

      <p class="disclaimer">Not investment advice. For educational, informational, and research purposes only.</p>

      <div class="sample-link-box">
        Want to see the raw output first? <a href="/api/v1/sec/job/sample" target="_blank">View free sample report (/api/v1/sec/job/sample)</a>
      </div>
    </form>
  </div>

  <script>
    (function() {
      const form = document.getElementById('reportForm');
      const tickerInput = document.getElementById('ticker');
      const formSelect = document.getElementById('formType');
      const errorBox = document.getElementById('errorBox');
      const paymentLinkUrl = ${JSON.stringify(paymentLinkUrl)};

      form.addEventListener('submit', function(e) {
        const rawTicker = (tickerInput.value || '').trim();
        const ticker = rawTicker.toUpperCase();
        const selectedForm = formSelect.value || '10-K';

        // Validate 1-6 letters
        if (!/^[A-Za-z]{1,6}$/.test(rawTicker)) {
          e.preventDefault();
          errorBox.textContent = 'Please enter a valid stock ticker symbol (1 to 6 letters, e.g. AAPL, NVDA, TSLA).';
          errorBox.style.display = 'block';
          tickerInput.focus();
          return false;
        }

        errorBox.style.display = 'none';

        // If STRIPE_PAYMENT_LINK_URL is configured on client, redirect directly with client_reference_id
        if (paymentLinkUrl && paymentLinkUrl.startsWith('http')) {
          e.preventDefault();
          const clientRefId = ticker + '-' + selectedForm;
          const sep = paymentLinkUrl.includes('?') ? '&' : '?';
          window.location.href = paymentLinkUrl + sep + 'client_reference_id=' + encodeURIComponent(clientRefId);
          return false;
        }

        // Otherwise allow standard form GET submit to /report/checkout
      });
    })();
  </script>
</body>
</html>`;
}

/**
 * Renders a full HTML report from a saved or generated FilingDiffResult.
 */
export function renderReportHtml(report: any, sessionId: string): string {
  const ticker = escapeHtml(report.ticker || 'N/A');
  const filingType = escapeHtml(report.filingType || '10-K');
  const comparisonBasis = escapeHtml(report.comparisonBasis || 'annual');
  const currentFiling = report.currentFiling || {};
  const priorFiling = report.priorFiling || {};
  const summary: string[] = Array.isArray(report.summary) ? report.summary : [];
  const financialChanges: FinancialChange[] = Array.isArray(report.financialChanges) ? report.financialChanges : [];
  const riskFactorChanges: RiskFactorChanges | null = report.riskFactorChanges || null;
  const sources: string[] = Array.isArray(report.sources) ? report.sources : [];
  const dataNote = escapeHtml(report.dataNote || '');

  const addedTotal = riskFactorChanges?.addedTotal ?? (riskFactorChanges?.added?.length || 0);
  const removedTotal = riskFactorChanges?.removedTotal ?? (riskFactorChanges?.removed?.length || 0);
  const changedTotal = riskFactorChanges?.changedTotal ?? (riskFactorChanges?.changed?.length || 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>What changed in ${ticker}'s latest ${filingType} | Stock Bloc SEC Report</title>
  <style>
    :root {
      --bg: #030712;
      --card-bg: #0f172a;
      --card-border: #1e293b;
      --accent: #06b6d4;
      --accent-dim: rgba(6, 182, 212, 0.15);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --emerald: #10b981;
      --rose: #f43f5e;
      --amber: #f59e0b;
      --quote-bg: rgba(15, 23, 42, 0.9);
      --quote-border: #38bdf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      padding: 2rem 1rem;
    }
    .wrapper {
      max-width: 960px;
      margin: 0 auto;
    }
    header {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
    }
    .header-top {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      background: var(--accent-dim);
      color: var(--accent);
      border: 1px solid rgba(6, 182, 212, 0.3);
    }
    .permalink-btn {
      font-size: 0.825rem;
      color: var(--accent);
      text-decoration: none;
      border: 1px solid rgba(6, 182, 212, 0.3);
      padding: 0.35rem 0.75rem;
      border-radius: 0.375rem;
      background: rgba(6, 182, 212, 0.05);
      transition: background-color 0.2s;
    }
    .permalink-btn:hover {
      background: rgba(6, 182, 212, 0.15);
    }
    h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      margin-bottom: 0.5rem;
    }
    .comparison-meta {
      font-size: 0.95rem;
      color: var(--text-muted);
    }
    .section-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 1.75rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .filing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .filing-box {
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 0.75rem;
      padding: 1.25rem;
    }
    .filing-box h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 0.5rem;
    }
    .filing-box p {
      font-size: 0.875rem;
      color: #cbd5e1;
      margin-bottom: 0.35rem;
    }
    .filing-box a {
      color: #38bdf8;
      text-decoration: none;
      font-weight: 600;
      word-break: break-all;
    }
    .filing-box a:hover {
      text-decoration: underline;
    }
    .summary-list {
      list-style: none;
    }
    .summary-list li {
      position: relative;
      padding-left: 1.5rem;
      margin-bottom: 0.75rem;
      font-size: 0.975rem;
      color: #f1f5f9;
    }
    .summary-list li::before {
      content: "•";
      position: absolute;
      left: 0.25rem;
      color: var(--accent);
      font-weight: bold;
      font-size: 1.25rem;
      line-height: 1;
    }
    .totals-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .total-stat {
      flex: 1;
      min-width: 140px;
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 0.5rem;
      padding: 0.85rem;
      text-align: center;
    }
    .total-stat .val {
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1.1;
    }
    .total-stat .lbl {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    th {
      text-align: left;
      padding: 0.75rem 1rem;
      background: #090d16;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #1e293b;
    }
    td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #1e293b;
      color: #e2e8f0;
    }
    .pos { color: var(--emerald); font-weight: 600; }
    .neg { color: var(--rose); font-weight: 600; }
    .risk-item {
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 0.5rem;
      padding: 1.25rem;
      margin-bottom: 1rem;
    }
    .risk-title {
      font-size: 0.975rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.5rem;
    }
    .risk-acc {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: monospace;
      margin-bottom: 0.75rem;
    }
    blockquote.quote {
      border-left: 3px solid var(--quote-border);
      background: rgba(30, 41, 59, 0.4);
      padding: 0.75rem 1rem;
      border-radius: 0 0.375rem 0.375rem 0;
      font-size: 0.875rem;
      color: #cbd5e1;
      font-style: italic;
      line-height: 1.5;
    }
    blockquote.quote-prior {
      border-left-color: #64748b;
      background: rgba(15, 23, 42, 0.6);
      margin-top: 0.5rem;
    }
    .snippet-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-top: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .footer-note {
      font-size: 0.825rem;
      color: #64748b;
      line-height: 1.5;
      padding-top: 1rem;
      border-top: 1px solid #1e293b;
    }
    .action-row {
      text-align: center;
      margin: 2rem 0;
    }
    .btn-new {
      display: inline-block;
      background: var(--accent);
      color: #030712;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: background-color 0.2s;
    }
    .btn-new:hover {
      background: #0891b2;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <header>
      <div class="header-top">
        <span class="badge">SEC EDGAR Audit Completed</span>
        <a href="/report/view/${escapeHtml(sessionId)}" class="permalink-btn">&#128279; Permanent Report Link</a>
      </div>
      <h1>What changed in ${ticker}'s latest ${filingType}</h1>
      <p class="comparison-meta">Official comparison basis: <strong>${comparisonBasis}</strong> &bull; Generated from verified SEC EDGAR companyfacts &amp; Item 1A text.</p>
    </header>

    <!-- 1. SUMMARY OF KEY CHANGES -->
    <div class="section-card">
      <h2>Summary of Key Changes</h2>
      ${summary.length > 0 ? `
        <ul class="summary-list">
          ${summary.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>
      ` : '<p style="color: var(--text-muted);">No high-level diff items recorded.</p>'}
    </div>

    <!-- 2. FILING DATES & EDGAR LINKS -->
    <div class="section-card">
      <h2>Filing Dates &amp; SEC EDGAR Sources</h2>
      <div class="filing-grid">
        <div class="filing-box">
          <h3>Current Filing (${escapeHtml(currentFiling.form || filingType)})</h3>
          <p><strong>Period Ended:</strong> ${escapeHtml(currentFiling.periodEnd || 'N/A')}</p>
          <p><strong>Filed Date:</strong> ${escapeHtml(currentFiling.filedDate || 'N/A')}</p>
          <p><strong>Accession:</strong> <code>${escapeHtml(currentFiling.accession || 'N/A')}</code></p>
          ${currentFiling.url ? `
            <p style="margin-top: 0.75rem;">
              <a href="${escapeHtml(currentFiling.url)}" target="_blank" rel="noopener noreferrer">View Current Filing on SEC EDGAR &rarr;</a>
            </p>
          ` : ''}
        </div>

        <div class="filing-box">
          <h3>Prior Comparison Filing (${escapeHtml(priorFiling.form || filingType)})</h3>
          <p><strong>Period Ended:</strong> ${escapeHtml(priorFiling.periodEnd || 'N/A')}</p>
          <p><strong>Filed Date:</strong> ${escapeHtml(priorFiling.filedDate || 'N/A')}</p>
          <p><strong>Accession:</strong> <code>${escapeHtml(priorFiling.accession || 'N/A')}</code></p>
          ${priorFiling.url ? `
            <p style="margin-top: 0.75rem;">
              <a href="${escapeHtml(priorFiling.url)}" target="_blank" rel="noopener noreferrer">View Prior Filing on SEC EDGAR &rarr;</a>
            </p>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- 3. FINANCIAL CHANGES -->
    ${financialChanges.length > 0 ? `
      <div class="section-card">
        <h2>Financial Statement Changes (XBRL)</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Financial Metric</th>
                <th>Prior Period</th>
                <th>Current Period</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              ${financialChanges.map(fc => {
                const priorFormatted = formatNumber(fc.prior, fc.unit);
                const currentFormatted = formatNumber(fc.current, fc.unit);
                let changeStr = '—';
                let changeClass = '';
                if (fc.metric === 'Gross margin' && typeof fc.marginChangePp === 'number') {
                  const sign = fc.marginChangePp > 0 ? '+' : '';
                  changeStr = `${sign}${fc.marginChangePp} pp`;
                  changeClass = fc.marginChangePp >= 0 ? 'pos' : 'neg';
                } else if (fc.changePct !== null && fc.changePct !== undefined) {
                  const sign = fc.changePct > 0 ? '+' : '';
                  changeStr = `${sign}${fc.changePct}%`;
                  changeClass = fc.changePct >= 0 ? 'pos' : 'neg';
                }
                return `
                  <tr>
                    <td><strong>${escapeHtml(fc.metric)}</strong></td>
                    <td>${escapeHtml(priorFormatted)}</td>
                    <td>${escapeHtml(currentFormatted)}</td>
                    <td class="${changeClass}">${escapeHtml(changeStr)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    <!-- 4. RISK FACTOR TOTALS & QUOTES -->
    <div class="section-card">
      <h2>Item 1A Risk Factor Changes</h2>

      <div class="totals-bar">
        <div class="total-stat">
          <div class="val" style="color: var(--rose);">${addedTotal}</div>
          <div class="lbl">Added Risks</div>
        </div>
        <div class="total-stat">
          <div class="val" style="color: #94a3b8;">${removedTotal}</div>
          <div class="lbl">Removed Risks</div>
        </div>
        <div class="total-stat">
          <div class="val" style="color: var(--amber);">${changedTotal}</div>
          <div class="lbl">Modified Risks</div>
        </div>
      </div>

      <!-- Added Risks -->
      ${riskFactorChanges?.added && riskFactorChanges.added.length > 0 ? `
        <h3 style="font-size: 1.05rem; color: var(--rose); margin: 1.5rem 0 0.75rem;">Newly Added Risk Factors (showing up to 10)</h3>
        ${riskFactorChanges.added.map((item: RiskFactorItem) => `
          <div class="risk-item">
            <div class="risk-title">${escapeHtml(item.title)}</div>
            <div class="risk-acc">Filing: ${escapeHtml(item.accession)}</div>
            <div class="snippet-label">Quote from current filing:</div>
            <blockquote class="quote">&ldquo;${escapeHtml(item.snippet)}&rdquo;</blockquote>
          </div>
        `).join('')}
      ` : ''}

      <!-- Changed / Modified Risks -->
      ${riskFactorChanges?.changed && riskFactorChanges.changed.length > 0 ? `
        <h3 style="font-size: 1.05rem; color: var(--amber); margin: 1.5rem 0 0.75rem;">Modified Risk Factors (showing up to 10)</h3>
        ${riskFactorChanges.changed.map((item: RiskFactorItem) => `
          <div class="risk-item">
            <div class="risk-title">${escapeHtml(item.title)}</div>
            <div class="snippet-label">Current Quote (${escapeHtml(item.accession)}):</div>
            <blockquote class="quote">&ldquo;${escapeHtml(item.snippet)}&rdquo;</blockquote>
            ${item.priorSnippet ? `
              <div class="snippet-label">Prior Quote (${escapeHtml(item.priorAccession || priorFiling.accession || 'Prior')}):</div>
              <blockquote class="quote quote-prior">&ldquo;${escapeHtml(item.priorSnippet)}&rdquo;</blockquote>
            ` : ''}
          </div>
        `).join('')}
      ` : ''}

      <!-- Removed Risks -->
      ${riskFactorChanges?.removed && riskFactorChanges.removed.length > 0 ? `
        <h3 style="font-size: 1.05rem; color: #94a3b8; margin: 1.5rem 0 0.75rem;">Removed Risk Factors (showing up to 10)</h3>
        ${riskFactorChanges.removed.map((item: RiskFactorItem) => `
          <div class="risk-item">
            <div class="risk-title">${escapeHtml(item.title)}</div>
            <div class="risk-acc">Prior Filing: ${escapeHtml(item.accession)}</div>
            <div class="snippet-label">Quote from prior filing:</div>
            <blockquote class="quote quote-prior">&ldquo;${escapeHtml(item.snippet)}&rdquo;</blockquote>
          </div>
        `).join('')}
      ` : ''}

      ${(!riskFactorChanges || (addedTotal === 0 && removedTotal === 0 && changedTotal === 0)) ? `
        <p style="color: var(--text-muted); font-size: 0.9rem;">No material Item 1A risk factor additions or modifications detected between the filings.</p>
      ` : ''}

      <div class="footer-note" style="margin-top: 1.5rem;">
        <strong>Audit Data Note:</strong> ${dataNote}
      </div>
    </div>

    <div class="action-row">
      <a href="/report" class="btn-new">&larr; Analyze Another Ticker</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Renders an error or refund notice HTML page.
 */
export function renderRefundNoticeHtml(reason: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Generation Notice | Stock Bloc</title>
  <style>
    body {
      background: #030712;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      max-width: 540px;
      width: 100%;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 1rem;
      padding: 2.25rem;
      text-align: center;
    }
    .icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 1rem;
    }
    p {
      color: #cbd5e1;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1.25rem;
    }
    .refund-box {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fecdd3;
      padding: 1rem;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }
    a.btn {
      display: inline-block;
      background: #06b6d4;
      color: #030712;
      font-weight: 700;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      text-decoration: none;
    }
    a.btn:hover { background: #0891b2; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#9888;</div>
    <h1>Report Could Not Be Generated</h1>
    <p>${escapeHtml(reason)}</p>

    <div class="refund-box">
      <strong>Refund Instructions:</strong><br>
      Because an incomplete or fake report is never presented, you are entitled to a full refund. Please reply to your Stripe payment receipt or email <strong>thestockbloc@gmail.com</strong> with your session details for an immediate refund.
    </div>

    <a href="/report" class="btn">&larr; Return to Report Center</a>
  </div>
</body>
</html>`;
}

/**
 * Renders a general error HTML page.
 */
export function renderErrorHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Stock Bloc</title>
  <style>
    body {
      background: #030712;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      max-width: 500px;
      width: 100%;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 1rem;
      padding: 2.25rem;
      text-align: center;
    }
    h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; color: #ffffff; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; }
    a.btn {
      display: inline-block;
      background: #06b6d4;
      color: #030712;
      font-weight: 700;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <a href="/report" class="btn">&larr; Go to Report Search</a>
  </div>
</body>
</html>`;
}

/**
 * Registers all /report endpoints on the express application.
 */
export function registerReportRoutes(app: any): void {
  // 1. GET /report: landing page
  app.get(['/report', '/report/'], (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderReportPageHtml());
  });

  // 1b. GET /report/checkout: helper redirect to STRIPE_PAYMENT_LINK_URL
  app.get('/report/checkout', (req: Request, res: Response) => {
    const rawTicker = String(req.query.ticker || '').trim();
    const rawForm = String(req.query.form || req.query.filingType || '10-K').trim().toUpperCase();

    // Validate ticker 1-6 letters
    if (!/^[A-Za-z]{1,6}$/.test(rawTicker)) {
      return res.status(400).send(renderErrorHtml('Invalid Ticker', 'Stock ticker must be 1 to 6 letters (e.g. AAPL, NVDA).'));
    }

    const ticker = rawTicker.toUpperCase();
    const form = rawForm === '10-Q' ? '10-Q' : '10-K';
    const clientRefId = `${ticker}-${form}`;

    const paymentLinkUrl = process.env.STRIPE_PAYMENT_LINK_URL || '';
    if (!paymentLinkUrl || !paymentLinkUrl.startsWith('http')) {
      // In dev or tests without payment link, give notice
      return res.status(503).send(renderErrorHtml(
        'Payment Link Not Configured',
        `STRIPE_PAYMENT_LINK_URL is not configured. For testing, simulate success directly at: /report/success?session_id=test_session_id`
      ));
    }

    const sep = paymentLinkUrl.includes('?') ? '&' : '?';
    const targetUrl = `${paymentLinkUrl}${sep}client_reference_id=${encodeURIComponent(clientRefId)}`;
    return res.redirect(302, targetUrl);
  });

  // 2. GET /report/success?session_id=...: fulfillment handler
  app.get('/report/success', async (req: Request, res: Response) => {
    const sessionId = String(req.query.session_id || '').trim();
    if (!sessionId) {
      return res.status(400).send(renderErrorHtml('Missing Session ID', 'The session_id query parameter is required.'));
    }

    // 2a. Check if report already exists in Firestore (idempotent, never regenerate or double-run)
    try {
      const existingDoc = await db.collection('reports').doc(sessionId).get();
      if (existingDoc && existingDoc.exists) {
        const savedData = existingDoc.data();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(renderReportHtml(savedData, sessionId));
      }
    } catch (fsErr: any) {
      console.warn(`[Report] Firestore lookup error for session ${sessionId}:`, fsErr?.message || fsErr);
    }

    // 2b. Retrieve Checkout Session from Stripe with STRIPE_SECRET_KEY
    // CRITICAL: Never log or expose the Stripe key
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    let session: any = null;

    if (stripeKey && !stripeKey.includes('placeholder')) {
      try {
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any });
        session = await stripe.checkout.sessions.retrieve(sessionId);
      } catch (err: any) {
        console.warn(`[Report] Stripe checkout session retrieval failed:`, err?.message || err);
      }
    }

    // Fallback: check recorded sessions if in sandbox / test mode
    if (!session) {
      session = await getRecordedStripeSessionAsync(sessionId);
    }

    if (!session) {
      return res.status(404).send(renderErrorHtml(
        'Checkout Session Not Found',
        'Could not locate your payment session. If you completed a payment, please contact thestockbloc@gmail.com with your receipt.'
      ));
    }

    // 2c. Continue only if payment_status === "paid"
    if (session.payment_status !== 'paid') {
      return res.status(402).send(renderErrorHtml(
        'Payment Incomplete',
        `Your payment status is currently "${escapeHtml(session.payment_status || 'unpaid')}". Reports are only generated for completed, confirmed payments.`
      ));
    }

    // 2d. Read the ticker/form from client_reference_id (fall back to the "Ticker" custom field)
    let ticker = '';
    let form: '10-K' | '10-Q' = '10-K';

    if (session.client_reference_id) {
      const clientRef = String(session.client_reference_id).trim();
      const match = clientRef.match(/^([A-Za-z]{1,6})-(10-?[KQ]|K|Q)$/i);
      if (match) {
        ticker = match[1].toUpperCase();
        const rawForm = match[2].toUpperCase().replace('-', '');
        form = (rawForm === '10Q' || rawForm === 'Q') ? '10-Q' : '10-K';
      } else {
        const parts = clientRef.split('-');
        ticker = parts[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
        if (parts.length >= 2) {
          const tail = parts.slice(1).join('-').toUpperCase();
          if (tail.includes('10-Q') || tail === '10Q' || tail === 'Q') {
            form = '10-Q';
          }
        }
      }
    }

    // Fall back to "Ticker" custom field if client_reference_id didn't provide ticker
    if (!ticker && Array.isArray(session.custom_fields)) {
      const tickerField = session.custom_fields.find((f: any) =>
        f.key?.toLowerCase() === 'ticker' ||
        f.label?.custom?.toLowerCase() === 'ticker' ||
        f.name?.toLowerCase() === 'ticker'
      );
      if (tickerField) {
        const val = String(tickerField.text?.value || tickerField.dropdown?.value || tickerField.value || '').trim();
        const match = val.match(/^([A-Za-z]{1,6})(?:-(10-?[KQ]|K|Q))?$/i);
        if (match) {
          ticker = match[1].toUpperCase();
          if (match[2]) {
            const rawForm = match[2].toUpperCase().replace('-', '');
            form = (rawForm === '10Q' || rawForm === 'Q') ? '10-Q' : '10-K';
          }
        } else {
          ticker = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
        }
      }
    }

    // Fall back to metadata if any
    if (!ticker && session.metadata) {
      if (session.metadata.ticker) ticker = String(session.metadata.ticker).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
      if (session.metadata.Ticker) ticker = String(session.metadata.Ticker).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
      if (session.metadata.form === '10-Q' || session.metadata.filingType === '10-Q') form = '10-Q';
    }

    // Validate ticker
    if (!ticker || !/^[A-Z]{1,6}$/.test(ticker)) {
      console.error(`[Report] Diff failed for session ${sessionId}: missing or invalid ticker.`);
      return res.status(400).send(renderRefundNoticeHtml(
        'A valid stock ticker symbol could not be found for this purchase. The report could not be generated. Please reply to your Stripe receipt or email thestockbloc@gmail.com for a full refund.'
      ));
    }

    // 2e. Call internal diff function (direct function call, NOT through x402)
    let diffResult: FilingDiffResult | null = null;
    try {
      diffResult = await buildFilingDiff(ticker, form);
    } catch (diffErr: any) {
      console.error(`[Report] Diff failed for session ${sessionId} (${ticker} ${form}):`, diffErr?.message || diffErr);
      return res.status(502).send(renderRefundNoticeHtml(
        `The SEC filing comparison report for ${escapeHtml(ticker)} (${escapeHtml(form)}) could not be generated (${escapeHtml(diffErr?.message || 'SEC EDGAR service error')}). Please reply to your Stripe receipt or email thestockbloc@gmail.com for a full refund.`
      ));
    }

    // If diff returned without prior filing, it cannot be a complete diff comparison
    if (!diffResult || !diffResult.priorFiling) {
      console.error(`[Report] Diff failed for session ${sessionId} (${ticker} ${form}): No prior filing found to compare.`);
      return res.status(502).send(renderRefundNoticeHtml(
        `No prior Form ${escapeHtml(form)} filing was found for ${escapeHtml(ticker)} in SEC EDGAR history to perform a comparison. The report could not be generated. Please reply to your Stripe receipt or email thestockbloc@gmail.com for a full refund.`
      ));
    }

    // 2f. Save result in Firestore under reports/{session_id}
    const reportRecord = {
      sessionId,
      ticker: diffResult.ticker,
      filingType: diffResult.filingType,
      comparisonBasis: diffResult.comparisonBasis,
      currentFiling: diffResult.currentFiling,
      priorFiling: diffResult.priorFiling,
      financialChanges: diffResult.financialChanges,
      riskFactorChanges: diffResult.riskFactorChanges || null,
      summary: diffResult.summary,
      sources: diffResult.sources,
      dataNote: diffResult.dataNote,
      createdAt: new Date().toISOString(),
      paymentStatus: 'paid'
    };

    try {
      await db.collection('reports').doc(sessionId).set(reportRecord);
    } catch (saveErr: any) {
      console.warn(`[Report] Failed to write report record to Firestore:`, saveErr?.message || saveErr);
    }

    // 2g. Render report as HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderReportHtml(reportRecord, sessionId));
  });

  // 4. GET /report/view/:session_id: re-show a saved report
  app.get('/report/view/:session_id', async (req: Request, res: Response) => {
    const sessionId = String(req.params.session_id || '').trim();
    if (!sessionId) {
      return res.status(400).send(renderErrorHtml('Missing Session ID', 'Please specify a valid session ID to view the report.'));
    }

    try {
      const docSnap = await db.collection('reports').doc(sessionId).get();
      if (!docSnap || !docSnap.exists) {
        return res.status(404).send(renderErrorHtml(
          'Report Not Found',
          `No saved report exists for session ID "${escapeHtml(sessionId)}".`
        ));
      }

      const reportData = docSnap.data();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(renderReportHtml(reportData, sessionId));
    } catch (err: any) {
      console.error(`[Report] Error retrieving report for session ${sessionId}:`, err?.message || err);
      return res.status(500).send(renderErrorHtml('Error Loading Report', 'Could not retrieve report from database.'));
    }
  });
}
