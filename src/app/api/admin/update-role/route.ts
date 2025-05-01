// src/app/api/admin/update-role/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

// !! Assurez-vous que ces variables d'environnement sont définies côté serveur !!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in server environment variables.");
  // Ne pas initialiser le client si les clés manquent
}

// Initialiser le client d'administration Supabase
// ATTENTION : N'utilisez JAMAIS la clé service_role côté client !
const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!);

export async function POST(request: NextRequest) {
  // TODO: Ajouter une vérification ici pour s'assurer que seul un admin authentifié peut appeler cette route !
  // Exemple :
  // const { data: { user }, error: getUserError } = await supabase.auth.getUser(); // Utiliser le client standard pour vérifier l'appelant
  // if (getUserError || !user || user.user_metadata?.role !== 'admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  if (!supabaseUrl || !serviceRoleKey) {
     return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const { userId, newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'Missing userId or newRole in request body' }, { status: 400 });
    }

    console.log(`Attempting to update role for user ${userId} to ${newRole}`);

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { role: newRole } } // Met à jour user_metadata
    );

    if (error) {
      console.error(`Error updating role for user ${userId}:`, error.message);
      return NextResponse.json({ error: error.message || 'Failed to update user role' }, { status: 500 });
    }

    console.log(`User role updated successfully for user ${userId}:`, data.user);
    return NextResponse.json({ message: 'User role updated successfully', user: data.user });

  } catch (e: any) {
    console.error("Error processing request:", e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}