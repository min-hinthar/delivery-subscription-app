import { z } from "zod";

const weekOfSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date.",
  });

const menuIdSchema = z.string().uuid();
const itemIdSchema = z.string().uuid();
const mealIdSchema = z.string().uuid();

export const weeklyMenuQuerySchema = z.object({
  week_of: weekOfSchema,
});

export const createWeeklyMenuSchema = z.object({
  week_of: weekOfSchema,
  title: z.string().trim().min(1).optional(),
});

export const updateWeeklyMenuSchema = z
  .object({
    menu_id: menuIdSchema,
    title: z.string().trim().min(1).optional(),
    is_published: z.boolean().optional(),
  })
  .refine((value) => value.title !== undefined || value.is_published !== undefined, {
    message: "No updates provided.",
  });

export const weeklyMenuItemsQuerySchema = z.object({
  weekly_menu_id: menuIdSchema,
});

export const createWeeklyMenuItemSchema = z.union([
  z.object({
    weekly_menu_id: menuIdSchema,
    meal_item_id: mealIdSchema,
  }),
  z.object({
    weekly_menu_id: menuIdSchema,
    name: z.string().trim().min(1),
    description: z.string().trim().optional().nullable(),
    price_cents: z.number().int().min(0),
  }),
]);

export const updateWeeklyMenuItemSchema = z
  .object({
    item_id: itemIdSchema,
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().optional().nullable(),
    price_cents: z.number().int().min(0).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.price_cents !== undefined,
    { message: "No updates provided." },
  );

export const deleteWeeklyMenuItemSchema = z.object({
  item_id: itemIdSchema,
});

export const reorderWeeklyMenuItemsSchema = z.object({
  weekly_menu_id: menuIdSchema,
  item_id: itemIdSchema,
  direction: z.enum(["up", "down"]),
});
