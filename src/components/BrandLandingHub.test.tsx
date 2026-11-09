import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandLandingHub } from "./BrandLandingHub";

describe("BrandLandingHub home page", () => {
  it("renders the Stock Bloc Merch section on the home page", () => {
    render(<BrandLandingHub onSelectTab={vi.fn()} onOpenLinktree={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /Stock Bloc Merch/i })).toBeInTheDocument();
    expect(screen.getByText("Neon Logo Tee")).toBeInTheDocument();
    expect(screen.getByText("Philly Connect Sparkle Tee")).toBeInTheDocument();
  });

  it("renders The Stock Bloc Manifesto on the home page", () => {
    render(<BrandLandingHub onSelectTab={vi.fn()} onOpenLinktree={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /THE STOCK BLOC MANIFESTO/i })).toBeInTheDocument();
    expect(screen.getByText(/We were taught how to earn\. It’s time to understand how to own\./i)).toBeInTheDocument();
    expect(screen.getByText(/Understand before you invest\. Evidence before conviction\. Ownership over optics\./i)).toBeInTheDocument();
    expect(screen.getByText(/KNOW THE SYSTEM\. BUILD OWNERSHIP\. MOVE TOGETHER\./i)).toBeInTheDocument();
  });
});
