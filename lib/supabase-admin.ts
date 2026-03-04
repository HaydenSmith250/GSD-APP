import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side client with elevated privileges — use in API routes only
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
