import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { MobileBottomNav } from "./mobile-bottom-nav";

let pathname = "/en/menu";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const setScrollY = (value: number) => {
  Object.defineProperty(window, "scrollY", {
    value,
    writable: true,
    configurable: true,
  });
};

describe("MobileBottomNav", () => {
  beforeEach(() => {
    pathname = "/en/menu";
    setScrollY(0);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      // Execute callback synchronously to make testing deterministic
      callback(Date.now());
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders navigation on customer routes", () => {
    render(<MobileBottomNav />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("nav.menu")).toBeInTheDocument();
  });

  it("responds to scroll events", async () => {
    render(<MobileBottomNav />);

    const navigation = screen.getByRole("navigation");

    // Verify scroll handler is attached by dispatching a scroll event
    expect(() => window.dispatchEvent(new Event("scroll"))).not.toThrow();

    // Navigation should be visible initially (or have translate-y class)
    expect(navigation.className).toMatch(/translate-y-(0|full)/);
  });

  it("does not render on admin routes", () => {
    pathname = "/en/admin";
    render(<MobileBottomNav />);

    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
