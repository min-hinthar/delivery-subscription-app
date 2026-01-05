"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type Locale } from "@/i18n";
import { hapticMedium, hapticSelection } from "@/lib/haptics";
import { getLocalizedField } from "@/lib/i18n-helpers";
import { reportError } from "@/lib/monitoring/report-error";
import { cn } from "@/lib/utils";
import type { MealPackage } from "@/types";

type PackageSelectorProps = {
  weeklyMenuId: string;
};

export function PackageSelector({ weeklyMenuId }: PackageSelectorProps) {
  const t = useTranslations("packages");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [packages, setPackages] = useState<MealPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/menu/packages");
        const payload = await response.json();
        if (response.ok) {
          setPackages(payload.data?.packages ?? []);
        } else {
          setError(payload.error?.message ?? tCommon("error"));
        }
      } catch (error) {
        reportError(error, { scope: "package-selector" });
        setError(tCommon("error"));
      } finally {
        setLoading(false);
      }
    };

    void fetchPackages();
  }, [reloadToken, tCommon]);

  const handleSelectPackage = (packageId: string) => {
    hapticSelection();
    setSelectedPackageId(packageId);
  };

  const handleContinueToCheckout = () => {
    if (!selectedPackageId) return;

    hapticMedium();
    router.push(`/checkout/weekly?menu=${weeklyMenuId}&package=${selectedPackageId}`);
  };

  if (loading) return null;

  if (error) {
    return (
      <Card className="mt-12 border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => {
            setError(null);
            setLoading(true);
            setReloadToken((prev) => prev + 1);
          }}
        >
          {tCommon("retry")}
        </Button>
      </Card>
    );
  }

  return (
    <div className="mt-12 border-t border-slate-200 pt-12 dark:border-slate-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">{t("choosePackage")}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{t("chooseDescription")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          const badgeText = getLocalizedField(pkg, "badge_text", locale);
          const packageName = getLocalizedField(pkg, "name", locale);
          const packageDescription = getLocalizedField(pkg, "description", locale);
          const isMostPopular = badgeText === t("mostPopular") || badgeText === "Most Popular";

          return (
            <Card
              key={pkg.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg",
                isSelected && "border-2 border-[#D4A574] shadow-xl",
                isMostPopular && "scale-105 md:scale-110",
              )}
              onClick={() => handleSelectPackage(pkg.id)}
              role="button"
              tabIndex={0}
            >
              {badgeText ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#D4A574] text-white">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {badgeText}
                  </Badge>
                </div>
              ) : null}

              <div className="p-6">
                <h3 className="text-2xl font-bold text-center">{packageName}</h3>
                {locale === "en" && pkg.name_my ? (
                  <p className="text-center text-slate-500 mt-1">{pkg.name_my}</p>
                ) : null}

                <div className="my-6 text-center">
                  <span className="text-4xl font-bold text-[#D4A574]">
                    ${(pkg.price_cents / 100).toFixed(0)}
                  </span>
                  <span className="text-slate-600">{t("perWeek")}</span>
                </div>

                <p className="text-center text-sm text-slate-700 dark:text-slate-300">
                  {packageDescription}
                </p>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{t("dishesPerDay", { count: pkg.dishes_per_day })}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{t("totalDishes", { count: pkg.total_dishes })}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{t("saturdayDelivery")}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{t("freshAuthentic")}</span>
                  </li>
                </ul>

                <Button
                  className={cn(
                    "mt-6 w-full",
                    isSelected && "bg-[#D4A574] hover:bg-[#C4956B]",
                  )}
                  variant={isSelected ? "default" : "secondary"}
                >
                  {isSelected ? t("selected") : t("selectPackage")}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedPackageId && (
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            variant="burmese"
            onClick={handleContinueToCheckout}
            className="min-w-[280px]"
          >
            {t("continueToCheckout")}
          </Button>
        </div>
      )}
    </div>
  );
}
