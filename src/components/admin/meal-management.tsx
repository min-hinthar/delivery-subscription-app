"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

type MealRow = {
  id: string;
  name: string;
  price_cents: number;
  is_active: boolean;
};

type TemplateRow = {
  id: string;
  name: string;
  is_active: boolean;
};

type MealManagementProps = {
  meals: MealRow[];
  templates: TemplateRow[];
};

export function MealManagement({ meals, templates }: MealManagementProps) {
  const [mealItems, setMealItems] = useState(meals);
  const [mealTemplates, setMealTemplates] = useState(templates);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleMealItem = async (meal: MealRow) => {
    setUpdating(meal.id);
    try {
      const response = await fetch(`/api/admin/meals/${meal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !meal.is_active }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Unable to update meal.");
      }

      setMealItems((prev) =>
        prev.map((item) => (item.id === meal.id ? payload.data.meal : item)),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update meal.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const toggleMealTemplate = async (template: TemplateRow) => {
    setUpdating(template.id);
    try {
      const response = await fetch(`/api/admin/meal-plan-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !template.is_active }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Unable to update template.");
      }

      setMealTemplates((prev) =>
        prev.map((item) => (item.id === template.id ? payload.data.template : item)),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update template.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        id="meal-items"
        className="space-y-4 bg-gradient-to-br from-white via-slate-50 to-amber-50/40 dark:from-slate-950 dark:via-slate-900/70 dark:to-amber-950/20"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Meal items</h2>
          <Badge variant="secondary">{mealItems.length} items</Badge>
        </div>
        <div className="space-y-3">
          {mealItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                No meal items yet.
              </p>
              <p className="mt-1">
                Add menu items to unlock weekly template generation.
              </p>
            </div>
          ) : (
            mealItems.map((meal) => (
              <div
                key={meal.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-white/80 p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/40"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {meal.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ${(meal.price_cents / 100).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={meal.is_active ? "default" : "outline"}>
                    {meal.is_active ? "Active" : "Paused"}
                  </Badge>
                  <Button
                    size="sm"
                    variant={meal.is_active ? "secondary" : "default"}
                    onClick={() => toggleMealItem(meal)}
                    disabled={updating === meal.id}
                  >
                    {updating === meal.id
                      ? "Saving..."
                      : meal.is_active
                      ? "Pause"
                      : "Activate"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card
        id="meal-templates"
        className="space-y-4 bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-slate-950 dark:via-slate-900/70 dark:to-emerald-950/20"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Meal plan templates</h2>
          <Badge variant="secondary">{mealTemplates.length} templates</Badge>
        </div>
        <div className="space-y-3">
          {mealTemplates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                No templates yet.
              </p>
              <p className="mt-1">
                Build a weekly meal plan to generate upcoming delivery orders.
              </p>
            </div>
          ) : (
            mealTemplates.map((template) => (
              <div
                key={template.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-white/80 p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/40"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {template.name}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={template.is_active ? "default" : "outline"}>
                    {template.is_active ? "Active" : "Draft"}
                  </Badge>
                  <Button
                    size="sm"
                    variant={template.is_active ? "secondary" : "default"}
                    onClick={() => toggleMealTemplate(template)}
                    disabled={updating === template.id}
                  >
                    {updating === template.id
                      ? "Saving..."
                      : template.is_active
                      ? "Pause"
                      : "Activate"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
