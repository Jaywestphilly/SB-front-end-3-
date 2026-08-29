import { describe, it, expect } from 'vitest';
import { TAB_TITLES, TAB_DESCRIPTIONS, TAB_IMAGES, pushAppRoute } from './router';

describe('router metadata and social previews', () => {
  it('defines distinct titles, descriptions, and images for /watchlist, /news, and /dyson-swarm', () => {
    expect(TAB_TITLES.watchlist).toContain('Watchlist');
    expect(TAB_TITLES.news).toContain('Intelligence');
    expect(TAB_TITLES.dyson_swarm).toContain('Dyson Swarm');

    expect(TAB_DESCRIPTIONS.watchlist).toBeDefined();
    expect(TAB_DESCRIPTIONS.news).toBeDefined();
    expect(TAB_DESCRIPTIONS.dyson_swarm).toBeDefined();

    expect(TAB_IMAGES.watchlist).toBeDefined();
    expect(TAB_IMAGES.news).toBeDefined();
    expect(TAB_IMAGES.dyson_swarm).toBeDefined();
  });

  it('pushAppRoute updates document title correctly', () => {
    pushAppRoute('news');
    expect(document.title).toBe(TAB_TITLES.news);

    pushAppRoute('dyson_swarm');
    expect(document.title).toBe(TAB_TITLES.dyson_swarm);
  });

  it('pushAppRoute supports stockSymbol for dynamic analysis card title and url', () => {
    pushAppRoute('watchlist', false, 'AAOI');
    expect(document.title).toContain('AAOI');
    expect(document.title).toContain('Stock Analysis');
  });
});
