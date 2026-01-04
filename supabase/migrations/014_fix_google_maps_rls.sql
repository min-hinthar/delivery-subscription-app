-- Fix RLS policies and constraints for driver_locations table

-- Add unique constraint for upsert operations
ALTER TABLE driver_locations
  DROP CONSTRAINT IF EXISTS driver_locations_driver_route_unique;

ALTER TABLE driver_locations
  ADD CONSTRAINT driver_locations_driver_route_unique
  UNIQUE (driver_id, route_id);

-- Add composite index for upsert performance
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_route
  ON driver_locations(driver_id, route_id);

-- Drop existing INSERT policy and recreate as INSERT + UPDATE
DROP POLICY IF EXISTS "Drivers can update own location" ON driver_locations;

-- Drivers can insert and update their own location
CREATE POLICY "Drivers can insert own location"
  ON driver_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own location"
  ON driver_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

-- Explicitly disallow DELETE for safety (drivers shouldn't delete location history)
CREATE POLICY "No one can delete driver locations"
  ON driver_locations FOR DELETE
  TO authenticated
  USING (false);

-- Admins can update any driver location (for support/corrections)
CREATE POLICY "Admins can update driver locations"
  ON driver_locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );
