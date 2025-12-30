"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFadeMotion, getMotionTransition } from "@/lib/motion";

const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

type CoverageResult = {
  eligible: boolean;
  reason: string;
  county?: string;
  formatted_address?: string;
  distance_miles?: number;
  duration_minutes?: number;
};

type CoverageState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: CoverageResult };

export function CoverageChecker() {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = prefersReducedMotion ?? false;
  const [zip, setZip] = useState("");
  const [state, setState] = useState<CoverageState>({ status: "idle" });

  const helperText = useMemo(() => {
    if (!zip) {
      return "Enter your ZIP code to confirm weekly delivery coverage.";
    }

    if (!ZIP_REGEX.test(zip)) {
      return "ZIP code should be 5 digits (optionally +4).";
    }

    return "We’ll check your delivery county and estimated drive time.";
  }, [zip]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!ZIP_REGEX.test(zip)) {
      setState({ status: "error", message: "Please enter a valid ZIP code." });
      return;
    }

    setState({ status: "loading" });

    try {
      const response = await fetch("/api/maps/coverage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zip }),
      });
      const payload = (await response.json()) as
        | { ok: true; data: CoverageResult }
        | { ok: false; error: { message: string } };

      if (!response.ok || !payload.ok) {
        const message = !payload.ok
          ? payload.error.message
          : "Unable to check coverage right now.";
        throw new Error(message);
      }

      setState({ status: "success", result: payload.data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to check coverage.";
      setState({ status: "error", message });
    }
  };

  const metrics =
    state.status === "success" && state.result.eligible
      ? {
          distance: state.result.distance_miles,
          duration: state.result.duration_minutes,
        }
      : null;

  return (
    <Card className="space-y-6 rounded-2xl border border-border bg-background p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Coverage Checker
        </p>
        <h2 className="text-2xl font-semibold text-foreground">See if we deliver to your ZIP</h2>
        <p className="text-sm text-muted-foreground">
          Confirm eligibility plus ETA and distance from our Covina kitchen.
        </p>
      </div>
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit}>
        <div className="flex-1 space-y-2">
          <label htmlFor="coverage-zip" className="text-sm font-medium text-foreground">
            ZIP code
          </label>
          <input
            id="coverage-zip"
            name="zip"
            inputMode="numeric"
            autoComplete="postal-code"
            value={zip}
            onChange={(event) => {
              setZip(event.target.value.trim());
              if (state.status === "error") {
                setState({ status: "idle" });
              }
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="91723"
            aria-invalid={state.status === "error"}
            aria-describedby="coverage-helper"
          />
        </div>
        <Button
          type="submit"
          disabled={state.status === "loading"}
          className="h-11 gap-2 self-start sm:self-end"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {state.status === "loading" ? "Checking…" : "Check coverage"}
        </Button>
      </form>
      <p id="coverage-helper" className="text-xs text-muted-foreground">
        {helperText}
      </p>
      {state.status === "error" ? (
        <Alert className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          {state.message}
        </Alert>
      ) : null}
      {state.status === "success" ? (
        <motion.div
          {...getFadeMotion(shouldReduceMotion, { enterY: 8, exitY: -8 })}
          transition={getMotionTransition(shouldReduceMotion)}
        >
          <Alert
            className={
              state.result.eligible
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200"
            }
          >
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                {state.result.eligible ? "You’re in range!" : "Not in range yet."}
              </p>
              <p className="text-sm">{state.result.reason}</p>
              {metrics ? (
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="rounded-full border border-current/20 px-3 py-1">
                    {metrics.distance} miles from the kitchen
                  </span>
                  <span className="rounded-full border border-current/20 px-3 py-1">
                    ~{metrics.duration} min drive time
                  </span>
                </div>
              ) : null}
            </div>
          </Alert>
        </motion.div>
      ) : null}
    </Card>
  );
}
