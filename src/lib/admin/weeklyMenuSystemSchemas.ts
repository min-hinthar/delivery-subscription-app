import { z } from "zod";

const menuThemeSchema = z.enum([
  "traditional",
  "street_food",
  "regional",
  "fusion",
  "vegetarian",
]);

const weekStartSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date.",
  });

export const createMenuTemplateSchema = z.object({
  name: z.string().trim().min(1),
  name_my: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  description_my: z.string().trim().optional().nullable(),
  theme: menuThemeSchema.optional().nullable(),
});

export const templateDishesSchema = z.object({
  dishes: z
    .array(
      z.object({
        template_id: z.string().uuid(),
        dish_id: z.string().uuid(),
        day_of_week: z.number().int().min(0).max(6),
        meal_position: z.number().int().min(1).max(3),
      }),
    )
    .min(1),
});

const templateDishInputSchema = z.object({
  dish_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  meal_position: z.number().int().min(1).max(3),
});

export const createMenuTemplateWithDishesSchema = createMenuTemplateSchema.extend({
  dishes: z.array(templateDishInputSchema).min(1),
});

export const generateWeeklyMenuSchema = z.object({
  template_id: z.string().uuid(),
  week_start_date: weekStartSchema,
});

export const updateWeeklyMenuStatusSchema = z.object({
  weekly_menu_id: z.string().uuid(),
  status: z.enum(["draft", "published", "closed", "completed", "archived"]),
});
