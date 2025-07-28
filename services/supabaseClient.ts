import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

const supabaseUrl = 'https://pcqugaysduorgiphxedc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcXVnYXlzZHVvcmdpcGh4ZWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMjA0ODksImV4cCI6MjA2ODY5NjQ4OX0.TvDutiNvXf1N-FyOEQ3Knb2Xao_JDIdY2-G35NJCvkg';

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and Key must be provided.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
