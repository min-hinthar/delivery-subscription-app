"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hapticMedium, hapticSelection } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { MealPackage } from "@/types";

type PackageSelectorProps = {
  weeklyMenuId: string;
};

export function PackageSelector({ weeklyMenuId }: PackageSelectorProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<MealPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch("/api/menu/packages");
        const payload = await response.json();
        setPackages(payload.data?.packages ?? []);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchPackages();
  }, []);

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

  return (
    <div className="mt-12 border-t border-slate-200 pt-12 dark:border-slate-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">Choose Your Package</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Select how many dishes you&apos;d like each day
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          const isMostPopular = pkg.badge_text === "Most Popular";

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
              {pkg.badge_text && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#D4A574] text-white">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {pkg.badge_text}
                  </Badge>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-bold text-center">{pkg.name}</h3>
                {pkg.name_my && (
                  <p className="text-center text-slate-500 mt-1">{pkg.name_my}</p>
                )}

                <div className="my-6 text-center">
                  <span className="text-4xl font-bold text-[#D4A574]">
                    ${(pkg.price_cents / 100).toFixed(0)}
                  </span>
                  <span className="text-slate-600">/week</span>
                </div>

                <p className="text-center text-sm text-slate-700 dark:text-slate-300">
                  {pkg.description}
                </p>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {pkg.dishes_per_day} dish
                      {pkg.dishes_per_day > 1 ? "es" : ""} per day
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{pkg.total_dishes} total dishes</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Saturday delivery</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Fresh &amp; authentic</span>
                  </li>
                </ul>

                <Button
                  className={cn(
                    "mt-6 w-full",
                    isSelected && "bg-[#D4A574] hover:bg-[#C4956B]",
                  )}
                  variant={isSelected ? "default" : "secondary"}
                >
                  {isSelected ? "Selected" : "Select Package"}
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
            Continue to Checkout
          </Button>
        </div>
      )}
    </div>
  );
}
