-- Migration 007: Automatic Sync Trigger from auth.users (Supabase Auth) to public.users & public.user_wallets

-- 1. Create the synchronization trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_name TEXT;
  v_provider TEXT;
  v_avatar TEXT;
  v_provider_id TEXT;
BEGIN
  -- Extract metadata safely
  v_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'ParkLah Driver');
  v_provider := COALESCE(UPPER(new.raw_app_meta_data->>'provider'), 'GOOGLE');
  v_avatar := new.raw_user_meta_data->>'avatar_url';
  v_provider_id := COALESCE(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub');

  -- Insert or update in public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    auth_provider,
    auth_provider_id,
    avatar_url,
    reliability_rating,
    total_completed_matches,
    total_disputes_count,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    v_name,
    v_provider,
    v_provider_id,
    v_avatar,
    5.00,
    0,
    0,
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

  -- Automatically initialize starting RM 20.00 wallet for the new driver
  INSERT INTO public.user_wallets (
    id,
    user_id,
    balance,
    locked_balance,
    currency,
    version,
    updated_at
  )
  VALUES (
    uuid_generate_v4(),
    new.id,
    20.00,
    0.00,
    'MYR',
    1,
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind the trigger to Supabase's auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill any existing users currently in auth.users (such as Google OAuth logins) into public.users
INSERT INTO public.users (
  id,
  email,
  full_name,
  auth_provider,
  auth_provider_id,
  avatar_url,
  reliability_rating,
  total_completed_matches,
  total_disputes_count,
  is_active,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'ParkLah Driver'),
  COALESCE(UPPER(u.raw_app_meta_data->>'provider'), 'GOOGLE'),
  COALESCE(u.raw_user_meta_data->>'provider_id', u.raw_user_meta_data->>'sub'),
  u.raw_user_meta_data->>'avatar_url',
  5.00,
  0,
  0,
  TRUE,
  u.created_at,
  NOW()
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 4. Backfill user wallets
INSERT INTO public.user_wallets (
  id,
  user_id,
  balance,
  locked_balance,
  currency,
  version,
  updated_at
)
SELECT 
  uuid_generate_v4(),
  u.id,
  20.00,
  0.00,
  'MYR',
  1,
  NOW()
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;
