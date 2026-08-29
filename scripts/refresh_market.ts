#!/usr/bin/env tsx
import { MarketDataService } from '../src/services/marketDataService.js';

async function main() {
  console.log("=========================================================");
  console.log(" STOCK BLOC: REFRESHING MARKET WATCHLIST DATA SERVICE");
  console.log("=========================================================");

  try {
    const data = await MarketDataService.refreshMarketData();
    console.log(`[Market Data Service] Feed updated successfully!`);
    console.log(`- Updated At: ${data.updated_at}`);
    console.log(`- Last Successful Update: ${data.last_successful_update}`);
    console.log(`- Provider / Source: ${data.source}`);
    console.log(`- Status Label: ${data.status_label.toUpperCase()}`);
    console.log(`- Data Age: ${data.data_age_seconds} seconds`);
    console.log(`- Watchlist Items: ${data.watchlist.length}`);

    data.watchlist.forEach((stock) => {
      console.log(
        `  * [${stock.symbol}] $${stock.price} (${stock.percent_change >= 0 ? '+' : ''}${stock.percent_change}%) - Signal: ${stock.signal?.signalScore}/100 [${stock.signal?.signalLabel}]`
      );
    });

    process.exit(0);
  } catch (err: any) {
    console.error(`\n🚨 CRITICAL ERROR in refresh:market script:\n`, err?.message || err);
    process.exit(1);
  }
}

main();
