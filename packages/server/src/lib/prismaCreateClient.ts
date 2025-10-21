import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function authMiddleware({ req }) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return { userId: null };

  // ✅ This checks with Supabase servers — catches expired or invalid tokens
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    console.warn('Invalid or expired token');
    return { userId: null };
  }

  return { userId: data.user.id };
}
