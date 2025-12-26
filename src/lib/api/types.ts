import { z } from "zod";

export const onboardingInputSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(7, "Phone is required"),
});

export const addressInputSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional().nullable(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().default("US"),
  instructions: z.string().optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export const appointmentInputSchema = z.object({
  weekOf: z.string().min(1, "Week of is required"),
  deliveryWindowId: z.string().uuid(),
  addressId: z.string().uuid().optional(),
  notes: z.string().optional().nullable(),
});

export const billingInputSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;
export type AddressInput = z.infer<typeof addressInputSchema>;
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
export type BillingInput = z.infer<typeof billingInputSchema>;
