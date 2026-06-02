-- Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_promote_known_admins() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_role_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_create_receita_on_concluido() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated, PUBLIC;

-- Admin/role-check helpers: only authenticated users need these
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_is_admin() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_my_slug(text) FROM anon, PUBLIC;