"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { parseApiResponse } from "@/lib/api/client";
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
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [verifiedAddress, setVerifiedAddress] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<StepId>("profile");
  const fullNameRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const line1Ref = useRef<HTMLInputElement | null>(null);
  const line2Ref = useRef<HTMLInputElement | null>(null);
  const cityRef = useRef<HTMLInputElement | null>(null);
  const stateRef = useRef<HTMLInputElement | null>(null);
  const postalCodeRef = useRef<HTMLInputElement | null>(null);
  const countryRef = useRef<HTMLInputElement | null>(null);
  const instructionsRef = useRef<HTMLInputElement | null>(null);

  const email = useMemo(() => initialProfile?.email ?? "", [initialProfile?.email]);
  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const clearFieldError = (key: string) =>
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));

  const handleNextFromProfile = () => {
    setFormError(null);
    setMessage(null);
    setFieldErrors({});

    const profileParsed = onboardingInputSchema.safeParse({
      fullName,
      phone,
    });

    if (!profileParsed.success) {
      const flattened = profileParsed.error.flatten().fieldErrors;
      const nextErrors = {
        fullName: flattened.fullName?.[0] ?? "",
        phone: flattened.phone?.[0] ?? "",
      };
      setFieldErrors(nextErrors);
      setFormError("Please fix the highlighted fields and try again.");
      if (nextErrors.fullName) {
        fullNameRef.current?.focus();
      } else if (nextErrors.phone) {
        phoneRef.current?.focus();
      }
      return;
    }

    setStep("address");
  };

  const handleSubmit = async () => {
    if (isSaving) {
      return;
    }

    setFormError(null);
    setMessage(null);
    setFieldErrors({});

    if (!verifiedAddress) {
      setFormError("Verify your address before saving.");
      return;
    }

    const profileParsed = onboardingInputSchema.safeParse({
      fullName,
      phone,
    });

    if (!profileParsed.success) {
      const flattened = profileParsed.error.flatten().fieldErrors;
      const nextErrors = {
        fullName: flattened.fullName?.[0] ?? "",
        phone: flattened.phone?.[0] ?? "",
      };
      setFieldErrors(nextErrors);
      setFormError("Please fix the highlighted fields and try again.");
      setStep("profile");
      if (nextErrors.fullName) {
        fullNameRef.current?.focus();
      } else if (nextErrors.phone) {
        phoneRef.current?.focus();
      }
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
      const flattened = addressParsed.error.flatten().fieldErrors;
      const nextErrors = {
        line1: flattened.line1?.[0] ?? "",
        line2: flattened.line2?.[0] ?? "",
        city: flattened.city?.[0] ?? "",
        state: flattened.state?.[0] ?? "",
        postalCode: flattened.postalCode?.[0] ?? "",
        country: flattened.country?.[0] ?? "",
        instructions: flattened.instructions?.[0] ?? "",
      };
      setFieldErrors(nextErrors);
      setFormError("Please fix the highlighted fields and try again.");
      if (nextErrors.line1) {
        line1Ref.current?.focus();
      } else if (nextErrors.line2) {
        line2Ref.current?.focus();
      } else if (nextErrors.city) {
        cityRef.current?.focus();
      } else if (nextErrors.state) {
        stateRef.current?.focus();
      } else if (nextErrors.postalCode) {
        postalCodeRef.current?.focus();
      } else if (nextErrors.country) {
        countryRef.current?.focus();
      } else if (nextErrors.instructions) {
        instructionsRef.current?.focus();
      }
      return;
    }

    setIsSaving(true);

    const saveController = new AbortController();
    const saveTimeout = setTimeout(() => saveController.abort(), 15000);

    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: saveController.signal,
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

      const result = await parseApiResponse<{ updated: boolean }>(response);

      if (!result.ok) {
        throw new Error(result.message);
      }

      setMessage("Profile saved! You're ready to schedule your first delivery.");
      toast({
        title: "Profile saved",
        description: "Your delivery details are ready for scheduling.",
      });
      setStep("done");
      router.refresh();
    } catch (caught) {
      let message = "Unable to save your details.";
      if (caught instanceof Error) {
        message =
          caught.name === "AbortError"
            ? "Saving your profile timed out. Please try again."
            : caught.message;
      }
      setFormError(message);
      toast({
        title: "Unable to save profile",
        description: message,
        variant: "destructive",
      });
    } finally {
      clearTimeout(saveTimeout);
      setIsSaving(false);
    }
  };

  const handleVerifyAddress = async () => {
    if (isVerifying) {
      return;
    }

    setFormError(null);
    setMessage(null);
    setFieldErrors({});

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
      const flattened = addressParsed.error.flatten().fieldErrors;
      const nextErrors = {
        line1: flattened.line1?.[0] ?? "",
        line2: flattened.line2?.[0] ?? "",
        city: flattened.city?.[0] ?? "",
        state: flattened.state?.[0] ?? "",
        postalCode: flattened.postalCode?.[0] ?? "",
        country: flattened.country?.[0] ?? "",
        instructions: flattened.instructions?.[0] ?? "",
      };
      setFieldErrors(nextErrors);
      setFormError("Fix the highlighted address fields before verifying.");
      if (nextErrors.line1) {
        line1Ref.current?.focus();
      } else if (nextErrors.line2) {
        line2Ref.current?.focus();
      } else if (nextErrors.city) {
        cityRef.current?.focus();
      } else if (nextErrors.state) {
        stateRef.current?.focus();
      } else if (nextErrors.postalCode) {
        postalCodeRef.current?.focus();
      } else if (nextErrors.country) {
        countryRef.current?.focus();
      } else if (nextErrors.instructions) {
        instructionsRef.current?.focus();
      }
      return;
    }

    setIsVerifying(true);

    const verifyController = new AbortController();
    const verifyTimeout = setTimeout(() => verifyController.abort(), 15000);

    try {
      const response = await fetch("/api/maps/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: verifyController.signal,
        body: JSON.stringify({
          line1,
          line2: line2 || null,
          city,
          state,
          postal_code: postalCode,
          country,
        }),
      });

      const result = await parseApiResponse<{ formatted_address: string }>(response);

      if (!result.ok) {
        throw new Error(result.message);
      }

      setVerifiedAddress(result.data.formatted_address);
      setMessage("Address verified. You can save your profile.");
      toast({
        title: "Address verified",
        description: "You can continue to save your profile.",
      });
    } catch (caught) {
      setVerifiedAddress(null);
      let message = "Unable to verify address.";
      if (caught instanceof Error) {
        message =
          caught.name === "AbortError"
            ? "Address verification timed out. Please try again."
            : caught.message;
      }
      setFormError(message);
      toast({
        title: "Address verification failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      clearTimeout(verifyTimeout);
      setIsVerifying(false);
    }
  };

  const visibleErrors = Object.values(fieldErrors).filter(Boolean);
  const showSummary = visibleErrors.length > 1;

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
          {showSummary ? (
            <div
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
              role="alert"
            >
              <p className="font-semibold">Please fix the highlighted fields:</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                {visibleErrors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
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
                  onChange={(event) => {
                    setFullName(event.target.value);
                    clearFieldError("fullName");
                  }}
                  ref={fullNameRef}
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? "onboarding-full-name-error" : undefined}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
                  placeholder="Aung Lin"
                />
                {fieldErrors.fullName ? (
                  <span id="onboarding-full-name-error" className="text-xs text-rose-600">
                    {fieldErrors.fullName}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Phone
                <input
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    clearFieldError("phone");
                  }}
                  ref={phoneRef}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? "onboarding-phone-error" : undefined}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
                  placeholder="(555) 123-4567"
                />
                {fieldErrors.phone ? (
                  <span id="onboarding-phone-error" className="text-xs text-rose-600">
                    {fieldErrors.phone}
                  </span>
                ) : null}
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
          {showSummary ? (
            <div
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
              role="alert"
            >
              <p className="font-semibold">Please fix the highlighted fields:</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                {visibleErrors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
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
                    clearFieldError("line1");
                  }}
                  ref={line1Ref}
                  aria-invalid={Boolean(fieldErrors.line1)}
                  aria-describedby={fieldErrors.line1 ? "onboarding-line1-error" : undefined}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
                  placeholder="123 Golden Lantern Ave"
                />
                {fieldErrors.line1 ? (
                  <span id="onboarding-line1-error" className="text-xs text-rose-600">
                    {fieldErrors.line1}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
                Address line 2
                <input
                  value={line2}
                  onChange={(event) => {
                    setLine2(event.target.value);
                    setVerifiedAddress(null);
                    clearFieldError("line2");
                  }}
                  ref={line2Ref}
                  aria-invalid={Boolean(fieldErrors.line2)}
                  aria-describedby={fieldErrors.line2 ? "onboarding-line2-error" : undefined}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
                  placeholder="Apartment, suite, unit"
                />
                {fieldErrors.line2 ? (
                  <span id="onboarding-line2-error" className="text-xs text-rose-600">
                    {fieldErrors.line2}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                City
                <input
                  value={city}
                  onChange={(event) => {
                    setCity(event.target.value);
                    setVerifiedAddress(null);
                    clearFieldError("city");
                  }}
                  ref={cityRef}
                  aria-invalid={Boolean(fieldErrors.city)}
                  aria-describedby={fieldErrors.city ? "onboarding-city-error" : undefined}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
                  placeholder="Covina"
                />
                {fieldErrors.city ? (
                  <span id="onboarding-city-error" className="text-xs text-rose-600">
                    {fieldErrors.city}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                State
                <input
                  value={state}
                  onChange={(event) => {
                    setState(event.target.value);
                    setVerifiedAddress(null);
                    clearFieldError("state");
                  }}
                  ref={stateRef}
                  aria-invalid={Boolean(fieldErrors.state)}
                  aria-describedby={fieldErrors.state ? "onboarding-state-error" : undefined}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
                  placeholder="CA"
                />
                {fieldErrors.state ? (
                  <span id="onboarding-state-error" className="text-xs text-rose-600">
                    {fieldErrors.state}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Postal code
                <input
                  value={postalCode}
                  onChange={(event) => {
                    setPostalCode(event.target.value);
                    setVerifiedAddress(null);
                    clearFieldError("postalCode");
                  }}
                  ref={postalCodeRef}
                  aria-invalid={Boolean(fieldErrors.postalCode)}
                  aria-describedby={
                    fieldErrors.postalCode ? "onboarding-postal-error" : undefined
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
                  placeholder="91723"
                />
                {fieldErrors.postalCode ? (
                  <span id="onboarding-postal-error" className="text-xs text-rose-600">
                    {fieldErrors.postalCode}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Country
                <input
                  value={country}
                  onChange={(event) => {
                    setCountry(event.target.value);
                    setVerifiedAddress(null);
                    clearFieldError("country");
                  }}
                  ref={countryRef}
                  aria-invalid={Boolean(fieldErrors.country)}
                  aria-describedby={fieldErrors.country ? "onboarding-country-error" : undefined}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
                  placeholder="US"
                />
                {fieldErrors.country ? (
                  <span id="onboarding-country-error" className="text-xs text-rose-600">
                    {fieldErrors.country}
                  </span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
                Delivery instructions
                <input
                  value={instructions}
                  onChange={(event) => {
                    setInstructions(event.target.value);
                    clearFieldError("instructions");
                  }}
                  ref={instructionsRef}
                  aria-invalid={Boolean(fieldErrors.instructions)}
                  aria-describedby={
                    fieldErrors.instructions ? "onboarding-instructions-error" : undefined
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
                  placeholder="Gate code, drop-off notes, or parking tips"
                />
                {fieldErrors.instructions ? (
                  <span id="onboarding-instructions-error" className="text-xs text-rose-600">
                    {fieldErrors.instructions}
                  </span>
                ) : null}
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
              onClick={() => {
                setStep("profile");
                setFieldErrors({});
                setFormError(null);
              }}
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

      {formError ? (
        <p className="text-sm text-red-500" role="alert">
          {formError}
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
