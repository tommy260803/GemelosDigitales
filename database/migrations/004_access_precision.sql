-- Store modeled access metrics at full computed precision instead of 2 decimals.
-- additivity-safe: type widening only, no value rewrite.
ALTER TABLE health_districts ALTER COLUMN avg_distance_emonc_km TYPE NUMERIC(10, 6);
ALTER TABLE health_districts ALTER COLUMN avg_travel_time_hours TYPE NUMERIC(9, 6);
