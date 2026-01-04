import { Button } from "@/components/ui/button";

const highlights = [
  "Answer a few quick questions",
  "Verify your delivery address",
  "Set your preferred delivery window",
];

type WelcomeStepProps = {
  onContinue: () => void;
};

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          Welcome to Morning Star
        </p>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Let’s personalize your weekly delivery
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          We’ll capture your delivery preferences so each weekend order arrives exactly
          when you want it.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4 text-sm text-slate-700 shadow-sm dark:border-amber-500/30 dark:from-amber-950/30 dark:via-slate-950 dark:to-rose-950/20 dark:text-slate-200">
        <p className="font-semibold text-amber-800 dark:text-amber-200">
          What to expect
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {highlights.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button onClick={onContinue}>Let’s get started</Button>
    </div>
  );
}
