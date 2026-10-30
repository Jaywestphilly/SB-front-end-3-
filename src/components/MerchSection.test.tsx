import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MerchSection, MERCH_PRODUCTS } from "./MerchSection";

describe("MerchSection component", () => {
  it("renders the Merch section with title Stock Bloc Merch", () => {
    render(<MerchSection />);
    expect(screen.getByRole("heading", { name: /Stock Bloc Merch/i })).toBeInTheDocument();
  });

  it("renders the View All link to the full collection", () => {
    render(<MerchSection />);
    const viewAllLink = screen.getByRole("link", { name: /View All/i });
    expect(viewAllLink).toHaveAttribute("href", "https://t98k4m-v0.myshopify.com/collections/all");
    expect(viewAllLink).toHaveAttribute("target", "_blank");
    expect(viewAllLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders exactly 12 merch cards with product name, price, image, and Shop button", () => {
    render(<MerchSection />);

    expect(MERCH_PRODUCTS).toHaveLength(12);

    MERCH_PRODUCTS.forEach((product) => {
      expect(screen.getByText(product.name)).toBeInTheDocument();

      const image = screen.getByAltText(product.name);
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", product.image);

      const link = screen.getAllByRole("link").find((l) => l.getAttribute("href") === product.url);
      expect(link).toBeDefined();
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link?.textContent).toContain("Shop");
    });

    // Check prices
    expect(screen.getAllByText("$29.99")).toHaveLength(8);
    expect(screen.getByText("$54.99")).toBeInTheDocument();
    expect(screen.getByText("$44.99")).toBeInTheDocument();
    expect(screen.getByText("$34.99")).toBeInTheDocument();
    expect(screen.getByText("from $4.99")).toBeInTheDocument();
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
