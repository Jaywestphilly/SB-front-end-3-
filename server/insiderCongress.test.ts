// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';

vi.mock('unpdf', () => ({
  getDocumentProxy: vi.fn(async (bytes: Uint8Array) => ({
    rawText: Buffer.from(bytes).toString('utf8'),
  })),
  extractText: vi.fn(async (pdf: { rawText: string }) => ({
    totalPages: 1,
    text: [pdf.rawText],
  })),
}));

import {
  setFacilitatorVerifyHandler,
  setFacilitatorSettleHandler,
  resetFacilitatorMock,
} from './testSetup/facilitatorMock.js';
import { app } from '../server.impl.js';
import {
  PRICED_ENDPOINTS,
  BAZAAR_DISCOVERY_EXTENSIONS,
  X402_ROUTE_PATHS,
  clearX402SettlementRegistry,
} from './x402PaymentService.js';
import {
  clearTelemetryState,
  getTransactionFunnelMetrics,
  getMachineRevenueMetrics,
} from './agentTelemetry.js';
import { clearInsiderTradesCache, parseForm4Xml } from './insiderTradesService.js';
import {
  clearCongressTradesCache,
  extractXmlFromZipBuffer,
  parseHouseFdXml,
  parseHousePtrTextRows,
  parseSenatePtrHtmlRows,
} from './congressTradesService.js';

const EXPECTED_PAY_TO = '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708';
const USDC_ASSET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

function makePaidHeader(nonce: string) {
  return JSON.stringify({
    x402Version: 2,
    payload: {
      signature: '0x_sig_insider_congress_' + nonce,
      authorization: {
        from: '0xBuyerWalletInsiderCongress',
        to: EXPECTED_PAY_TO,
        value: '20000',
        nonce,
      },
    },
    accepted: {
      scheme: 'exact',
      network: 'eip155:8453',
      amount: '20000',
      asset: USDC_ASSET,
      payTo: EXPECTED_PAY_TO,
    },
  });
}

function buildTestZip(entries: Array<{ name: string; content: string }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const rawBuf = Buffer.from(entry.content, 'utf8');
    const compBuf = zlib.deflateRawSync(rawBuf);

    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(0, 6);
    lfh.writeUInt16LE(8, 8);
    lfh.writeUInt32LE(0, 14);
    lfh.writeUInt32LE(compBuf.length, 18);
    lfh.writeUInt32LE(rawBuf.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28);

    const localChunk = Buffer.concat([lfh, nameBuf, compBuf]);
    localParts.push(localChunk);

    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0);
    cdh.writeUInt16LE(20, 4);
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(0, 8);
    cdh.writeUInt16LE(8, 10);
    cdh.writeUInt32LE(0, 16);
    cdh.writeUInt32LE(compBuf.length, 20);
    cdh.writeUInt32LE(rawBuf.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt16LE(0, 30);
    cdh.writeUInt16LE(0, 32);
    cdh.writeUInt16LE(0, 34);
    cdh.writeUInt16LE(0, 36);
    cdh.writeUInt32LE(0, 38);
    cdh.writeUInt32LE(offset, 42);

    centralParts.push(Buffer.concat([cdh, nameBuf]));
    offset += localChunk.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

describe('Insider & Congressional Trade Feeds (/api/v1/data/insider & /api/v1/data/congress)', () => {
  let tmpDir: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    resetFacilitatorMock();
    clearX402SettlementRegistry();
    clearTelemetryState();
    clearInsiderTradesCache();
    clearCongressTradesCache();
    process.env.X402_RECIPIENT_ADDRESS = EXPECTED_PAY_TO;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-insider-congress-'));
    process.env.SB_DATA_DIR = tmpDir;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetFacilitatorMock();
    clearX402SettlementRegistry();
    clearTelemetryState();
    clearInsiderTradesCache();
    clearCongressTradesCache();
    delete process.env.SB_DATA_DIR;
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('1. Free /sample routes return static records with 0 network calls', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    for (const route of ['/api/v1/data/insider/sample', '/api/data/insider/sample']) {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(res.body.sample).toBe(true);
      expect(res.body.paidRoute.url).toBe('https://stockbloc.ai.studio/api/v1/data/insider?ticker=NVDA');
      expect(res.body.paidRoute.price).toBe('$0.02 USDC (x402, Base)');
      expect(res.body.output.ticker).toBe('NVDA');
      expect(Array.isArray(res.body.output.transactions)).toBe(true);
      expect(res.body.output.transactions[0].insiderName).toBe('Teter Timothy S.');
      expect(res.body.output.transactions[0].transactionType).toBe('sell');
      expect(res.body.output.transactions[0].filingUrl).toMatch(/^https:\/\/www\.sec\.gov\//);
    }

    for (const route of ['/api/v1/data/congress/sample', '/api/data/congress/sample']) {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(res.body.sample).toBe(true);
      expect(res.body.paidRoute.url).toBe('https://stockbloc.ai.studio/api/v1/data/congress?ticker=NVDA');
      expect(res.body.paidRoute.price).toBe('$0.02 USDC (x402, Base)');
      expect(Array.isArray(res.body.output.trades)).toBe(true);
      expect(res.body.output.trades[0].person).toContain('Pelosi');
      expect(res.body.output.trades[0].chamber).toBe('House');
      expect(res.body.output.trades[0].amountRange).toBe('$250,001 - $500,000');
      expect(res.body.output.trades[0].sourceUrl).toMatch(/^https:\/\/disclosures-clerk\.house\.gov\//);
    }

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('2. Unpaid calls return genuine HTTP 402 with $0.02 USDC (20000 atomic) challenge headers', async () => {
    const routes = [
      '/api/v1/data/insider?ticker=NVDA',
      '/api/data/insider?ticker=NVDA',
      '/api/v1/data/congress?ticker=NVDA',
      '/api/v1/data/congress?person=Pelosi',
      '/api/data/congress?person=Pelosi',
    ];

    for (const route of routes) {
      const res = await request(app).get(route);
      expect(res.status, `Expected 402 on ${route}`).toBe(402);
      expect(res.headers['payment-required']).toBeDefined();

      const decoded = JSON.parse(
        Buffer.from(String(res.headers['payment-required']), 'base64').toString('utf8')
      );
      expect(decoded.x402Version).toBe(2);
      expect(decoded.accepts[0].amount).toBe('20000');
      expect(decoded.accepts[0].payTo).toBe(EXPECTED_PAY_TO);
      expect(decoded.accepts[0].asset).toBe(USDC_ASSET);
      expect(decoded.accepts[0].network).toBe('eip155:8453');
    }
  });

  it('3. Pre-payment 400 and 404 checks return charged:false without HTTP 402 challenge', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes('company_tickers.json')) {
        return new Response(
          JSON.stringify({ '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' } }),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 404 });
    });

    const badInsiderNoTicker = await request(app).get('/api/v1/data/insider');
    expect(badInsiderNoTicker.status).toBe(400);
    expect(badInsiderNoTicker.body.charged).toBe(false);
    expect(badInsiderNoTicker.headers['payment-required']).toBeUndefined();

    const badInsiderLimit = await request(app).get('/api/v1/data/insider?ticker=NVDA&limit=99');
    expect(badInsiderLimit.status).toBe(400);
    expect(badInsiderLimit.body.charged).toBe(false);

    const badInsiderSince = await request(app).get('/api/v1/data/insider?ticker=NVDA&since=not-a-date');
    expect(badInsiderSince.status).toBe(400);
    expect(badInsiderSince.body.charged).toBe(false);

    const unknownTickerRes = await request(app).get('/api/v1/data/insider?ticker=ZZZZZZ999');
    expect(unknownTickerRes.status).toBe(404);
    expect(unknownTickerRes.body.charged).toBe(false);
    expect(unknownTickerRes.headers['payment-required']).toBeUndefined();

    const badCongressMissingBoth = await request(app).get('/api/v1/data/congress');
    expect(badCongressMissingBoth.status).toBe(400);
    expect(badCongressMissingBoth.body.charged).toBe(false);
    expect(badCongressMissingBoth.headers['payment-required']).toBeUndefined();

    const badCongressLimit = await request(app).get('/api/v1/data/congress?ticker=NVDA&limit=0');
    expect(badCongressLimit.status).toBe(400);
    expect(badCongressLimit.body.charged).toBe(false);

    const badCongressSince = await request(app).get('/api/v1/data/congress?person=Pelosi&since=bogus');
    expect(badCongressSince.status).toBe(400);
    expect(badCongressSince.body.charged).toBe(false);
  });

  it('4. Form 4 XML parser handles open-market P buys and S sells while ignoring non-open-market grants (A/M/G)', () => {
    const sampleXml = `
      <ownershipDocument>
        <issuer><issuerTradingSymbol>NVDA</issuerTradingSymbol></issuer>
        <reportingOwner>
          <reportingOwnerId><rptOwnerName>Jensen Huang</rptOwnerName></reportingOwnerId>
          <reportingOwnerRelationship>
            <isDirector>1</isDirector>
            <isOfficer>1</isOfficer>
            <officerTitle>President and CEO</officerTitle>
          </reportingOwnerRelationship>
        </reportingOwner>
        <nonDerivativeTable>
          <nonDerivativeTransaction>
            <transactionDate><value>2026-11-10</value></transactionDate>
            <transactionCoding><transactionCode>S</transactionCode></transactionCoding>
            <transactionAmounts>
              <transactionShares><value>120000</value></transactionShares>
              <transactionPricePerShare><value>148.50</value></transactionPricePerShare>
            </transactionAmounts>
            <postTransactionAmounts>
              <sharesOwnedFollowingTransaction><value>75000000</value></sharesOwnedFollowingTransaction>
            </postTransactionAmounts>
          </nonDerivativeTransaction>
          <nonDerivativeTransaction>
            <transactionDate><value>2026-11-01</value></transactionDate>
            <transactionCoding><transactionCode>A</transactionCode></transactionCoding>
            <transactionAmounts>
              <transactionShares><value>50000</value></transactionShares>
              <transactionPricePerShare><value>0</value></transactionPricePerShare>
            </transactionAmounts>
            <postTransactionAmounts>
              <sharesOwnedFollowingTransaction><value>75120000</value></sharesOwnedFollowingTransaction>
            </postTransactionAmounts>
          </nonDerivativeTransaction>
          <nonDerivativeTransaction>
            <transactionDate><value>2026-10-20</value></transactionDate>
            <transactionCoding><transactionCode>P</transactionCode></transactionCoding>
            <transactionAmounts>
              <transactionShares><value>5000</value></transactionShares>
              <transactionPricePerShare><value>130.00</value></transactionPricePerShare>
            </transactionAmounts>
            <postTransactionAmounts>
              <sharesOwnedFollowingTransaction><value>75070000</value></sharesOwnedFollowingTransaction>
            </postTransactionAmounts>
          </nonDerivativeTransaction>
        </nonDerivativeTable>
      </ownershipDocument>
    `;

    const parsed = parseForm4Xml(
      sampleXml,
      'NVDA',
      '2026-11-12',
      'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000123/xslF345X06/form4.xml'
    );

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      ticker: 'NVDA',
      insiderName: 'Jensen Huang',
      insiderTitle: 'President and CEO',
      transactionDate: '2026-11-10',
      filedDate: '2026-11-12',
      transactionType: 'sell',
      shares: 120000,
      pricePerShare: 148.5,
      totalValue: 17820000,
      sharesOwnedAfter: 75000000,
    });
    expect(parsed[1]).toMatchObject({
      transactionDate: '2026-10-20',
      transactionType: 'buy',
      shares: 5000,
      pricePerShare: 130,
      totalValue: 650000,
      sharesOwnedAfter: 75070000,
    });
  });

  it('5. Paid GET /api/v1/data/insider returns newest-first Form 4 trades, respects since/empty, and logs telemetry', async () => {
    let insiderSettleSeq = 0;
    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xBuyerInsider' }));
    setFacilitatorSettleHandler(async () => ({ success: true, txHash: `0x_tx_insider_${++insiderSettleSeq}`, payer: '0xBuyerInsider' }));

    const form4NewXml = `
      <ownershipDocument>
        <issuer><issuerTradingSymbol>NVDA</issuerTradingSymbol></issuer>
        <reportingOwner>
          <reportingOwnerId><rptOwnerName>Timothy S. Teter</rptOwnerName></reportingOwnerId>
          <reportingOwnerRelationship><isOfficer>1</isOfficer><officerTitle>EVP and General Counsel</officerTitle></reportingOwnerRelationship>
        </reportingOwner>
        <nonDerivativeTable>
          <nonDerivativeTransaction>
            <transactionDate><value>2026-11-14</value></transactionDate>
            <transactionCoding><transactionCode>S</transactionCode></transactionCoding>
            <transactionAmounts>
              <transactionShares><value>1000</value></transactionShares>
              <transactionPricePerShare><value>145.00</value></transactionPricePerShare>
            </transactionAmounts>
            <postTransactionAmounts>
              <sharesOwnedFollowingTransaction><value>250000</value></sharesOwnedFollowingTransaction>
            </postTransactionAmounts>
          </nonDerivativeTransaction>
        </nonDerivativeTable>
      </ownershipDocument>
    `;

    const form4OldXml = `
      <ownershipDocument>
        <issuer><issuerTradingSymbol>NVDA</issuerTradingSymbol></issuer>
        <reportingOwner>
          <reportingOwnerId><rptOwnerName>Mark Stevens</rptOwnerName></reportingOwnerId>
          <reportingOwnerRelationship><isDirector>1</isDirector></reportingOwnerRelationship>
        </reportingOwner>
        <nonDerivativeTable>
          <nonDerivativeTransaction>
            <transactionDate><value>2026-10-02</value></transactionDate>
            <transactionCoding><transactionCode>P</transactionCode></transactionCoding>
            <transactionAmounts>
              <transactionShares><value>2000</value></transactionShares>
              <transactionPricePerShare><value>120.00</value></transactionPricePerShare>
            </transactionAmounts>
            <postTransactionAmounts>
              <sharesOwnedFollowingTransaction><value>1002000</value></sharesOwnedFollowingTransaction>
            </postTransactionAmounts>
          </nonDerivativeTransaction>
        </nonDerivativeTable>
      </ownershipDocument>
    `;

    vi.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes('CIK0001045810.json')) {
        return new Response(
          JSON.stringify({
            name: 'NVIDIA CORP',
            filings: {
              recent: {
                form: ['8-K', '4', '4'],
                accessionNumber: ['0001045810-26-000010', '0001045810-26-000020', '0001045810-26-000005'],
                filingDate: ['2026-11-15', '2026-11-15', '2026-10-03'],
                primaryDocument: ['nvda8k.htm', 'xslF345X06/f4_new.xml', 'xslF345X06/f4_old.xml'],
              },
            },
          }),
          { status: 200 }
        );
      }
      if (url.endsWith('/f4_new.xml')) return new Response(form4NewXml, { status: 200 });
      if (url.endsWith('/f4_old.xml')) return new Response(form4OldXml, { status: 200 });
      return new Response('not found', { status: 404 });
    });

    const paidRes = await request(app)
      .get('/api/v1/data/insider?ticker=NVDA')
      .set('payment-signature', makePaidHeader('nonce_insider_1'));

    expect(paidRes.status).toBe(200);
    expect(paidRes.body.ticker).toBe('NVDA');
    expect(paidRes.body.transactions).toHaveLength(2);
    expect(paidRes.body.transactions[0].insiderName).toBe('Timothy S. Teter');
    expect(paidRes.body.transactions[0].transactionType).toBe('sell');
    expect(paidRes.body.transactions[0].totalValue).toBe(145000);
    expect(paidRes.body.transactions[1].insiderName).toBe('Mark Stevens');
    expect(paidRes.body.transactions[1].insiderTitle).toBe('Director');
    expect(paidRes.body.transactions[1].transactionType).toBe('buy');
    expect(paidRes.body.transactions[0].filingUrl).toContain('https://www.sec.gov/Archives/edgar/data/1045810/');

    const filteredRes = await request(app)
      .get('/api/v1/data/insider?ticker=NVDA&since=2026-11-01T00:00:00Z')
      .set('payment-signature', makePaidHeader('nonce_insider_2'));
    expect(filteredRes.status).toBe(200);
    expect(filteredRes.body.transactions).toHaveLength(1);
    expect(filteredRes.body.transactions[0].insiderName).toBe('Timothy S. Teter');

    const emptyRes = await request(app)
      .get('/api/v1/data/insider?ticker=NVDA&since=2099-01-01T00:00:00Z')
      .set('payment-signature', makePaidHeader('nonce_insider_3'));
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.transactions).toEqual([]);
    expect(emptyRes.body.asOf).toBeDefined();

    const funnel = getTransactionFunnelMetrics();
    expect(funnel.settlementsSucceeded).toBe(3);
    const rev = getMachineRevenueMetrics();
    expect(rev.paymentSuccessCount).toBe(3);
    expect(rev.revenueByEndpoint.data_insider).toBeCloseTo(0.06, 6);
  });

  it('6. House Clerk ZIP parser, PTR text parser, and Senate HTML parser handle real structures accurately', () => {
    const fdXml = `<?xml version="1.0" encoding="utf-8"?>
      <FinancialDisclosure>
        <Member>
          <Prefix>Hon.</Prefix><Last>Pelosi</Last><First>Nancy</First><Suffix></Suffix>
          <FilingType>P</FilingType><StateDst>CA11</StateDst><Year>2026</Year>
          <FilingDate>1/23/2026</FilingDate><DocID>20033725</DocID>
        </Member>
        <Member>
          <Prefix>Hon.</Prefix><Last>Scanned</Last><First>Paper</First><Suffix></Suffix>
          <FilingType>P</FilingType><StateDst>TX01</StateDst><Year>2026</Year>
          <FilingDate>1/10/2026</FilingDate><DocID>8221001</DocID>
        </Member>
      </FinancialDisclosure>`;

    const zipBuf = buildTestZip([
      { name: '2026FD.txt', content: 'Prefix\tLast\tFirst' },
      { name: '2026FD.xml', content: fdXml },
    ]);

    const extractedXml = extractXmlFromZipBuffer(zipBuf);
    expect(extractedXml).toContain('<DocID>20033725</DocID>');

    const filings = parseHouseFdXml(extractedXml!, 2026);
    expect(filings).toHaveLength(1);
    expect(filings[0].person).toBe('Hon. Nancy Pelosi');
    expect(filings[0].disclosedDate).toBe('2026-01-23');
    expect(filings[0].sourceUrl).toBe('https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20033725.pdf');

    const houseRows = parseHousePtrTextRows(
      [
        'SP NVIDIA Corporation (NVDA) [ST] P 01/16/2026 01/16/2026 $250,001 - $500,000 No',
        'SP Apple Inc. (AAPL) [ST] S (partial) 01/15/2026 01/16/2026 $100,001 - $250,000 Yes',
      ],
      filings[0]
    );
    expect(houseRows).toHaveLength(2);
    expect(houseRows[0]).toMatchObject({
      person: 'Hon. Nancy Pelosi',
      chamber: 'House',
      ticker: 'NVDA',
      transactionDate: '2026-01-16',
      transactionType: 'purchase',
      amountRange: '$250,001 - $500,000',
    });
    expect(houseRows[1]).toMatchObject({
      ticker: 'AAPL',
      transactionType: 'sale',
      amountRange: '$100,001 - $250,000',
    });

    const senateHtml = `
      <table class="table"><tbody>
        <tr>
          <td>1</td><td>11/05/2026</td><td>Spouse</td>
          <td><a href="https://finance.yahoo.com/q?s=NVDA" target="_blank">NVDA</a></td>
          <td>NVIDIA Corp</td><td>Stock</td><td>Sale (Full)</td><td>$50,001 - $100,000</td><td>--</td>
        </tr>
      </tbody></table>`;
    const senateRows = parseSenatePtrHtmlRows(senateHtml, {
      person: 'Markwayne Mullin',
      disclosedDate: '2026-11-12',
      sourceUrl: 'https://efdsearch.senate.gov/search/view/ptr/abc-123/',
    });
    expect(senateRows).toHaveLength(1);
    expect(senateRows[0]).toMatchObject({
      person: 'Markwayne Mullin',
      chamber: 'Senate',
      ticker: 'NVDA',
      transactionDate: '2026-11-05',
      disclosedDate: '2026-11-12',
      transactionType: 'sale',
      amountRange: '$50,001 - $100,000',
    });
  });

  it('7. Paid GET /api/v1/data/congress filters by person/ticker, merges House+Senate newest first, and reports partial chamber availability honestly', async () => {
    let congressSettleSeq = 0;
    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xBuyerCongress' }));
    setFacilitatorSettleHandler(async () => ({ success: true, txHash: `0x_tx_congress_${++congressSettleSeq}`, payer: '0xBuyerCongress' }));

    const currentYear = new Date().getUTCFullYear();
    const fdXml = `<?xml version="1.0" encoding="utf-8"?>
      <FinancialDisclosure>
        <Member>
          <Prefix>Hon.</Prefix><Last>Pelosi</Last><First>Nancy</First>
          <FilingType>P</FilingType><Year>${currentYear}</Year>
          <FilingDate>01/23/${currentYear}</FilingDate><DocID>20033725</DocID>
        </Member>
      </FinancialDisclosure>`;
    const zipBuf = buildTestZip([{ name: `${currentYear}FD.xml`, content: fdXml }]);

    let senateDown = false;
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: RequestInit) => {
      const url = String(input);
      if (url.includes(`${currentYear}FD.zip`)) {
        return new Response(zipBuf, { status: 200 });
      }
      if (url.includes(`${currentYear - 1}FD.zip`)) {
        return new Response(buildTestZip([{ name: `${currentYear - 1}FD.xml`, content: '<FinancialDisclosure></FinancialDisclosure>' }]), { status: 200 });
      }
      if (url.includes('/ptr-pdfs/')) {
        return new Response(
          `SP NVIDIA Corporation (NVDA) [ST] P 01/16/${currentYear} 01/16/${currentYear} $250,001 - $500,000`,
          { status: 200 }
        );
      }
      if (url.includes('efdsearch.senate.gov')) {
        if (senateDown) {
          return new Response('Service Unavailable', { status: 503 });
        }
        if (url.endsWith('/search/home/')) {
          const isPost = init?.method === 'POST';
          const res = new Response('<input type="hidden" name="csrfmiddlewaretoken" value="tok123" />', { status: isPost ? 302 : 200 });
          (res.headers as any).getSetCookie = () =>
            isPost ? ['sessionid=sess123; Path=/', 'csrftoken=tok123; Path=/'] : ['csrftoken=tok123; Path=/'];
          return res;
        }
        if (url.endsWith('/search/report/data/')) {
          return new Response(
            JSON.stringify({
              data: [
                [
                  'Markwayne',
                  'Mullin',
                  'Senator',
                  '<a href="/search/view/ptr/sen-uuid-1/" target="_blank">Periodic Transaction Report</a>',
                  `11/12/${currentYear}`,
                ],
              ],
            }),
            { status: 200 }
          );
        }
        if (url.includes('/search/view/ptr/sen-uuid-1/')) {
          return new Response(
            `<table><tbody><tr>
              <td>1</td><td>11/05/${currentYear}</td><td>Self</td>
              <td><a href="#">NVDA</a></td><td>NVIDIA Corp</td><td>Stock</td>
              <td>Purchase</td><td>$15,001 - $50,000</td><td>--</td>
            </tr></tbody></table>`,
            { status: 200 }
          );
        }
      }
      return new Response('not found', { status: 404 });
    });

    // Query by ticker -> merges Senate (Nov 05) + House (Jan 16), newest first
    const byTicker = await request(app)
      .get('/api/v1/data/congress?ticker=NVDA')
      .set('payment-signature', makePaidHeader('nonce_cong_1'));
    expect(byTicker.status).toBe(200);
    expect(byTicker.body.chamberStatus).toEqual({ house: 'available', senate: 'available' });
    expect(byTicker.body.trades).toHaveLength(2);
    expect(byTicker.body.trades[0].chamber).toBe('Senate');
    expect(byTicker.body.trades[0].amountRange).toBe('$15,001 - $50,000');
    expect(byTicker.body.trades[1].chamber).toBe('House');
    expect(byTicker.body.trades[1].person).toBe('Hon. Nancy Pelosi');
    expect(byTicker.body.trades[1].amountRange).toBe('$250,001 - $500,000');

    // Now simulate Senate outage -> House still succeeds and chamberStatus reports senate: unavailable
    clearCongressTradesCache();
    senateDown = true;

    const byPersonPartial = await request(app)
      .get('/api/v1/data/congress?person=Pelosi')
      .set('payment-signature', makePaidHeader('nonce_cong_2'));
    expect(byPersonPartial.status).toBe(200);
    expect(byPersonPartial.body.chamberStatus).toEqual({ house: 'available', senate: 'unavailable' });
    expect(byPersonPartial.body.trades).toHaveLength(1);
    expect(byPersonPartial.body.trades[0].person).toBe('Hon. Nancy Pelosi');
    expect(byPersonPartial.body.trades[0].ticker).toBe('NVDA');

    // Non-matching query returns HTTP 200 with empty trades array
    const emptyRes = await request(app)
      .get('/api/v1/data/congress?person=NobodyMatchingXYZ')
      .set('payment-signature', makePaidHeader('nonce_cong_3'));
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.trades).toEqual([]);

    const funnel = getTransactionFunnelMetrics();
    expect(funnel.settlementsSucceeded).toBe(3);
    const rev = getMachineRevenueMetrics();
    expect(rev.revenueByEndpoint.data_congress).toBeCloseTo(0.06, 6);
  });

  it('8. Discovery surfaces (x402, manifest, OpenAPI, llms.txt, skill.md, MCP) stay consistent for data_insider & data_congress', async () => {
    expect(PRICED_ENDPOINTS.data_insider.atomicAmount).toBe('20000');
    expect(PRICED_ENDPOINTS.data_congress.atomicAmount).toBe('20000');
    expect(BAZAAR_DISCOVERY_EXTENSIONS.data_insider).toBeDefined();
    expect(BAZAAR_DISCOVERY_EXTENSIONS.data_congress).toBeDefined();
    expect(X402_ROUTE_PATHS.data_insider).toContain('/api/v1/data/insider');
    expect(X402_ROUTE_PATHS.data_congress).toContain('/api/v1/data/congress');

    const x402Res = await request(app).get('/.well-known/x402');
    expect(x402Res.status).toBe(200);
    const ids = x402Res.body.endpoints.map((e: any) => e.id);
    expect(ids).toContain('data_insider');
    expect(ids).toContain('data_congress');

    const manifestRes = await request(app).get('/api/v1/agents/manifest.json');
    expect(manifestRes.status).toBe(200);
    expect(manifestRes.body.endpoints.dataInsider.path).toBe('/api/v1/data/insider');
    expect(manifestRes.body.endpoints.dataInsider.x402.atomicAmount).toBe('20000');
    expect(manifestRes.body.endpoints.dataCongress.path).toBe('/api/v1/data/congress');
    expect(manifestRes.body.endpoints.dataCongress.x402.atomicAmount).toBe('20000');

    for (const rel of ['public/openapi.json', 'public/api/v1/openapi.json']) {
      const doc = JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8'));
      expect(doc.paths['/api/v1/data/insider']).toBeDefined();
      expect(doc.paths['/api/v1/data/insider/sample']).toBeDefined();
      expect(doc.paths['/api/v1/data/congress']).toBeDefined();
      expect(doc.paths['/api/v1/data/congress/sample']).toBeDefined();
    }

    const llmsTxt = fs.readFileSync(path.join(process.cwd(), 'public', 'llms.txt'), 'utf8');
    expect(llmsTxt).toContain('/api/v1/data/insider');
    expect(llmsTxt).toContain('/api/v1/data/congress');

    const skillMd = fs.readFileSync(path.join(process.cwd(), 'public', 'agents', 'skill.md'), 'utf8');
    expect(skillMd).toContain('/api/v1/data/insider');
    expect(skillMd).toContain('/api/v1/data/congress');

    const mcpList = await request(app)
      .post('/api/mcp/rpc')
      .send({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    expect(mcpList.status).toBe(200);
    const names = mcpList.body.result.tools.map((t: any) => t.name);
    expect(names).toContain('get_insider_trades');
    expect(names).toContain('get_congress_trades');

    // Unpaid MCP tools/call returns structured x402 payment_required envelope
    const mcpUnpaid = await request(app)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'get_insider_trades', arguments: { ticker: 'NVDA' } },
      });
    expect(mcpUnpaid.status).toBe(200);
    expect(mcpUnpaid.body.result.isError).toBe(true);
    expect(mcpUnpaid.body.result.structuredContent.statusCode).toBe(402);
    expect(mcpUnpaid.body.result.structuredContent.accepts[0].amount).toBe('20000');
  });
});
