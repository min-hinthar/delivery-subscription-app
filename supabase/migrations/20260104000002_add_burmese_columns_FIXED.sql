-- ============================================
-- BURMESE I18N COLUMNS (PR #88 - CORRECTED)
-- ============================================
-- CRITICAL FIX: Original migration referenced non-existent 'dishes' and 'categories' tables
-- Actual schema uses 'meal_items' (no categories table exists)

-- Add Burmese columns to meal_items table (was incorrectly "dishes")
alter table public.meal_items
  add column if not exists name_my text,
  add column if not exists description_my text;

-- NOTE: categories table does not exist in this schema
-- If categories are needed, they should be added as a separate feature

-- Burmese columns for menu_templates (already exist from PR #25)
-- (no changes needed - name_my and description_my already in menu_templates)

-- Burmese columns for meal_packages (already exist from PR #25)
-- (no changes needed - name_my and description_my already in meal_packages)

-- Create helper function to get meal item name by locale
create or replace function public.get_meal_item_name(
  item_record public.meal_items,
  preferred_locale text
)
returns text as $$
begin
  if preferred_locale = 'my' and item_record.name_my is not null and item_record.name_my != '' then
    return item_record.name_my;
  else
    return item_record.name;
  end if;
end;
$$ language plpgsql immutable;

-- Create helper function to get meal item description by locale
create or replace function public.get_meal_item_description(
  item_record public.meal_items,
  preferred_locale text
)
returns text as $$
begin
  if preferred_locale = 'my' and item_record.description_my is not null and item_record.description_my != '' then
    return item_record.description_my;
  else
    return item_record.description;
  end if;
end;
$$ language plpgsql immutable;

-- Comment for future reference
comment on column public.meal_items.name_my is 'Burmese (Myanmar) translation of meal item name';
comment on column public.meal_items.description_my is 'Burmese (Myanmar) translation of meal item description';
