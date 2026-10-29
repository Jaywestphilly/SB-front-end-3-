import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MerchSection, MERCH_PRODUCTS } from "./MerchSection";

describe("MerchSection component", () => {
  it("renders the Merch section with title Stock Bloc Merch", () => {
    render(<MerchSection />);
    expect(screen.getByRole("heading", { name: /Stock Bloc Merch/i })).toBeInTheDocument();
  });

  it("renders exactly 7 merch cards with the specified tees and $29.99 price", () => {
    render(<MerchSection />);

    const expectedTees = [
      {
        name: "Neon Logo Tee",
        url: "https://t98k4m-v0.myshopify.com/products/stock-bloc-neon-logo-tee",
      },
      {
        name: "Outline Logo Tee",
        url: "https://t98k4m-v0.myshopify.com/products/stock-bloc-outline-logo-tee",
      },
      {
        name: "Sparkle Outline Tee",
        url: "https://t98k4m-v0.myshopify.com/products/stock-bloc-sparkle-outline-tee",
      },
      {
        name: "Sixers Sparkle Tee",
        url: "https://t98k4m-v0.myshopify.com/products/stock-bloc-sixers-sparkle-tee",
      },
      {
        name: "Eagles Sparkle Tee",
        url: "https://t98k4m-v0.myshopify.com/products/stock-bloc-eagles-sparkle-tee",
      },
      {
        name: "Phillies Sparkle Tee",
        url: "https://t98k4m-v0.myshopify.com/products/stock-bloc-phillies-sparkle-tee",
      },
      {
        name: "Philly Connect Sparkle Tee",
        url: "https://t98k4m-v0.myshopify.com/products/stock-bloc-philly-connect-sparkle-tee",
      },
    ];

    expect(MERCH_PRODUCTS).toHaveLength(7);

    expectedTees.forEach((tee) => {
      expect(screen.getByText(tee.name)).toBeInTheDocument();
      const link = screen.getAllByRole("link").find((l) => l.getAttribute("href") === tee.url);
      expect(link).toBeDefined();
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link?.textContent).toContain("Shop");
    });

    const prices = screen.getAllByText("$29.99");
    expect(prices).toHaveLength(7);
  });

  it("does not include shipping or discount claims", () => {
    const { container } = render(<MerchSection />);
    const text = container.textContent?.toLowerCase() || "";
    expect(text).not.toContain("free shipping");
    expect(text).not.toContain("discount");
    expect(text).not.toContain("sale");
    expect(text).not.toMatch(/\b\d+%\s*off\b/i);
    expect(text).not.toMatch(/\bshipping\b/i);
  });
});
