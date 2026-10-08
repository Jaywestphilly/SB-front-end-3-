// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  parseInfoTable,
  fetchInfoTable,
  getHoldings,
  getLatest13F
} from './sec13fHoldings.js';
import { SecIntelService } from '../src/services/secIntelService.js';

describe('13F Holdings Parser & Economic Protection Suite', () => {
  const originalEnv = { ...process.env };
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-data-'));
    process.env.SB_DATA_DIR = tempDir;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    vi.restoreAllMocks();
  });

  it('Requirement 6.1: parseInfoTable aggregates by CUSIP, excludes options (putCall), decodes entities, sorts by value desc', () => {
    // (a) No-prefix table with duplicate CUSIPs, putCall option row, and custom values
    const xmlA = `
      <informationTable>
        <infoTable>
          <nameOfIssuer>NVIDIA CORP</nameOfIssuer>
          <cusip>123456789</cusip>
          <value>5000</value>
          <sshPrnamt>1000</sshPrnamt>
        </infoTable>
        <infoTable>
          <nameOfIssuer>NVIDIA CORP</nameOfIssuer>
          <cusip>123456789</cusip>
          <value>3000</value>
          <sshPrnamt>600</sshPrnamt>
        </infoTable>
        <infoTable>
          <nameOfIssuer>MICROSOFT CORP</nameOfIssuer>
          <cusip>987654321</cusip>
          <value>10000</value>
          <sshPrnamt>2000</sshPrnamt>
        </infoTable>
        <infoTable>
          <nameOfIssuer>AAPL CALL OPTION</nameOfIssuer>
          <cusip>111222333</cusip>
          <value>2000</value>
          <sshPrnamt>500</sshPrnamt>
          <putCall>CALL</putCall>
        </infoTable>
      </informationTable>
    `;

    const resA = parseInfoTable(xmlA);
    expect(resA.totalValueUsd).toBe(18000); // 5000 + 3000 + 10000 (CALL is skipped)
    expect(resA.items).toHaveLength(2);
    
    // MSFT should be first (sorted by value desc: 10000 vs 8000)
    expect(resA.items[0].cusip).toBe('987654321');
    expect(resA.items[0].value).toBe(10000);
    expect(resA.items[0].shrs).toBe(2000);

    // NVIDIA should be second, aggregated
    expect(resA.items[1].cusip).toBe('123456789');
    expect(resA.items[1].value).toBe(8000);
    expect(resA.items[1].shrs).toBe(1600);

    // (b) ns1:-prefixed table with &amp; and other entities
    const xmlB = `
      <ns1:informationTable xmlns:ns1="http://www.sec.gov/infoTable">
        <ns1:infoTable>
          <ns1:nameOfIssuer>AT&amp;T &lt;INC&gt;</ns1:nameOfIssuer>
          <ns1:cusip>555666777</ns1:cusip>
          <ns1:value>25000</ns1:value>
          <ns1:sshPrnamt>5000</ns1:sshPrnamt>
        </ns1:infoTable>
      </ns1:informationTable>
    `;

    const resB = parseInfoTable(xmlB);
    expect(resB.totalValueUsd).toBe(25000);
    expect(resB.items[0].nameOfIssuer).toBe('AT&T <INC>');
    expect(resB.items[0].cusip).toBe('555666777');
  });

  it('Requirement 6.2: fetchInfoTable picks 56757.xml over primary_doc.xml', async () => {
    const mockIndex = {
      directory: {
        item: [
          { name: "primary_doc.xml" },
          { name: "56757.xml" },
          { name: "primary_doc.html" }
        ]
      }
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('index.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockIndex)
        } as any);
      }
      if (urlStr.includes('56757.xml')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<infoTable><cusip>123</cusip><value>100</value></infoTable>')
        } as any);
      }
      return Promise.resolve({ ok: false } as any);
    });

    try {
      const res = await fetchInfoTable('0001067983', '0001193125-26-352200');
      expect(res.url).toContain('56757.xml');
      expect(res.xml).toContain('<infoTable>');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Requirement 6.3: holdings cache is hit on second call with same accession', async () => {
    const mockSubmissions = {
      filings: {
        recent: {
          form: ['13F-HR'],
          accessionNumber: ['0001193125-26-352200'],
          filingDate: ['2026-08-14'],
          reportDate: ['2026-06-30'],
          primaryDocument: ['doc.xml']
        }
      }
    };

    const mockIndex = {
      directory: {
        item: [{ name: "infotable.xml" }]
      }
    };

    const mockXml = `
      <infoTable>
        <nameOfIssuer>APPLE INC</nameOfIssuer>
        <cusip>037833100</cusip>
        <value>650000</value>
        <sshPrnamt>300000</sshPrnamt>
      </infoTable>
    `;

    const originalFetch = global.fetch;
    let fetchCount = 0;
    global.fetch = vi.fn().mockImplementation((url: any) => {
      fetchCount++;
      const urlStr = String(url);
      if (urlStr.includes('submissions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSubmissions) } as any);
      }
      if (urlStr.includes('index.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockIndex) } as any);
      }
      if (urlStr.includes('infotable.xml')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(mockXml) } as any);
      }
      return Promise.resolve({ ok: false } as any);
    });

    try {
      // First call (cache miss)
      const res1 = await getHoldings('0001067983', 'berkshire');
      expect(res1.ok).toBe(true);
      expect(res1.totalValueUsd).toBe(650000);
      const initialFetchCount = fetchCount;

      // Second call (cache hit)
      const res2 = await getHoldings('0001067983', 'berkshire');
      expect(res2.ok).toBe(true);
      expect(res2.totalValueUsd).toBe(650000);
      
      // Ensure submissions is fetched to check accession, but index.json and XML are skipped
      expect(fetchCount).toBe(initialFetchCount + 1);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Requirement 6.4: 13 funds remain on complete network failure with holdingsError set', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('SEC Server Down'));

    try {
      const data = await SecIntelService.fetchLiveSecData(true);
      expect(data.funds).toHaveLength(13);
      for (const fund of data.funds) {
        expect(fund.holdings_status).toBe('metadata_only');
        expect(fund.holdingsError).toBeDefined();
        expect(fund.topHoldings).toHaveLength(0);
      }
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Requirement 6.5: No default fund contains thesis, aum, sectorAllocation or non-empty topHoldings', () => {
    const defaults = SecIntelService.getDefaultFunds();
    expect(defaults).toHaveLength(13);
    for (const fund of defaults) {
      expect(fund.thesis).toBeUndefined();
      expect(fund.aum).toBeUndefined();
      expect(fund.sectorAllocation).toHaveLength(0);
      expect(fund.topHoldings).toHaveLength(0);
      expect(fund.holdings_status).toBe('metadata_only');
    }
  });

  it('Requirement 6.6: consensusHoldings contains only CUSIPs present in at least 2 parsed funds', () => {
    const mockFunds = [
      {
        id: 'fund1',
        fundName: 'Fund A',
        holdings_status: 'parsed_13f_information_table',
        topHoldings: [
          { symbol: 'AAPL', name: 'Apple Inc.', cusip: '037833100', valueUsd: 1000 },
          { symbol: 'MSFT', name: 'Microsoft Corp', cusip: '594918104', valueUsd: 800 }
        ]
      },
      {
        id: 'fund2',
        fundName: 'Fund B',
        holdings_status: 'parsed_13f_information_table',
        topHoldings: [
          { symbol: 'AAPL', name: 'Apple Inc.', cusip: '037833100', valueUsd: 1200 },
          { symbol: 'NVDA', name: 'NVIDIA Corp', cusip: '67066G104', valueUsd: 1500 }
        ]
      },
      {
        id: 'fund3',
        fundName: 'Fund C',
        holdings_status: 'metadata_only', // Should be skipped for consensus
        topHoldings: [
          { symbol: 'MSFT', name: 'Microsoft Corp', cusip: '594918104', valueUsd: 900 }
        ]
      }
    ] as any[];

    const derived = SecIntelService.computeConsensusAndSummary(mockFunds);
    
    // Only AAPL is shared between >= 2 parsed funds (Fund A & Fund B)
    // MSFT is in parsed Fund A but mock Fund C is not parsed. NVDA is only in Fund B.
    expect(derived.consensusHoldings).toHaveLength(1);
    expect(derived.consensusHoldings[0].cusip).toBe('037833100');
    expect(derived.consensusHoldings[0].symbol).toBe('AAPL');
    expect(derived.consensusHoldings[0].fundCount).toBe(2);
  });
});
