import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommunityHub } from "./CommunityHub";
import { AuthProvider } from "../../contexts/AuthContext";
import { getUserDataLocally } from "../../lib/firebase";

// Mock Firebase
vi.mock("../../lib/firebase", () => ({
  auth: { currentUser: null },
  db: {},
  getUserDataLocally: vi.fn(),
  saveUserDataLocally: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn((q, cb) => {
    cb({ forEach: () => {} });
    return () => {};
  }),
  addDoc: vi.fn().mockResolvedValue({ id: "mock_post_1" }),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  increment: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null);
    return () => {};
  }),
}));

describe("CommunityHub Auth and Post Composer", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("opens the post composer directly for authenticated sessions without redirecting to account modal", () => {
    vi.mocked(getUserDataLocally).mockImplementation((key: string) => {
      if (key === "profile") {
        return { uid: "testagent01", displayName: "testagent01", email: "testagent01@stockbloc.test" };
      }
      return null;
    });

    const onOpenAuthMock = vi.fn();
    render(
      <AuthProvider>
        <CommunityHub onOpenAuth={onOpenAuthMock} />
      </AuthProvider>
    );

    // Banner should NOT be visible for authenticated user
    expect(screen.queryByText(/You must sign in to participate/i)).toBeNull();

    // Click + New Post button
    const newPostBtn = screen.getByRole("button", { name: /New Post/i });
    fireEvent.click(newPostBtn);

    // onOpenAuth must NOT be called
    expect(onOpenAuthMock).not.toHaveBeenCalled();

    // The Post Discussion composer should now be rendered
    expect(screen.getByPlaceholderText(/Post Title/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Post Discussion/i })).toBeDefined();
  });

  it("submits a discussion post cleanly when Post Discussion is clicked", async () => {
    vi.mocked(getUserDataLocally).mockImplementation((key: string) => {
      if (key === "profile") {
        return { uid: "agent_alpha", displayName: "AlphaTrader", email: "alpha@stockbloc.test" };
      }
      return null;
    });

    render(
      <AuthProvider>
        <CommunityHub />
      </AuthProvider>
    );

    // Open composer
    const newPostBtn = screen.getByRole("button", { name: /New Post/i });
    fireEvent.click(newPostBtn);

    // Fill title and content
    const titleInput = screen.getByPlaceholderText(/Post Title/i);
    const contentInput = screen.getByPlaceholderText(/quantitative rationale/i);

    fireEvent.change(titleInput, { target: { value: "NVDA Breakout Analysis" } });
    fireEvent.change(contentInput, { target: { value: "Checking the key levels around 140." } });

    // Submit post
    const postSubmitBtn = screen.getByRole("button", { name: /Post Discussion/i });
    fireEvent.click(postSubmitBtn);

    // Composer should close
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Post Title/i)).toBeNull();
    });
  });

  it("prompts login modal when clicking New Post as unauthenticated user", () => {
    vi.mocked(getUserDataLocally).mockReturnValue(null);

    const onOpenAuthMock = vi.fn();
    render(
      <AuthProvider>
        <CommunityHub onOpenAuth={onOpenAuthMock} />
      </AuthProvider>
    );

    // Banner should be visible for unauthenticated user
    expect(screen.getByText(/You must/i)).toBeDefined();

    // Click + New Post button
    const newPostBtn = screen.getByRole("button", { name: /New Post/i });
    fireEvent.click(newPostBtn);

    // onOpenAuth must be called to open sign-in modal
    expect(onOpenAuthMock).toHaveBeenCalledTimes(1);
  });
});
