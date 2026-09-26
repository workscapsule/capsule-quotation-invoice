import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zksmzotvrdqphrtperbk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprc216b3R2cmRxcGhydHBlcmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MTM4MTUsImV4cCI6MjEwNTk4OTgxNX0.vDmppKXlDBGJyyez-MHfxIhCWvt_dipq9D2a5ydwyd0';

/**
 * Standard Supabase client for client-side and public queries
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Privileged Supabase client with service role key for backend/admin tasks
 */
export function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprc216b3R2cmRxcGhydHBlcmJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQxMzgxNSwiZXhwIjoyMTA1OTg5ODE1fQ.Z8iJW7vt8xyjqPmuS-C7qwnY1Wxk1-fV2ACZ6pfNx7M';
  return createClient(supabaseUrl, serviceRoleKey);
}
