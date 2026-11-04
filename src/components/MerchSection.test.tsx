import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MerchSection, MERCH_PRODUCTS } from "./MerchSection";

describe("MerchSection component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Merch section with title Stock Bloc Merch", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<MerchSection />);
    expect(screen.getByRole("heading", { name: /Stock Bloc Merch/i })).toBeInTheDocument();
  });

  it("renders the View All link to the full collection", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<MerchSection />);
    const viewAllLink = screen.getByRole("link", { name: /View All/i });
    expect(viewAllLink).toHaveAttribute("href", "https://thestockbloc.myshopify.com/collections/all");
    expect(viewAllLink).toHaveAttribute("target", "_blank");
    expect(viewAllLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders all 39 merch cards with thestockbloc.myshopify.com links and loads all images at runtime from <handle>.json", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      const match = url.match(/https:\/\/thestockbloc\.myshopify\.com\/products\/([^/]+)\.json$/);
      const handle = match ? match[1] : "unknown";
      return {
        ok: true,
        json: async () => ({
          product: {
            image: {
              src: `https://cdn.shopify.com/mock/${handle}.jpg`,
            },
          },
        }),
      } as Response;
    });

    render(<MerchSection />);

    expect(MERCH_PRODUCTS).toHaveLength(39);

    const allLinks = screen.getAllByRole("link");

    for (const product of MERCH_PRODUCTS) {
      expect(screen.getByText(product.name)).toBeInTheDocument();
      expect(product.url).toBe(`https://thestockbloc.myshopify.com/products/${product.handle}`);

      const link = allLinks.find((l) => l.getAttribute("href") === product.url);
      expect(link).toBeDefined();
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link?.textContent).toContain("Shop");
    }

    await waitFor(() => {
      for (const product of MERCH_PRODUCTS) {
        const image = screen.getByAltText(product.name);
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute("src", `https://cdn.shopify.com/mock/${product.handle}.jpg`);
      }
    });

    expect(fetchSpy).toHaveBeenCalledTimes(39);
  });

  it("shows name and price with no image instead of a placeholder if the Shopify JSON fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    render(<MerchSection />);

    expect(screen.getByText("Neon Logo Tee")).toBeInTheDocument();
    expect(screen.getByText("Stock Bloc Flyers Snow Tee")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("does not include shipping or discount claims", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    const { container } = render(<MerchSection />);
    const text = container.textContent?.toLowerCase() || "";
    expect(text).not.toContain("free shipping");
    expect(text).not.toContain("discount");
    expect(text).not.toContain("sale");
    expect(text).not.toMatch(/\b\d+%\s*off\b/i);
    expect(text).not.toMatch(/\bshipping\b/i);
  });
});
