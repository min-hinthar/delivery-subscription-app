import { z } from "zod";

const PHONE_REGEX = /^(?:\+1\s*)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
const LICENSE_PLATE_REGEX = /^[a-zA-Z0-9-\s]+$/;

export function isValidPhone(phone: string) {
  return PHONE_REGEX.test(phone.trim());
}

export function isValidLicensePlate(plate: string) {
  return LICENSE_PLATE_REGEX.test(plate.trim());
}

export const driverProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required."),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((value) => isValidPhone(value), "Use a valid US phone number."),
  vehicle_make: z.string().trim().optional().or(z.literal("")),
  vehicle_model: z.string().trim().optional().or(z.literal("")),
  vehicle_color: z.string().trim().optional().or(z.literal("")),
  license_plate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || isValidLicensePlate(value), "License plates can only use letters, numbers, or dashes."),
});

export type DriverProfileInput = z.infer<typeof driverProfileSchema>;
