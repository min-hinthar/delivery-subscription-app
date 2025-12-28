"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { addressInputSchema, onboardingInputSchema } from "@/lib/api/types";

type ProfileFormProps = {
  profile?: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  primaryAddress?: {
    id: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    instructions: string | null;
  } | null;
};

export function ProfileForm({ profile, primaryAddress }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [line1, setLine1] = useState(primaryAddress?.line1 ?? "");
  const [line2, setLine2] = useState(primaryAddress?.line2 ?? "");
  const [city, setCity] = useState(primaryAddress?.city ?? "");
  const [state, setState] = useState(primaryAddress?.state ?? "");
  const [postalCode, setPostalCode] = useState(primaryAddress?.postal_code ?? "");
  const [country, setCountry] = useState(primaryAddress?.country ?? "US");
  const [instructions, setInstructions] = useState(primaryAddress?.instructions ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [verifiedAddress, setVerifiedAddress] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);

    if (!verifiedAddress) {
      setError("Verify your address before saving.");
      return;
    }

    const profileParsed = onboardingInputSchema.safeParse({
      fullName,
      phone,
    });

    if (!profileParsed.success) {
      setError(profileParsed.error.errors[0]?.message ?? "Check your profile details.");
      return;
    }

    const addressParsed = addressInputSchema.safeParse({
      line1,
      line2: line2 || null,
      city,
      state,
      postalCode,
      country,
      instructions: instructions || null,
      isPrimary: true,
    });

    if (!addressParsed.success) {
      setError(addressParsed.error.errors[0]?.message ?? "Check your address details.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          address: {
            id: primaryAddress?.id ?? null,
            line1: addressParsed.data.line1,
            line2: addressParsed.data.line2,
            city: addressParsed.data.city,
            state: addressParsed.data.state,
            postal_code: addressParsed.data.postalCode,
            country: addressParsed.data.country,
            instructions: addressParsed.data.instructions,
          },
        }),
      });

      const payload = await response.json();

      if (!payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to save your details.");
      }

      setMessage("Profile updated!");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save your details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyAddress = async () => {
    setError(null);
    setMessage(null);
    setIsVerifying(true);

    try {
      const response = await fetch("/api/maps/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line1,
          line2: line2 || null,
          city,
          state,
          postal_code: postalCode,
          country,
        }),
      });

      const payload = await response.json();

      if (!payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to verify address.");
      }

      setVerifiedAddress(payload.data.formatted_address);
      setMessage("Address verified. You can save your profile.");
    } catch (caught) {
      setVerifiedAddress(null);
      setError(caught instanceof Error ? caught.message : "Unable to verify address.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <span role="img" aria-label="Profile">
            🧑‍🍳
          </span>
          Profile details
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
              placeholder="Aung Lin"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
              placeholder="(555) 123-4567"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
            <input
              value={profile?.email ?? ""}
              readOnly
              className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </label>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <span role="img" aria-label="Home">
            🏡
          </span>
          Primary delivery address
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
            Address line 1
            <input
              value={line1}
              onChange={(event) => {
                setLine1(event.target.value);
                setVerifiedAddress(null);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
              placeholder="123 Golden Lantern Ave"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
            Address line 2
            <input
              value={line2}
              onChange={(event) => {
                setLine2(event.target.value);
                setVerifiedAddress(null);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
              placeholder="Apartment, suite, unit"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            City
            <input
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setVerifiedAddress(null);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
              placeholder="Covina"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            State
            <input
              value={state}
              onChange={(event) => {
                setState(event.target.value);
                setVerifiedAddress(null);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
              placeholder="CA"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Postal code
            <input
              value={postalCode}
              onChange={(event) => {
                setPostalCode(event.target.value);
                setVerifiedAddress(null);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
              placeholder="91723"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Country
            <input
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                setVerifiedAddress(null);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
              placeholder="US"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
            Delivery instructions
            <input
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
              placeholder="Gate code, drop-off notes, or parking tips"
            />
          </label>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
        <Button
          onClick={handleVerifyAddress}
          disabled={isVerifying || isSaving}
          className="bg-slate-200 text-slate-900 hover:shadow-md dark:bg-slate-800 dark:text-slate-100"
        >
          {isVerifying ? "Verifying…" : "Verify address"}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
      {verifiedAddress ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Verified address: {verifiedAddress}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
