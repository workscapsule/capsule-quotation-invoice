/**
 * Supabase Keep-Alive Cron Script
 * Pings Supabase database & REST API to prevent auto-pause on free-tier projects (which occurs after 7 days of inactivity).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zksmzotvrdqphrtperbk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprc216b3R2cmRxcGhydHBlcmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MTM4MTUsImV4cCI6MjEwNTk4OTgxNX0.vDmppKXlDBGJyyez-MHfxIhCWvt_dipq9D2a5ydwyd0";

async function pingSupabase() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Pinging Supabase at ${SUPABASE_URL}...`);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/Category?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[${timestamp}] ✅ Supabase is active and awake! HTTP ${response.status}. Data received:`, JSON.stringify(data));
    } else {
      console.warn(`[${timestamp}] ⚠️ Supabase returned status ${response.status}`);
    }
  } catch (err) {
    console.error(`[${timestamp}] ❌ Error pinging Supabase:`, err.message);
  }
}

pingSupabase();
