-- Rulează în SQL Editor din Supabase Dashboard
-- https://supabase.com/dashboard/project/afezpnqkazcxbnqaqlrl/sql/new

CREATE TABLE IF NOT EXISTS public.quotes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name   TEXT NOT NULL,
  client_email  TEXT NOT NULL,
  client_phone  TEXT,
  client_message TEXT,
  product_name  TEXT NOT NULL,
  product_type  TEXT,
  config        JSONB DEFAULT '{}'::jsonb,
  quote_total   NUMERIC(10,2),
  quote_subtotal NUMERIC(10,2),
  quote_vat     NUMERIC(10,2),
  send_method   TEXT NOT NULL DEFAULT 'email',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','ordered')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ
);

-- Index
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON public.quotes(created_at DESC);

-- RLS: doar adminii pot vedea toate ofertele, utilizatorii logați le văd pe ale lor
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Admin: poate vedea și modifica tot
CREATE POLICY "Admin full access" ON public.quotes
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.price_multiplier = 0.75
  ))
  WITH CHECK (true);

-- Utilizator: își vede doar ofertele proprii
CREATE POLICY "Users view own quotes" ON public.quotes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Public (neautentificat): poate insera oferte noi
CREATE POLICY "Anyone can insert" ON public.quotes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
