import React, { useEffect, useState } from "react";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface MerchProduct {
  id: string;
  name: string;
  price: string;
  handle: string;
  url: string;
}

export const MERCH_PRODUCTS: MerchProduct[] = [
  {
    id: "neon-logo-tee",
    name: "Neon Logo Tee",
    price: "$29.99",
    handle: "stock-bloc-neon-logo-tee",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-neon-logo-tee",
  },
  {
    id: "outline-logo-tee",
    name: "Outline Logo Tee",
    price: "$29.99",
    handle: "stock-bloc-outline-logo-tee",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-outline-logo-tee",
  },
  {
    id: "sparkle-outline-tee",
    name: "Sparkle Outline Tee",
    price: "$29.99",
    handle: "stock-bloc-sparkle-outline-tee",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-sparkle-outline-tee",
  },
  {
    id: "sixers-sparkle-tee",
    name: "Sixers Sparkle Tee",
    price: "$29.99",
    handle: "stock-bloc-sixers-sparkle-tee",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-sixers-sparkle-tee",
  },
  {
    id: "eagles-sparkle-tee",
    name: "Eagles Sparkle Tee",
    price: "$29.99",
    handle: "stock-bloc-eagles-sparkle-tee",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-eagles-sparkle-tee",
  },
  {
    id: "phillies-sparkle-tee",
    name: "Phillies Sparkle Tee",
    price: "$29.99",
    handle: "stock-bloc-phillies-sparkle-tee",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-phillies-sparkle-tee",
  },
  {
    id: "philly-connect-sparkle-tee",
    name: "Philly Connect Sparkle Tee",
    price: "$29.99",
    handle: "stock-bloc-philly-connect-sparkle-tee",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-philly-connect-sparkle-tee",
  },
  {
    id: "quiet-snow-hoodie",
    name: "Quiet Snow Hoodie",
    price: "$54.99",
    handle: "stock-bloc-neon-logo-hoodie",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-neon-logo-hoodie",
  },
  {
    id: "quiet-snow-crewneck",
    name: "Quiet Snow Crewneck",
    price: "$44.99",
    handle: "stock-bloc-neon-logo-crewneck-sweatshirt",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-neon-logo-crewneck-sweatshirt",
  },
  {
    id: "quiet-snow-long-sleeve",
    name: "Quiet Snow Long Sleeve",
    price: "$34.99",
    handle: "stock-bloc-neon-logo-long-sleeve-tee",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-neon-logo-long-sleeve-tee",
  },
  {
    id: "neon-two-tone-cap",
    name: "Neon Two-Tone Cap",
    price: "$29.99",
    handle: "stock-bloc-neon-two-tone-cap",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-neon-two-tone-cap",
  },
  {
    id: "neon-logo-stickers",
    name: "Neon Logo Stickers",
    price: "from $4.99",
    handle: "bubble-free-stickers",
    url: "https://thestockbloc.myshopify.com/products/bubble-free-stickers",
  },
  {
    id: "stock-bloc-flyers-snow-tee",
    name: "Stock Bloc Flyers Snow Tee",
    price: "$29.99",
    handle: "stock-bloc-flyers-snow-tee",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-flyers-snow-tee",
  },
  {
    id: "bullish-patient-liquid-pick-two-tee",
    name: "Bullish Patient Liquid Pick Two Tee",
    price: "$29.99",
    handle: "bullish-patient-liquid-pick-two-tee",
    url: "https://thestockbloc.myshopify.com/products/bullish-patient-liquid-pick-two-tee",
  },
  {
    id: "good-fast-cheap-pick-two-tee",
    name: "Good Fast Cheap Pick Two Tee",
    price: "$29.99",
    handle: "good-fast-cheap-pick-two-tee",
    url: "https://thestockbloc.myshopify.com/products/good-fast-cheap-pick-two-tee",
  },
  {
    id: "i-just-like-the-stock-tee",
    name: "I Just Like The Stock Tee",
    price: "$29.99",
    handle: "i-just-like-the-stock-tee",
    url: "https://thestockbloc.myshopify.com/products/i-just-like-the-stock-tee",
  },
  {
    id: "bitcoin-fixes-this-tee",
    name: "Bitcoin Fixes This Tee",
    price: "$29.99",
    handle: "bitcoin-fixes-this-tee",
    url: "https://thestockbloc.myshopify.com/products/bitcoin-fixes-this-tee",
  },
  {
    id: "diamond-hands-beanie",
    name: "Diamond Hands Beanie",
    price: "$24.99",
    handle: "diamond-hands-beanie",
    url: "https://thestockbloc.myshopify.com/products/diamond-hands-beanie",
  },
  {
    id: "priced-in-dad-hat",
    name: "Priced In Dad Hat",
    price: "$29.99",
    handle: "priced-in-dad-hat",
    url: "https://thestockbloc.myshopify.com/products/priced-in-dad-hat",
  },
  {
    id: "buy-the-dip-mug",
    name: "Buy The Dip Mug",
    price: "from $22.99",
    handle: "buy-the-dip-mug",
    url: "https://thestockbloc.myshopify.com/products/buy-the-dip-mug",
  },
  {
    id: "still-accumulating-tumbler",
    name: "Still Accumulating Tumbler",
    price: "$39.99",
    handle: "still-accumulating-tumbler",
    url: "https://thestockbloc.myshopify.com/products/still-accumulating-tumbler",
  },
  {
    id: "hodl-chart-crossbody-bag",
    name: "HODL Chart Crossbody Bag",
    price: "$44.99",
    handle: "hodl-chart-crossbody-bag",
    url: "https://thestockbloc.myshopify.com/products/hodl-chart-crossbody-bag",
  },
  {
    id: "rising-chart-aop-shorts",
    name: "Rising Chart AOP Shorts",
    price: "$42.99",
    handle: "rising-chart-aop-shorts",
    url: "https://thestockbloc.myshopify.com/products/rising-chart-aop-shorts",
  },
  {
    id: "rising-chart-aop-joggers",
    name: "Rising Chart AOP Joggers",
    price: "$69.99",
    handle: "rising-chart-aop-joggers",
    url: "https://thestockbloc.myshopify.com/products/rising-chart-aop-joggers",
  },
  {
    id: "rising-chart-aop-hoodie",
    name: "Rising Chart AOP Hoodie",
    price: "$69.99",
    handle: "rising-chart-aop-hoodie",
    url: "https://thestockbloc.myshopify.com/products/rising-chart-aop-hoodie",
  },
  {
    id: "few-understand-box-hoodie",
    name: "Data Centers Need Space Box Hoodie",
    price: "$64.99",
    handle: "few-understand-box-hoodie",
    url: "https://thestockbloc.myshopify.com/products/few-understand-box-hoodie",
  },
  {
    id: "zoom-out-oversized-heavyweight-hoodie",
    name: "Zoom Out Oversized Heavyweight Hoodie",
    price: "$74.99",
    handle: "zoom-out-oversized-heavyweight-hoodie",
    url: "https://thestockbloc.myshopify.com/products/zoom-out-oversized-heavyweight-hoodie",
  },
  {
    id: "not-financial-advice-garment-dyed-tee",
    name: "Not Financial Advice Garment-Dyed Tee",
    price: "$36.99",
    handle: "not-financial-advice-garment-dyed-tee",
    url: "https://thestockbloc.myshopify.com/products/not-financial-advice-garment-dyed-tee",
  },
  {
    id: "the-trend-is-your-friend-boxy-tee",
    name: "The Trend Is Your Friend Boxy Tee",
    price: "$36.99",
    handle: "the-trend-is-your-friend-boxy-tee",
    url: "https://thestockbloc.myshopify.com/products/the-trend-is-your-friend-boxy-tee",
  },
  {
    id: "buy-high-sell-low-faded-oversized-tee",
    name: "Buy High Sell Low Faded Oversized Tee",
    price: "$49.99",
    handle: "buy-high-sell-low-faded-oversized-tee",
    url: "https://thestockbloc.myshopify.com/products/buy-high-sell-low-faded-oversized-tee",
  },
  {
    id: "compound-interest-garment-dyed-sweatpants",
    name: "Compound Interest Garment-Dyed Sweatpants",
    price: "$64.99",
    handle: "compound-interest-garment-dyed-sweatpants",
    url: "https://thestockbloc.myshopify.com/products/compound-interest-garment-dyed-sweatpants",
  },
  {
    id: "bear-market-survivor-fleece-sweatpants",
    name: "Bear Market Survivor Fleece Sweatpants",
    price: "$59.99",
    handle: "bear-market-survivor-fleece-sweatpants",
    url: "https://thestockbloc.myshopify.com/products/bear-market-survivor-fleece-sweatpants",
  },
  {
    id: "stock-bloc-logo-corduroy-hat",
    name: "Stock Bloc Logo Corduroy Hat",
    price: "$34.99",
    handle: "stock-bloc-logo-corduroy-hat",
    url: "https://thestockbloc.myshopify.com/products/stock-bloc-logo-corduroy-hat",
  },
  {
    id: "to-the-moon-corduroy-hat",
    name: "To The Moon Corduroy Hat",
    price: "$34.99",
    handle: "to-the-moon-corduroy-hat",
    url: "https://thestockbloc.myshopify.com/products/to-the-moon-corduroy-hat",
  },
  {
    id: "to-the-moon-5-panel-cap",
    name: "To The Moon 5-Panel Cap",
    price: "$32.99",
    handle: "to-the-moon-5-panel-cap",
    url: "https://thestockbloc.myshopify.com/products/to-the-moon-5-panel-cap",
  },
  {
    id: "rising-chart-bomber-jacket",
    name: "Rising Chart Bomber Jacket",
    price: "$99.99",
    handle: "rising-chart-bomber-jacket",
    url: "https://thestockbloc.myshopify.com/products/rising-chart-bomber-jacket",
  },
  {
    id: "rising-chart-minimalist-backpack",
    name: "Rising Chart Minimalist Backpack",
    price: "$74.99",
    handle: "rising-chart-minimalist-backpack",
    url: "https://thestockbloc.myshopify.com/products/rising-chart-minimalist-backpack",
  },
  {
    id: "patience-pays-slides",
    name: "Patience Pays Slides",
    price: "$59.99",
    handle: "patience-pays-slides",
    url: "https://thestockbloc.myshopify.com/products/patience-pays-slides",
  },
  {
    id: "the-stock-bloc-sherpa-blanket",
    name: "The Stock Bloc Sherpa Blanket",
    price: "$94.99",
    handle: "the-stock-bloc-sherpa-blanket",
    url: "https://thestockbloc.myshopify.com/products/the-stock-bloc-sherpa-blanket",
  },
  {
    id: "bull-run-black-foot-socks",
    name: "Bull Run Black Foot Socks",
    price: "$22.99",
    handle: "bull-run-black-foot-socks",
    url: "https://thestockbloc.myshopify.com/products/bull-run-black-foot-socks",
  },
];

interface MerchSectionProps {
  className?: string;
}

export const MerchSection: React.FC<MerchSectionProps> = ({ className = "" }) => {
  const [shopifyImages, setShopifyImages] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    MERCH_PRODUCTS.forEach(async (item) => {
      if (!item.handle || typeof fetch !== "function") return;
      try {
        const res = await fetch(`https://thestockbloc.myshopify.com/products/${item.handle}.json`);
        if (!res || !res.ok) return;
        const data = await res.json();
        const src = data?.product?.image?.src;
        if (isMounted && typeof src === "string" && src.trim().length > 0) {
          setShopifyImages((prev) => ({ ...prev, [item.handle]: src }));
        }
      } catch {
        // If fetch fails, show name and price with no image instead of a placeholder
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      aria-label="Stock Bloc Merch"
      className={`relative bg-black rounded-3xl p-6 sm:p-8 border-2 border-cyan-500/40 text-white shadow-2xl overflow-hidden ${className}`}
    >
      {/* Background Cyan Radial Luminescence */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/25 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00E5FF10_1px,transparent_1px),linear-gradient(to_bottom,#00E5FF10_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/30 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-[#00E5FF]/50 flex items-center justify-center text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.25)] shrink-0">
            <ShoppingBag className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-mono text-cyan-100 uppercase tracking-wider alien-text-glow">
              Stock Bloc Merch
            </h2>
            <p className="text-xs text-[#00E5FF]/80 font-mono tracking-wider uppercase mt-0.5">
              Official Tees & Apparel Collection
            </p>
          </div>
        </div>

        <a
          href="https://thestockbloc.myshopify.com/collections/all"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerHaptic("selection")}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-[#00E5FF]/40 text-[#00E5FF] hover:text-white rounded-xl text-xs font-mono font-bold tracking-wide transition-all shadow-sm w-fit"
        >
          <span>View All</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Grid of Merch Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MERCH_PRODUCTS.map((item) => {
          const resolvedImage = shopifyImages[item.handle];
          const showImage = Boolean(resolvedImage && !failedImages[item.id]);

          return (
            <div
              key={item.id}
              className="group relative bg-black/90 hover:bg-[#020b14] border border-[#00E5FF]/30 hover:border-[#00E5FF] rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]"
            >
              <div>
                {/* Product Image (hidden if fetch fails or not loaded yet) */}
                {showImage && (
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-neutral-950 border border-cyan-500/20 mb-3.5 relative flex items-center justify-center">
                    <img
                      src={resolvedImage}
                      alt={item.name}
                      loading="lazy"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}

                {/* Name & Price */}
                <div className="space-y-1.5">
                  <h3 className="font-mono font-bold text-white text-sm uppercase tracking-wide group-hover:text-[#00E5FF] transition-colors leading-snug line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="text-sm font-black font-mono text-[#00E5FF]">
                    {item.price}
                  </div>
                </div>
              </div>

              {/* Bottom row: Shop Button */}
              <div className="mt-4 pt-3 border-t border-cyan-500/20">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => triggerHaptic("selection")}
                  className="w-full py-2 px-4 rounded-xl bg-black hover:bg-[#00E5FF] border border-[#00E5FF] text-[#00E5FF] hover:text-black font-mono font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <span>Shop</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MerchSection;
