-- Run this in your Supabase SQL Editor
ALTER TABLE works ADD COLUMN design_tool TEXT;
ALTER TABLE works ADD COLUMN client_name TEXT;
ALTER TABLE works ADD COLUMN is_live_url_private BOOLEAN DEFAULT FALSE;
ALTER TABLE works ADD COLUMN is_source_url_private BOOLEAN DEFAULT FALSE;
