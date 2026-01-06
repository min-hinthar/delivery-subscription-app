"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import { DishSelector } from "@/components/admin/dish-selector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input-field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { type Locale } from "@/i18n";
import { getLocalizedPathname } from "@/lib/i18n-helpers";
import type { MenuTheme } from "@/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const THEME_OPTIONS = [
  { value: "traditional", label: "Traditional" },
  { value: "street_food", label: "Street Food" },
  { value: "regional", label: "Regional" },
  { value: "fusion", label: "Fusion" },
  { value: "vegetarian", label: "Vegetarian" },
];

export default function NewMenuTemplatePage() {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [nameMy, setNameMy] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<MenuTheme>("traditional");
  const [selectedDishes, setSelectedDishes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const draftKey = "weekly-menu-template-draft-v1";

  const missingSlots = useMemo(() => {
    const totalSlots = DAYS.length * 3;
    return totalSlots - Object.keys(selectedDishes).length;
  }, [selectedDishes]);

  useEffect(() => {
    const draft = localStorage.getItem(draftKey);
    if (!draft) return;

    try {
      const parsed = JSON.parse(draft) as {
        name: string;
        nameMy: string;
        description: string;
        theme: MenuTheme;
        selectedDishes: Record<string, string>;
      };
      setName(parsed.name ?? "");
      setNameMy(parsed.nameMy ?? "");
      setDescription(parsed.description ?? "");
      setTheme(parsed.theme ?? "traditional");
      setSelectedDishes(parsed.selectedDishes ?? {});
      toast({
        title: "Draft restored",
        description: "We restored your last template draft.",
      });
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, toast]);

  useEffect(() => {
    const hasContent =
      Boolean(name.trim()) ||
      Boolean(nameMy.trim()) ||
      Boolean(description.trim()) ||
      Object.keys(selectedDishes).length > 0;

    const saveDraft = () => {
      if (!hasContent) {
        localStorage.removeItem(draftKey);
        return;
      }

      localStorage.setItem(
        draftKey,
        JSON.stringify({
          name,
          nameMy,
          description,
          theme,
          selectedDishes,
        }),
      );
    };

    const handle = window.setTimeout(saveDraft, 400);
    return () => window.clearTimeout(handle);
  }, [name, nameMy, description, theme, selectedDishes, draftKey]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Template name required",
        description: "Add a name before saving.",
        variant: "destructive",
      });
      return;
    }

    if (missingSlots > 0) {
      toast({
        title: "Select all dishes",
        description: `Please select ${missingSlots} more dish${missingSlots > 1 ? "es" : ""}.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const templateResponse = await fetch("/api/admin/menu-templates/with-dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          name_my: nameMy || null,
          description: description || null,
          theme,
          dishes: Object.entries(selectedDishes).map(([key, dishId]) => {
            const [dayOfWeek, mealPosition] = key.split("-").map(Number);
            return {
              dish_id: dishId,
              day_of_week: dayOfWeek,
              meal_position: mealPosition,
            };
          }),
        }),
      });

      const templatePayload = await templateResponse.json();

      if (!templateResponse.ok) {
        throw new Error(templatePayload.error?.message ?? "Failed to create template.");
      }

      toast({
        title: "Template created",
        description: "Your menu template is ready to generate weekly menus.",
      });
      localStorage.removeItem(draftKey);
      router.push(getLocalizedPathname("/admin/menus/templates", locale));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create template.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create Menu Template</h1>

      <div className="space-y-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Template Information</h2>

          <div className="space-y-4">
            <InputField
              id="name"
              label="Template Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Traditional Mandalay Week"
            />

            <InputField
              id="nameMy"
              label="Burmese Name (Optional)"
              value={nameMy}
              onChange={(event) => setNameMy(event.target.value)}
              placeholder="e.g., ရိုးရာ မန္တလေး အပတ်"
            />

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe this menu theme..."
                className="mt-2"
              />
            </div>

            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-slate-700">
                Theme
              </label>
              <Select
                id="theme"
                options={THEME_OPTIONS}
                value={theme}
                onChange={(value) => {
                  if (typeof value === "string") {
                    setTheme(value as MenuTheme);
                  }
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Select Dishes (7 days × 3 dishes)</h2>
            <p className="text-sm text-slate-500">{missingSlots} remaining</p>
          </div>

          <div className="mt-6 space-y-6">
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="border-b pb-6 last:border-b-0">
                <h3 className="font-semibold mb-3">{day}</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((position) => (
                    <div key={position}>
                      <p className="text-sm font-medium text-slate-600">Dish {position}</p>
                      <DishSelector
                        value={selectedDishes[`${dayIndex}-${position}`]}
                        onChange={(dishId) =>
                          setSelectedDishes((prev) => ({
                            ...prev,
                            [`${dayIndex}-${position}`]: dishId,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            variant="secondary"
            onClick={() => {
              const hasChanges =
                Boolean(name.trim()) ||
                Boolean(nameMy.trim()) ||
                Boolean(description.trim()) ||
                Object.keys(selectedDishes).length > 0;

              if (!hasChanges || window.confirm("Discard this template draft?")) {
                localStorage.removeItem(draftKey);
                router.back();
              }
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Create Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}
