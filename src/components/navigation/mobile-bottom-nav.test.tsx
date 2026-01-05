import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

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
      callback(0);
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

  it("hides on scroll down and shows on scroll up", async () => {
    render(<MobileBottomNav />);

    const navigation = screen.getByRole("navigation");
    expect(navigation).toHaveClass("translate-y-0");

    setScrollY(150);
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(navigation).toHaveClass("translate-y-full");
    });

    setScrollY(20);
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(navigation).toHaveClass("translate-y-0");
    });
  });

  it("does not render on admin routes", () => {
    pathname = "/en/admin";
    render(<MobileBottomNav />);

    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
