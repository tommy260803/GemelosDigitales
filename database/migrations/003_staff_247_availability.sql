-- Safe additive migration for an existing health_districts table.
ALTER TABLE health_districts ADD COLUMN IF NOT EXISTS staff_247_availability_rate NUMERIC(5,4);
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'health_districts_staff_247_availability_rate_check') THEN
        ALTER TABLE health_districts ADD CONSTRAINT health_districts_staff_247_availability_rate_check
            CHECK (staff_247_availability_rate BETWEEN 0 AND 1);
    END IF;
END $$;
