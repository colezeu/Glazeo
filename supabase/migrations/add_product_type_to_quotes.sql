-- Adaugă coloana product_type în tabela quotes (necesar pentru Dashboard)
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS product_type text;
