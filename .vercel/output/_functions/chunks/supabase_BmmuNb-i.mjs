import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://rsimzjxfezlmbsjfngfn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzaW16anhmZXpsbWJzamZuZ2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1OTc3MTksImV4cCI6MjA1NDE3MzcxOX0.1T72aUTJej9hMb9IyAH5Ernh3mnMeJqKSqPi0c6-N9U"
);

export { supabase as s };
