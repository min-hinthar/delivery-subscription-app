"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { MenuTemplate } from "@/types";

export default function GenerateWeeklyMenuPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [weekStartDate, setWeekStartDate] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const nextSunday = getNextSunday();
    setWeekStartDate(nextSunday.toISOString().split("T")[0]);
    void fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/menu-templates");
      const payload = await response.json();
      setTemplates(payload.data?.templates ?? []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const getNextSunday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    return nextSunday;
  };

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
      toast({
        title: "Select a template",
        description: "Choose a template before generating the weekly menu.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/admin/menus/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          week_start_date: weekStartDate,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Failed to generate menu.");
      }

      toast({
        title: "Weekly menu generated",
        description: "Your weekly menu is ready to publish.",
      });
      router.push("/admin/menus");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate menu.";
      toast({ title: "Generation failed", description: message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const templateOptions = templates.map((template) => ({
    value: template.id,
    label: template.name,
    description: template.description ?? undefined,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Generate Weekly Menu</h1>

      <Card className="p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-slate-700">
              Select Template
            </label>
            <Select
              id="template"
              options={templateOptions}
              value={selectedTemplateId}
              onChange={(value) => {
                if (typeof value === "string") {
                  setSelectedTemplateId(value);
                }
              }}
              placeholder="Choose a template..."
              searchable
            />
          </div>

          <div>
            <label htmlFor="weekStart" className="block text-sm font-medium text-slate-700">
              Week Start Date (Sunday)
            </label>
            <input
              type="date"
              id="weekStart"
              value={weekStartDate}
              onChange={(event) => setWeekStartDate(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleGenerate}
              disabled={!selectedTemplateId || generating}
              className="w-full"
            >
              {generating ? "Generating..." : "Generate Weekly Menu"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
