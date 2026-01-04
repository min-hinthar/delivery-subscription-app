import { cn } from "@/lib/utils";

type PreferencesStepProps = {
  householdSize: number | null;
  preferredDeliveryDay: string;
  preferredTimeWindow: string;
  dietaryRestrictions: string[];
  onHouseholdSizeChange: (value: number) => void;
  onPreferredDayChange: (value: string) => void;
  onPreferredTimeWindowChange: (value: string) => void;
  onDietaryRestrictionToggle: (value: string) => void;
  fieldErrors: Record<string, string>;
};

const HOUSEHOLD_OPTIONS = [1, 2, 3, 4, 5, 6];
const DAY_OPTIONS = ["Saturday", "Sunday", "Either"];
const TIME_OPTIONS = ["Morning", "Afternoon", "Evening"];
const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Gluten-free",
  "Dairy-free",
  "Nut-free",
  "Halal",
  "Low sodium",
];

export function PreferencesStep({
  householdSize,
  preferredDeliveryDay,
  preferredTimeWindow,
  dietaryRestrictions,
  onHouseholdSizeChange,
  onPreferredDayChange,
  onPreferredTimeWindowChange,
  onDietaryRestrictionToggle,
  fieldErrors,
}: PreferencesStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <span role="img" aria-label="Preferences">
            🧺
          </span>
          Household & delivery preferences
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Household size
          </p>
          <div className="flex flex-wrap gap-2">
            {HOUSEHOLD_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onHouseholdSizeChange(size)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  householdSize === size
                    ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                )}
              >
                {size}
                {size === 6 ? "+" : ""}
              </button>
            ))}
          </div>
          {fieldErrors.householdSize ? (
            <span className="text-xs text-rose-600">{fieldErrors.householdSize}</span>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Preferred delivery day
            </p>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => onPreferredDayChange(day)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    preferredDeliveryDay === day
                      ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
            {fieldErrors.preferredDeliveryDay ? (
              <span className="text-xs text-rose-600">
                {fieldErrors.preferredDeliveryDay}
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Preferred time window
            </p>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((window) => (
                <button
                  key={window}
                  type="button"
                  onClick={() => onPreferredTimeWindowChange(window)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    preferredTimeWindow === window
                      ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                  )}
                >
                  {window}
                </button>
              ))}
            </div>
            {fieldErrors.preferredTimeWindow ? (
              <span className="text-xs text-rose-600">
                {fieldErrors.preferredTimeWindow}
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Dietary preferences (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((option) => {
              const active = dietaryRestrictions.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onDietaryRestrictionToggle(option)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    active
                      ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We’ll highlight meals that match these preferences on your weekly menu.
          </p>
        </div>
      </div>
    </div>
  );
}
