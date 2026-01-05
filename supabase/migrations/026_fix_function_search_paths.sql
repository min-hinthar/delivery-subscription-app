-- =====================================================
-- Migration: 026_fix_function_search_paths
-- Description: Fix "Function Search Path Mutable" security warnings
-- Created: 2026-01-05
-- =====================================================

-- Fix auto_close_weekly_menu function
CREATE OR REPLACE FUNCTION public.auto_close_weekly_menu()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.order_deadline < NOW() THEN
    NEW.status := 'closed';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_close_weekly_menu() IS 'Automatically closes weekly menus when order deadline passes';

-- Fix get_meal_item_name function
CREATE OR REPLACE FUNCTION public.get_meal_item_name(
  item_record public.meal_items,
  preferred_locale TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF preferred_locale = 'my' AND item_record.name_my IS NOT NULL AND item_record.name_my != '' THEN
    RETURN item_record.name_my;
  ELSE
    RETURN item_record.name;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_meal_item_name(public.meal_items, TEXT) IS 'Returns localized meal item name based on preferred locale';

-- Fix get_meal_item_description function
CREATE OR REPLACE FUNCTION public.get_meal_item_description(
  item_record public.meal_items,
  preferred_locale TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF preferred_locale = 'my' AND item_record.description_my IS NOT NULL AND item_record.description_my != '' THEN
    RETURN item_record.description_my;
  ELSE
    RETURN item_record.description;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_meal_item_description(public.meal_items, TEXT) IS 'Returns localized meal item description based on preferred locale';

-- Fix increment_menu_item_orders function
CREATE OR REPLACE FUNCTION public.increment_menu_item_orders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dishes_per_day_count INT;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    SELECT dishes_per_day INTO dishes_per_day_count
    FROM public.meal_packages
    WHERE id = NEW.package_id;

    UPDATE public.weekly_menu_items
    SET orders = orders + 1
    WHERE menu_id = NEW.menu_id
      AND meal_item_id = ANY(
        SELECT jsonb_array_elements_text(NEW.selections->'meal_item_ids')::UUID
      );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.increment_menu_item_orders() IS 'Increments order count for meal items when orders are confirmed';

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Updates the updated_at timestamp on row updates';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.auto_close_weekly_menu() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_meal_item_name(public.meal_items, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_meal_item_description(public.meal_items, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_menu_item_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
