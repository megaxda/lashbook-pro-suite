
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS signup_origin text NOT NULL DEFAULT 'internal';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _origin text;
  _expires timestamptz;
BEGIN
  _origin := COALESCE(NEW.raw_user_meta_data->>'signup_origin', 'internal');
  IF _origin = 'public' THEN
    _expires := now() + interval '7 days';
  ELSE
    _expires := NULL;
  END IF;

  INSERT INTO public.profiles (id, nome, email, signup_origin, access_expires_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    _origin,
    _expires
  );
  RETURN NEW;
END;
$function$;
