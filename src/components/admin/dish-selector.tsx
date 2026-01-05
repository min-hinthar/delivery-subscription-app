"use client";

import { useEffect, useState } from "react";

import { Select } from "@/components/ui/select";

type DishOption = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

type DishSelectorProps = {
  value?: string;
  onChange: (dishId: string) => void;
  disabled?: boolean;
};

export function DishSelector({ value, onChange, disabled = false }: DishSelectorProps) {
  const [options, setOptions] = useState<DishOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMeals = async () => {
      try {
        const response = await fetch("/api/admin/meals");
        const payload = await response.json();
        setOptions(payload.data?.meals ?? []);
      } catch (error) {
        console.error("Failed to load dishes", error);
      } finally {
        setLoading(false);
      }
    };

    void loadMeals();
  }, []);

  const selectOptions = options.map((dish) => ({
    value: dish.id,
    label: dish.name,
    description: dish.description ?? undefined,
    disabled: !dish.is_active,
  }));

  return (
    <Select
      options={selectOptions}
      value={value}
      onChange={(next) => {
        if (typeof next === "string") {
          onChange(next);
        }
      }}
      placeholder={loading ? "Loading dishes..." : "Select a dish"}
      disabled={disabled || loading}
      searchable
    />
  );
}
