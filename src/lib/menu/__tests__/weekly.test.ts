import { describe, expect, it } from "vitest";

import { groupMenuItemsByDay } from "@/lib/menu/weekly";

const baseItem = {
  weekly_menu_id: "menu-1",
  is_available: true,
  max_portions: null,
  current_orders: 0,
  created_at: "2025-01-01T00:00:00Z",
} as const;

describe("groupMenuItemsByDay", () => {
  it("groups menu items by day and orders by meal position", () => {
    const items = [
      {
        ...baseItem,
        id: "item-1",
        dish_id: "dish-1",
        day_of_week: 0,
        meal_position: 2,
        dish: { id: "dish-1", name: "Tea leaf salad" },
      },
      {
        ...baseItem,
        id: "item-2",
        dish_id: "dish-2",
        day_of_week: 0,
        meal_position: 1,
        dish: { id: "dish-2", name: "Mohinga" },
      },
      {
        ...baseItem,
        id: "item-3",
        dish_id: "dish-3",
        day_of_week: 2,
        meal_position: 1,
        dish: { id: "dish-3", name: "Shan noodles" },
      },
    ];

    const grouped = groupMenuItemsByDay(items, "2025-01-05");

    expect(grouped).toHaveLength(2);
    expect(grouped[0].dayName).toBe("Sunday");
    expect(grouped[0].dishes[0].dish.name).toBe("Mohinga");
    expect(grouped[0].dishes[1].dish.name).toBe("Tea leaf salad");
    expect(grouped[1].dayName).toBe("Tuesday");
  });
});
