-- Driver locations table (real-time tracking)
CREATE TABLE IF NOT EXISTS driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  latitude numeric(10, 8) NOT NULL,
  longitude numeric(11, 8) NOT NULL,
  heading numeric(5, 2), -- 0-360 degrees
  speed numeric(6, 2), -- km/h
  accuracy numeric(6, 2), -- meters
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT valid_heading CHECK (heading IS NULL OR (heading >= 0 AND heading <= 360))
);

-- RLS Policies
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Drivers can update their own location
CREATE POLICY "Drivers can update own location"
  ON driver_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can view own location"
  ON driver_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

-- Customers can view driver location if on their route
CREATE POLICY "Customers can view driver on their route"
  ON driver_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_stops ds
      JOIN appointments a ON ds.appointment_id = a.id
      WHERE ds.route_id = driver_locations.route_id
        AND a.user_id = auth.uid()
        AND a.status IN ('confirmed', 'in_transit')
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all driver locations"
  ON driver_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_route_id ON driver_locations(route_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at ON driver_locations(updated_at DESC);

-- Update routes table
ALTER TABLE routes ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES profiles(id);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS start_time timestamptz;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS end_time timestamptz;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS actual_distance integer; -- meters
ALTER TABLE routes ADD COLUMN IF NOT EXISTS actual_duration integer; -- seconds

-- Update delivery_stops table
ALTER TABLE delivery_stops ADD COLUMN IF NOT EXISTS estimated_arrival timestamptz;
ALTER TABLE delivery_stops ADD COLUMN IF NOT EXISTS actual_arrival timestamptz;
ALTER TABLE delivery_stops ADD COLUMN IF NOT EXISTS geocoded_lat numeric(10, 8);
ALTER TABLE delivery_stops ADD COLUMN IF NOT EXISTS geocoded_lng numeric(11, 8);
