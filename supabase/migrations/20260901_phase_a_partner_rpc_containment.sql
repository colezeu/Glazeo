BEGIN;

REVOKE EXECUTE ON FUNCTION public.save_partner_name(uuid, text)
FROM PUBLIC, anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_partner_name(uuid, text)
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
