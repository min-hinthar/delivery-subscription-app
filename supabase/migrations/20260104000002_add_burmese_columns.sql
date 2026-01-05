-- Add Burmese columns to dishes table
alter table dishes
  add column if not exists name_my text,
  add column if not exists description_my text;

-- Add Burmese columns to categories table (if exists)
alter table categories
  add column if not exists name_my text,
  add column if not exists description_my text;

-- Add Burmese columns to menu_templates (already have from PR #25)
-- (no changes needed)

-- Add Burmese columns to meal_packages (already have from PR #25)
-- (no changes needed)

-- Create helper function to get dish name by locale
create or replace function get_dish_name(dish_record dishes, preferred_locale text)
returns text as $$
begin
  if preferred_locale = 'my' and dish_record.name_my is not null then
    return dish_record.name_my;
  else
    return dish_record.name;
  end if;
end;
$$ language plpgsql immutable;

-- Create helper function to get description by locale
create or replace function get_dish_description(dish_record dishes, preferred_locale text)
returns text as $$
begin
  if preferred_locale = 'my' and dish_record.description_my is not null then
    return dish_record.description_my;
  else
    return dish_record.description;
  end if;
end;
$$ language plpgsql immutable;
