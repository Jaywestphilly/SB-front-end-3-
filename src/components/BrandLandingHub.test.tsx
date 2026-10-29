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
});
