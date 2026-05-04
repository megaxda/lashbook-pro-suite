-- Unique partial index on slug (ignores NULL)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_unique_idx
  ON public.profiles (slug)
  WHERE slug IS NOT NULL;

-- Check if a slug is available (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_slug_available(_slug text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _exists boolean;
  _uid uuid := auth.uid();
BEGIN
  IF _slug IS NULL OR length(_slug) < 3 THEN
    RETURN false;
  END IF;
  IF _slug !~ '^[a-z0-9-]{3,40}$' THEN
    RETURN false;
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE slug = _slug AND (id <> _uid OR _uid IS NULL)
  ) INTO _exists;
  RETURN NOT _exists;
END;
$$;

-- Set the current user's slug with validation
CREATE OR REPLACE FUNCTION public.set_my_slug(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _clean text;
  _taken boolean;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  IF _slug IS NULL OR btrim(_slug) = '' THEN
    UPDATE public.profiles SET slug = NULL WHERE id = _uid;
    RETURN jsonb_build_object('ok', true, 'slug', null);
  END IF;

  _clean := lower(btrim(_slug));

  IF _clean !~ '^[a-z0-9-]{3,40}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Slug inválido. Use apenas letras minúsculas, números e hífen (3 a 40 caracteres).');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE slug = _clean AND id <> _uid
  ) INTO _taken;

  IF _taken THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Este link já está em uso por outra pessoa.');
  END IF;

  UPDATE public.profiles SET slug = _clean WHERE id = _uid;
  RETURN jsonb_build_object('ok', true, 'slug', _clean);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_slug_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_slug(text) TO authenticated;