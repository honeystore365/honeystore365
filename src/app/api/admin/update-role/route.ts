// src/app/api/admin/update-role/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAdminEmail } from '@/lib/auth/admin-auth';
import { logger } from '@/lib/logger';

// !! Assurez-vous que ces variables d'environnement sont définies côté serveur !!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  logger.error("Supabase URL or Service Role Key is missing in server environment variables.");
  // Ne pas initialiser le client si les clés manquent
}

// Initialiser le client d'administration Supabase
// ATTENTION : N'utilisez JAMAIS la clé service_role côté client !
const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!);

export async function POST(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  if (getUserError || !user || !isAdminEmail(user.email || '')) {
    logger.warn('Unauthorized attempt to update user role', { userId: user?.id, userEmail: user?.email });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!supabaseUrl || !serviceRoleKey) {
     return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const { userId, newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'Missing userId or newRole in request body' }, { status: 400 });
    }

    logger.info(`Admin ${user.email} is attempting to update role for user ${userId} to ${newRole}`);

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { role: newRole } } // Met à jour user_metadata
    );

    if (error) {
      logger.error(`Error updating role for user ${userId}`, error, { adminUser: user.email });
      return NextResponse.json({ error: error.message || 'Failed to update user role' }, { status: 500 });
    }

    logger.info(`User role updated successfully for user ${userId} by admin ${user.email}`);
    return NextResponse.json({ message: 'User role updated successfully', user: data.user });

  } catch (e: any) {
    logger.error("Error processing update-role request", e, { adminUser: user.email });
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}