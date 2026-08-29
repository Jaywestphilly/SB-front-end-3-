import { get, set, clear } from 'idb-keyval';

export const cacheData = async <T>(key: string, data: T): Promise<void> => {
  try {
    await set(key, data);
  } catch (error) {
    console.error('Failed to cache data in IndexedDB:', error);
  }
};

export const getCachedData = async <T>(key: string): Promise<T | undefined> => {
  try {
    return await get<T>(key);
  } catch (error) {
    console.error('Failed to retrieve data from IndexedDB:', error);
    return undefined;
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    await clear();
  } catch (error) {
    console.error('Failed to clear IndexedDB cache:', error);
  }
};
