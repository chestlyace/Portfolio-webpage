-- Fix Row Level Security (RLS) policies for Portfolio tables
-- Run this in your Supabase SQL Editor

-- Disable RLS for all tables (Easiest for a personal portfolio)
-- ALTER TABLE profile DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE skills DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE services DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE works DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE journey DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE socials DISABLE ROW LEVEL SECURITY;

-- OR: Enable RLS and add policies (Recommended for better security)

-- Works Table
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON works;
CREATE POLICY "Public Read Access" ON works FOR SELECT USING (true);
DROP POLICY IF EXISTS "All Access for Authenticated Users" ON works;
CREATE POLICY "All Access for Authenticated Users" ON works FOR ALL USING (true);

-- Journey Table
ALTER TABLE journey ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON journey;
CREATE POLICY "Public Read Access" ON journey FOR SELECT USING (true);
DROP POLICY IF EXISTS "All Access for Authenticated Users" ON journey;
CREATE POLICY "All Access for Authenticated Users" ON journey FOR ALL USING (true);

-- Skills Table
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON skills;
CREATE POLICY "Public Read Access" ON skills FOR SELECT USING (true);
DROP POLICY IF EXISTS "All Access for Authenticated Users" ON skills;
CREATE POLICY "All Access for Authenticated Users" ON skills FOR ALL USING (true);

-- Profile Table
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON profile;
CREATE POLICY "Public Read Access" ON profile FOR SELECT USING (true);
DROP POLICY IF EXISTS "All Access for Authenticated Users" ON profile;
CREATE POLICY "All Access for Authenticated Users" ON profile FOR ALL USING (true);

-- Services Table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON services;
CREATE POLICY "Public Read Access" ON services FOR SELECT USING (true);
DROP POLICY IF EXISTS "All Access for Authenticated Users" ON services;
CREATE POLICY "All Access for Authenticated Users" ON services FOR ALL USING (true);

-- Socials Table
ALTER TABLE socials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON socials;
CREATE POLICY "Public Read Access" ON socials FOR SELECT USING (true);
DROP POLICY IF EXISTS "All Access for Authenticated Users" ON socials;
CREATE POLICY "All Access for Authenticated Users" ON socials FOR ALL USING (true);
