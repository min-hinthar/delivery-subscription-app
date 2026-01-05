"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChefHat, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WeeklyMenuSkeleton } from "@/components/menu/weekly-menu-skeleton";
import { type Locale } from "@/i18n";
import { getLocalizedField } from "@/lib/i18n-helpers";
import { reportError } from "@/lib/monitoring/report-error";
import type { DayMenu, WeeklyMenu } from "@/types";
import { PackageSelector } from "./package-selector";

export function WeeklyMenuView() {
  const t = useTranslations("weeklyMenu");
  const tCommon = useTranslations("common");
  const tDays = useTranslations("days");
  const locale = useLocale() as Locale;
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [dayMenus, setDayMenus] = useState<DayMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const cacheKey = "weekly-menu-cache-v1";
  const cacheTtlMs = 5 * 60 * 1000;

  useEffect(() => {
    const fetchWeeklyMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as {
            data: (WeeklyMenu & { day_menus?: DayMenu[] }) | null;
            timestamp: number;
          };
          if (Date.now() - parsed.timestamp < cacheTtlMs) {
            setMenu(parsed.data);
            const menuDays = parsed.data?.day_menus ?? [];
            setDayMenus(menuDays as DayMenu[]);
            setSelectedDay(menuDays[0]?.dayOfWeek ?? null);
            setLoading(false);
            return;
          }
        }

        const response = await fetch("/api/menu/weekly/current");
        const payload = await response.json();

        if (response.ok) {
          const menuPayload = payload.data.menu as WeeklyMenu & { day_menus?: DayMenu[] };
          setMenu(menuPayload);
          const menuDays = (menuPayload.day_menus ?? []) as DayMenu[];
          setDayMenus(menuDays);
          setSelectedDay(menuDays[0]?.dayOfWeek ?? null);
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ data: menuPayload, timestamp: Date.now() }),
          );
        } else {
          setError(payload.error?.message ?? t("errorMessage"));
        }
      } catch (error) {
        reportError(error, { scope: "weekly-menu-view" });
        setError(t("errorMessage"));
      } finally {
        setLoading(false);
      }
    };

    void fetchWeeklyMenu();
  }, [t, cacheKey, cacheTtlMs, reloadToken]);

  const activeDay = useMemo(
    () => dayMenus.find((day) => day.dayOfWeek === selectedDay),
    [dayMenus, selectedDay],
  );

  if (loading) {
    return <WeeklyMenuSkeleton />;
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-lg font-semibold">{t("errorTitle")}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error}</p>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => {
            setError(null);
            setLoading(true);
            sessionStorage.removeItem(cacheKey);
            setReloadToken((prev) => prev + 1);
          }}
        >
          {tCommon("retry")}
        </Button>
      </Card>
    );
  }

  if (!menu) {
    return (
      <div className="text-center py-12">
        <ChefHat className="mx-auto h-12 w-12 text-slate-400" />
        <h2 className="mt-4 text-xl font-semibold">{t("noMenuAvailable")}</h2>
        <p className="mt-2 text-slate-600">{t("noMenuDescription")}</p>
      </div>
    );
  }

  const deadline = menu.order_deadline ? new Date(menu.order_deadline) : null;
  const hoursRemaining = deadline
    ? Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60))
    : null;
  const deliveryDate = menu.delivery_date
    ? new Date(menu.delivery_date).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      })
    : null;
  const templateName = menu.template ? getLocalizedField(menu.template, "name", locale) : "";
  const templateDescription = menu.template
    ? getLocalizedField(menu.template, "description", locale)
    : "";

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          {t("title")}
        </h1>
        {templateName ? <p className="mt-2 text-xl text-[#D4A574]">{templateName}</p> : null}
        {templateDescription ? (
          <p className="mt-2 text-slate-600 dark:text-slate-400">{templateDescription}</p>
        ) : null}
      </div>

      <Card className="border-l-4 border-l-orange-500 bg-orange-50 p-4 dark:bg-orange-950/20">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-orange-600" />
          <div className="flex-1">
            <p className="font-semibold text-orange-900 dark:text-orange-200">
              {t("orderBy")}
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {hoursRemaining !== null && hoursRemaining > 0
                ? t("hoursRemaining", { hours: hoursRemaining })
                : t("ordersClosed")}
            </p>
          </div>
          {deliveryDate ? (
            <Badge variant="secondary">{t("deliveryDate", { date: deliveryDate })}</Badge>
          ) : null}
        </div>
      </Card>

      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max md:justify-center">
          {dayMenus.map((day) => (
            <button
              key={day.dayOfWeek}
              onClick={() => setSelectedDay(day.dayOfWeek)}
              className={`px-4 py-3 rounded-lg transition-colors ${
                selectedDay === day.dayOfWeek
                  ? "bg-[#D4A574] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <div className="text-sm font-medium">
                {tDays(dayKeys[day.dayOfWeek] ?? "monday")}
              </div>
              <div className="text-xs opacity-80">
                {new Date(day.date).toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {activeDay?.dishes.map((item, index) => {
          const dishName = getLocalizedField(item.dish, "name", locale);
          const dishDescription = getLocalizedField(item.dish, "description", locale);
          return (
            <Card key={item.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {item.dish.image_url && (
                <div className="relative h-48 w-full md:h-auto md:w-64">
                  <Image
                    src={item.dish.image_url}
                    alt={dishName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex-1 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-2">{t("dishNumber", { number: index + 1 })}</Badge>
                    <h3 className="text-xl font-semibold">{dishName}</h3>
                    {locale === "en" && item.dish.name_my ? (
                      <p className="text-slate-500">{item.dish.name_my}</p>
                    ) : null}
                  </div>
                  {!item.is_available && (
                    <Badge variant="destructive">{t("soldOut")}</Badge>
                  )}
                </div>

                {dishDescription ? (
                  <p className="mt-3 text-slate-700 dark:text-slate-300">{dishDescription}</p>
                ) : null}

                {item.dish.tags && item.dish.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.dish.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {item.max_portions !== null && item.max_portions !== undefined && (
                  <p className="mt-4 text-sm text-slate-600">
                    {t("portionsRemaining", {
                      count: item.max_portions - item.current_orders,
                    })}
                  </p>
                )}
              </div>
            </div>
          </Card>
          );
        })}
      </div>

      <PackageSelector weeklyMenuId={menu.id} />
    </div>
  );
}
