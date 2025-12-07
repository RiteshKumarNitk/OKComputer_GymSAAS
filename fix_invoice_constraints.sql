-- Make amount_cents optional to prevent future errors if we switch to amount_inr
ALTER TABLE public.saas_invoices ALTER COLUMN amount_cents DROP NOT NULL;

-- Ensure amount_inr is synced if amount_cents is provided
CREATE OR REPLACE FUNCTION public.sync_invoice_amounts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_inr IS NULL AND NEW.amount_cents IS NOT NULL THEN
    NEW.amount_inr := NEW.amount_cents / 100;
  ELSIF NEW.amount_cents IS NULL AND NEW.amount_inr IS NOT NULL THEN
    NEW.amount_cents := NEW.amount_inr * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_invoice_amounts_trigger ON public.saas_invoices;
CREATE TRIGGER sync_invoice_amounts_trigger
BEFORE INSERT OR UPDATE ON public.saas_invoices
FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_amounts();
