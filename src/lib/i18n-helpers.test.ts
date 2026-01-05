import { describe, expect, it } from "vitest";

import { getLocalizedField, stripLocaleFromPathname } from "./i18n-helpers";

describe("getLocalizedField", () => {
  it("returns Burmese field when locale is my", () => {
    const dish = { name: "Chicken Curry", name_my: "ကြက်သားဟင်း" };

    expect(getLocalizedField(dish, "name", "my")).toBe("ကြက်သားဟင်း");
  });

  it("falls back to English field when Burmese is missing", () => {
    const dish = { name: "Chicken Curry", name_my: "" };

    expect(getLocalizedField(dish, "name", "my")).toBe("Chicken Curry");
  });

  it("returns English field when locale is en", () => {
    const dish = { name: "Chicken Curry", name_my: "ကြက်သားဟင်း" };

    expect(getLocalizedField(dish, "name", "en")).toBe("Chicken Curry");
  });
});

describe("stripLocaleFromPathname", () => {
  it("strips the locale prefix when present", () => {
    expect(stripLocaleFromPathname("/my/menu", "my")).toBe("/menu");
    expect(stripLocaleFromPathname("/en", "en")).toBe("/");
  });

  it("keeps pathname when locale prefix is absent", () => {
    expect(stripLocaleFromPathname("/menu", "en")).toBe("/menu");
  });

  it("detects locale prefix when none is provided", () => {
    expect(stripLocaleFromPathname("/my/account")).toBe("/account");
  });
});
