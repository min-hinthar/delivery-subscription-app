import { describe, it, expect } from "vitest";

import { driverProfileSchema, isValidLicensePlate, isValidPhone } from "../driver";

describe("driver validation", () => {
  it("validates phone numbers", () => {
    expect(isValidPhone("555-123-4567")).toBe(true);
    expect(isValidPhone("(555) 123-4567")).toBe(true);
    expect(isValidPhone("5551234567")).toBe(true);
    expect(isValidPhone("invalid")).toBe(false);
  });

  it("validates license plates", () => {
    expect(isValidLicensePlate("ABC123")).toBe(true);
    expect(isValidLicensePlate("ABC-123")).toBe(true);
    expect(isValidLicensePlate("ABC 123")).toBe(true);
    expect(isValidLicensePlate("invalid!")).toBe(false);
  });

  it("requires name and phone for profile", () => {
    const result = driverProfileSchema.safeParse({
      full_name: "",
      phone: "555-123-4567",
    });

    expect(result.success).toBe(false);
  });

  it("accepts optional vehicle fields", () => {
    const result = driverProfileSchema.safeParse({
      full_name: "Jane Driver",
      phone: "555-123-4567",
      vehicle_make: "Honda",
      vehicle_model: "Civic",
      vehicle_color: "Blue",
      license_plate: "ABC-123",
    });

    expect(result.success).toBe(true);
  });
});
