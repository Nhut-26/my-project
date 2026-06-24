import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnrdufjkmjgvjydigyep.supabase.co';

const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucmR1ZmprbWpndmp5ZGlneWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMTE2MDEsImV4cCI6MjA5Nzg4NzYwMX0.jK_OIQGSQXMgVAE_V1j2Q_pbfpq2lhjh1xtbNYylOJ8';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);