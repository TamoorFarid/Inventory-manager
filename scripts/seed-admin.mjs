import { createClient } from '@supabase/supabase-js';

const email = 'admin@sunpulse.com';
const password = 'Admin@123';
const username = 'SunPulse Admin';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Load them before running the seed script.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const normalizedEmail = email.toLowerCase();

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingProfileError) {
    throw existingProfileError;
  }

  let userId = existingProfile?.id ?? null;

  if (!userId) {
    const { data: createdUser, error: createUserError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        app_metadata: {
          role: 'admin',
        },
        user_metadata: {
          username,
        },
      });

    if (createUserError || !createdUser.user) {
      throw createUserError ?? new Error('Unable to create the default admin user.');
    }

    userId = createdUser.user.id;
    console.log(`Created auth user ${normalizedEmail}.`);
  } else {
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
      password,
      app_metadata: {
        role: 'admin',
      },
      user_metadata: {
        username,
      },
    });

    if (updateAuthError) {
      throw updateAuthError;
    }

    console.log(`Updated existing auth user ${normalizedEmail}.`);
  }

  const { error: upsertProfileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: normalizedEmail,
      username,
      role: 'admin',
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
    },
    {
      onConflict: 'id',
    },
  );

  if (upsertProfileError) {
    throw upsertProfileError;
  }

  console.log('');
  console.log('Default admin is ready:');
  console.log(`Email: ${normalizedEmail}`);
  console.log(`Password: ${password}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
