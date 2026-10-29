import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopNavbar } from "./TopNavbar";

describe("TopNavbar main nav menu", () => {
  it("includes a Shop link that opens the Shopify collection in a new tab", () => {
    render(<TopNavbar activeTab="brand" onSelectTab={vi.fn()} />);

    const shopLink = screen.getByRole("link", { name: /shop/i });
    expect(shopLink).toBeInTheDocument();
    expect(shopLink).toHaveAttribute(
      "href",
      "https://t98k4m-v0.myshopify.com/collections/stock-bloc-tees"
    );
    expect(shopLink).toHaveAttribute("target", "_blank");
    expect(shopLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
