-- Migration: Add support for à la carte single-dish orders
-- This allows customers to order individual dishes without a meal plan package

-- Add order_type column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'package' CHECK (order_type IN ('package', 'a_la_carte'));

-- Add is_a_la_carte flag to order_items to distinguish single dish orders
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS is_a_la_carte BOOLEAN DEFAULT false;

-- Create index for faster filtering of à la carte orders
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_order_items_a_la_carte ON order_items(is_a_la_carte);

-- Add minimum order quantity for à la carte
ALTER TABLE meal_items
ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS available_for_a_la_carte BOOLEAN DEFAULT true;

-- Create view for à la carte available items
CREATE OR REPLACE VIEW a_la_carte_items AS
SELECT
  mi.id,
  mi.name,
  mi.description,
  mi.price_cents,
  mi.category,
  mi.is_active,
  mi.min_order_quantity,
  COALESCE(wmi.day_of_week, '') as available_day,
  COALESCE(wmi.max_portions - wmi.current_orders, 0) as available_quantity
FROM meal_items mi
LEFT JOIN weekly_menu_items wmi ON mi.id = wmi.dish_id
WHERE mi.is_active = true
  AND mi.available_for_a_la_carte = true
ORDER BY mi.category, mi.name;

-- Add RLS policy for à la carte items view
ALTER VIEW a_la_carte_items SET (security_invoker = on);

-- Update RLS policies to include à la carte orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own à la carte orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'Users can view own a la carte orders'
  ) THEN
    CREATE POLICY "Users can view own a la carte orders"
      ON public.orders FOR SELECT
      USING (
        (SELECT auth.uid()) = user_id
        AND (order_type = 'a_la_carte' OR order_type = 'package')
      );
  END IF;
END $$;

-- Comment for documentation
COMMENT ON COLUMN orders.order_type IS 'Type of order: package (meal plan) or a_la_carte (single dishes)';
COMMENT ON COLUMN order_items.is_a_la_carte IS 'Flag to indicate if this item is part of an à la carte order';
COMMENT ON VIEW a_la_carte_items IS 'Available menu items for à la carte ordering with current availability';
