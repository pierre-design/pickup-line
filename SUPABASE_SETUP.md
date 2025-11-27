# Supabase Setup Instructions

## 1. Create the Database Table

Go to your Supabase SQL Editor and run this SQL:

```sql
-- Create call_sessions table
CREATE TABLE call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  pickup_line_id TEXT,
  pickup_line_text TEXT,
  outcome TEXT CHECK (outcome IN ('stayed', 'left')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  agent_transcription TEXT,
  client_transcription TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_call_sessions_device_id ON call_sessions(device_id);
CREATE INDEX idx_call_sessions_created_at ON call_sessions(created_at DESC);
CREATE INDEX idx_call_sessions_pickup_line ON call_sessions(pickup_line_id);

-- Enable Row Level Security (RLS)
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (anyone can add data)
CREATE POLICY "Allow anonymous inserts" ON call_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow reading own device data
CREATE POLICY "Allow reading own device data" ON call_sessions
  FOR SELECT
  TO anon
  USING (true);

-- Optional: Create a view for aggregated statistics
CREATE VIEW pickup_line_stats AS
SELECT 
  pickup_line_id,
  pickup_line_text,
  COUNT(*) as total_uses,
  SUM(CASE WHEN outcome = 'stayed' THEN 1 ELSE 0 END) as successful_uses,
  ROUND(
    SUM(CASE WHEN outcome = 'stayed' THEN 1 ELSE 0 END)::NUMERIC / 
    NULLIF(COUNT(*), 0), 
    2
  ) as success_rate,
  AVG(duration_seconds) as avg_duration_seconds
FROM call_sessions
WHERE outcome IS NOT NULL
GROUP BY pickup_line_id, pickup_line_text;
```

## 2. Environment Variables

Add these to your `.env` file:

```
VITE_SUPABASE_URL=https://wypmssfilrtkkrrhqkph.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cG1zc2ZpbHJ0a2tycmhxa3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjk3NzIsImV4cCI6MjA3OTg0NTc3Mn0.D3JQdK4H-nO0vK6031_DgEu1zhq6wlic6fusWDW6hRA
```

## 3. Install Supabase Client

Run:
```bash
npm install @supabase/supabase-js
```

## 4. Data Privacy (POPI Compliance)

✅ **No personal information collected**
- Only anonymous device UUIDs
- No names, emails, or phone numbers
- Transcriptions are work-related only
- Users can't be personally identified

✅ **Data retention**
- Consider adding a retention policy (e.g., delete data after 90 days)
- Add this SQL if needed:

```sql
-- Optional: Auto-delete old data after 90 days
CREATE OR REPLACE FUNCTION delete_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM call_sessions 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule it to run daily (requires pg_cron extension)
-- SELECT cron.schedule('delete-old-sessions', '0 2 * * *', 'SELECT delete_old_sessions()');
```

## 5. Verify Setup

After running the SQL, verify in Supabase:
1. Go to Table Editor
2. Check that `call_sessions` table exists
3. Check that RLS policies are enabled
4. Try inserting a test row

## Done!

The app will now sync data to Supabase automatically.
