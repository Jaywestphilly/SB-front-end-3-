#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { validateMarketDataset } from '../src/services/marketDataService.js';

function main() {
  console.log("=========================================================");
  console.log(" STOCK BLOC: VALIDATING MARKET WATCHLIST DATASET");
  console.log("=========================================================");

  const targetPaths = [
    path.join(process.cwd(), "market_watchlist_data.json"),
    path.join(process.cwd(), "public", "market_watchlist_data.json")
  ];

  let failed = false;

  for (const filePath of targetPaths) {
    console.log(`--> Inspecting ${filePath}...`);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ CRITICAL: File missing at ${filePath}`);
      failed = true;
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const validation = validateMarketDataset(data);

      if (!validation.valid) {
        console.error(`❌ CRITICAL: Validation failed for ${filePath}:`);
        validation.errors.forEach((err) => console.error(`   - ${err}`));
        failed = true;
      } else {
        console.log(`✅ SUCCESS: ${filePath} passed strict market data validation! (${data.watchlist.length} stocks verified)`);
      }
    } catch (e: any) {
      console.error(`❌ CRITICAL: Failed to parse or read ${filePath}:`, e?.message || e);
      failed = true;
    }
  }

  if (failed) {
    console.error(`\n💥 MARKET DATA VALIDATION FAILED LOUDLIES! Review errors above.`);
    process.exit(1);
  }

  console.log("\n🎉 ALL MARKET WATCHLIST FILES VALIDATED SUCCESSFULLY!");
  process.exit(0);
}

main();
