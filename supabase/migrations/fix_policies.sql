-- Rulează ASTA (nu fișierul original) — șterge policiile vechi și le recreează

DROP POLICY IF EXISTS "Admin full access" ON public.quotes;
DROP POLICY IF EXISTS "Users view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can insert" ON public.quotes;

-- Recreare policii
CREATE POLICY "Admin full access" ON public.quotes
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.price_multiplier = 0.75
  ))
  WITH CHECK (true);

CREATE POLICY "Users view own quotes" ON public.quotes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert" ON public.quotes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
