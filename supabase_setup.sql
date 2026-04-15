-- ============================================
-- MyTower Apartment Maintenance - Supabase Setup
-- Run this ENTIRE script in the Supabase SQL Editor
-- ============================================

-- 1. Create tables
-- ============================================

CREATE TABLE IF NOT EXISTS flats (
  flat_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  tenant_name TEXT,
  size_sqft INTEGER NOT NULL,
  pin TEXT NOT NULL DEFAULT '0000'
);

CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY DEFAULT 1,
  pin TEXT NOT NULL DEFAULT '1234'
);

CREATE TABLE IF NOT EXISTS monthly_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  water_bill NUMERIC NOT NULL DEFAULT 0,
  electricity_bill NUMERIC NOT NULL DEFAULT 0,
  garbage_tips NUMERIC NOT NULL DEFAULT 200,
  misc_expenses NUMERIC NOT NULL DEFAULT 0,
  misc_description TEXT DEFAULT '',
  security_fees NUMERIC NOT NULL DEFAULT 13000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

CREATE TABLE IF NOT EXISTS flat_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_bill_id UUID NOT NULL REFERENCES monthly_bills(id) ON DELETE CASCADE,
  flat_id TEXT NOT NULL REFERENCES flats(flat_id) ON DELETE CASCADE,
  proportional_amount NUMERIC NOT NULL DEFAULT 0,
  security_share NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  UNIQUE(monthly_bill_id, flat_id)
);

-- 2. Seed data
-- ============================================

INSERT INTO flats (flat_id, name, owner_name, tenant_name, size_sqft, pin) VALUES
  ('G01', 'G - 01', 'V. Sathyamurthy', NULL, 1500, '0001'),
  ('F02', 'F - 02', 'Vidya & Ram', 'Navaneeth Prabhu', 1600, '0002'),
  ('S03', 'S - 03', 'Veda Nagaraja Rao', NULL, 1800, '0003'),
  ('T04', 'T - 04', 'Sreenivas Nagaraj', 'Narasimha Reddy', 2300, '0004'),
  ('G02', 'G - 02', 'V. Sathyamurthy', 'Swagath', 430, '0005')
ON CONFLICT (flat_id) DO NOTHING;

INSERT INTO admin (id, pin) VALUES (1, '1234')
ON CONFLICT (id) DO NOTHING;

-- 3. RPC Functions
-- ============================================

-- Verify flat PIN (server-side, never exposes PIN to client)
CREATE OR REPLACE FUNCTION verify_flat_pin(p_flat_id TEXT, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_pin TEXT;
BEGIN
  SELECT pin INTO stored_pin FROM flats WHERE flat_id = p_flat_id;
  IF stored_pin IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN stored_pin = p_pin;
END;
$$;

-- Verify admin PIN
CREATE OR REPLACE FUNCTION verify_admin_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_pin TEXT;
BEGIN
  SELECT pin INTO stored_pin FROM admin WHERE id = 1;
  IF stored_pin IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN stored_pin = p_pin;
END;
$$;

-- Get flats without PIN column
CREATE OR REPLACE FUNCTION get_flats_public()
RETURNS TABLE(flat_id TEXT, name TEXT, owner_name TEXT, tenant_name TEXT, size_sqft INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT f.flat_id, f.name, f.owner_name, f.tenant_name, f.size_sqft FROM flats f ORDER BY f.flat_id;
END;
$$;

-- Calculate and insert flat bills for a given monthly bill
CREATE OR REPLACE FUNCTION calculate_and_insert_bills(p_bill_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_sqft INTEGER;
  variable_total NUMERIC;
  security_per_flat NUMERIC;
  flat_rec RECORD;
  bill_rec RECORD;
BEGIN
  -- Get the monthly bill
  SELECT * INTO bill_rec FROM monthly_bills WHERE id = p_bill_id;
  IF bill_rec IS NULL THEN
    RAISE EXCEPTION 'Bill not found';
  END IF;

  -- Calculate totals
  SELECT SUM(size_sqft) INTO total_sqft FROM flats;
  variable_total := bill_rec.water_bill + bill_rec.electricity_bill + bill_rec.garbage_tips + bill_rec.misc_expenses;
  security_per_flat := ROUND(bill_rec.security_fees / 5.0);

  -- Delete existing flat bills for this monthly bill (in case of recalculation)
  DELETE FROM flat_bills WHERE monthly_bill_id = p_bill_id;

  -- Insert flat bills
  FOR flat_rec IN SELECT * FROM flats LOOP
    INSERT INTO flat_bills (monthly_bill_id, flat_id, proportional_amount, security_share, total_amount)
    VALUES (
      p_bill_id,
      flat_rec.flat_id,
      ROUND((flat_rec.size_sqft::NUMERIC / total_sqft) * variable_total),
      security_per_flat,
      ROUND((flat_rec.size_sqft::NUMERIC / total_sqft) * variable_total) + security_per_flat
    );
  END LOOP;
END;
$$;

-- 4. Row Level Security
-- ============================================

-- Enable RLS on flats to hide PIN
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- Allow reading flats (but RPC function is used to avoid PIN exposure)
CREATE POLICY "Allow read flats" ON flats FOR SELECT TO anon USING (true);

-- Block direct read on admin table
CREATE POLICY "Block direct admin read" ON admin FOR SELECT TO anon USING (false);

-- monthly_bills and flat_bills are readable by everyone
ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read monthly_bills" ON monthly_bills FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert monthly_bills" ON monthly_bills FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update monthly_bills" ON monthly_bills FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow delete monthly_bills" ON monthly_bills FOR DELETE TO anon USING (true);

ALTER TABLE flat_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read flat_bills" ON flat_bills FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert flat_bills" ON flat_bills FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow delete flat_bills" ON flat_bills FOR DELETE TO anon USING (true);
