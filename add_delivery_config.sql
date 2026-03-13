-- Add delivery_config JSONB column to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_config JSONB DEFAULT '{
    "enabled": false,
    "type": "zone",
    "zones": []
}'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN restaurants.delivery_config IS 'Stores delivery settings like zones, fees, and types (flat, zone, distance)';
