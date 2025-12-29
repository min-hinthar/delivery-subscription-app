"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { addressInputSchema, onboardingInputSchema } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const DELIVERY_DAYS = ["Saturday", "Sunday"];

const STEPS = [
  { id: "profile", label: "Profile" },
  { id: "address", label: "Address" },
  { id: "done", label: "Done" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

type OnboardingFormProps = {
  initialProfile?: {
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
    is_primary: boolean;
  } | null;
};

export function OnboardingForm({ initialProfile, primaryAddress }: OnboardingFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "");
  const [phone, setPhone] = useState(initialProfile?.phone ?? "");
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
  const [step, setStep] = useState<StepId>("profile");

  const email = useMemo(() => initialProfile?.email ?? "", [initialProfile?.email]);
  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const handleNextFromProfile = () => {
    setError(null);
    setMessage(null);

    const profileParsed = onboardingInputSchema.safeParse({
      fullName,
      phone,
    });

    if (!profileParsed.success) {
      setError(profileParsed.error.errors[0]?.message ?? "Check your profile details.");
      return;
    }

    setStep("address");
  };

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
          onboarding_completed: true,
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

      setMessage("Profile saved! You're ready to schedule your first delivery.");
      setStep("done");
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
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <span>{STEPS[stepIndex]?.label}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-slate-900 transition-all dark:bg-slate-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
          {STEPS.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "rounded-full border px-2 py-1 text-center",
                index <= stepIndex
                  ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
                  : "border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500",
              )}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {step === "profile" ? (
        <div className="space-y-6">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <span role="img" aria-label="Profile">
                🧑‍🍳
              </span>
              Your profile
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
                  value={email}
                  readOnly
                  className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </label>
              <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <p className="font-medium text-slate-600 dark:text-slate-300">
                  Preferred delivery days
                </p>
                <div className="flex flex-wrap gap-2">
                  {DELIVERY_DAYS.map((day) => (
                    <span
                      key={day}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {day}
                    </span>
                  ))}
                </div>
                <p className="text-xs">We’ll let you pick a specific window on the schedule page.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleNextFromProfile}>Next: Address</Button>
          </div>
        </div>
      ) : null}

      {step === "address" ? (
        <div className="space-y-6">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
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
              {isSaving ? "Saving…" : "Save profile"}
            </Button>
            <Button
              onClick={handleVerifyAddress}
              disabled={isVerifying || isSaving}
              className="bg-slate-200 text-slate-900 hover:shadow-md dark:bg-slate-800 dark:text-slate-100"
            >
              {isVerifying ? "Verifying…" : "Verify address"}
            </Button>
            <Button
              onClick={() => setStep("profile")}
              disabled={isSaving}
              className="bg-slate-200 text-slate-900 hover:shadow-md dark:bg-slate-800 dark:text-slate-100"
            >
              Back to profile
            </Button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          <p className="text-base font-semibold">You’re all set!</p>
          <p>Next, choose a delivery window for your first weekend order.</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push("/schedule")}>Schedule delivery</Button>
            <Button
              onClick={() => router.push("/account")}
              className="bg-slate-200 text-slate-900 hover:shadow-md dark:bg-slate-800 dark:text-slate-100"
            >
              Go to account
            </Button>
          </div>
        </div>
      ) : null}

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
