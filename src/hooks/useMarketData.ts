import { useEffect, useState } from 'react';
import { getSocket } from '../utils/websocket';
import { cacheData, getCachedData } from '../utils/indexedDB';

export interface MarketUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

export const useMarketData = (symbol: string) => {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    // Try to load cached price first for offline fallback
    getCachedData<number>(`price-${symbol}`).then((cachedPrice) => {
      if (cachedPrice && !price) {
        setPrice(cachedPrice);
      }
    });

    const socket = getSocket();
    
    const handleUpdate = (data: MarketUpdate) => {
      if (data.symbol === symbol) {
        setPrice(data.price);
        // Cache the latest price in IndexedDB
        cacheData(`price-${symbol}`, data.price).catch(console.error);
      }
    };

    socket.on('market_update', handleUpdate);

    return () => {
      socket.off('market_update', handleUpdate);
    };
  }, [symbol]);

  return { price };
};
