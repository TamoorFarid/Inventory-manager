import { createClient } from 'npm:@supabase/supabase-js@2';

// CORS headers inlined for dashboard deployment
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type MemberRole = 'admin' | 'member';

interface CreateMemberBody {
  companyId: string;
  email: string;
  username: string;
  password: string;
  role?: MemberRole;
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authHeader = request.headers.get('Authorization');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse(500, {
        error: 'Supabase function secrets are not configured.',
      });
    }

    if (!authHeader) {
      return jsonResponse(401, { error: 'Missing authorization header.' });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, {
        error: authError?.message ?? 'Unable to validate requesting user.',
      });
    }

    const { data: requesterProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single();

    if (profileError || !requesterProfile) {
      return jsonResponse(403, {
        error: 'Requesting profile is missing or inactive.',
      });
    }

    if (requesterProfile.role !== 'admin') {
      return jsonResponse(403, { error: 'Only admins can create members.' });
    }

    const body = (await request.json()) as CreateMemberBody;
    const normalizedEmail = body.email?.trim().toLowerCase();
    const username = body.username?.trim();
    const password = body.password?.trim();
    const companyId = body.companyId?.trim();
    const role: MemberRole = body.role === 'admin' ? 'admin' : 'member';

    if (!normalizedEmail || !username || !password || !companyId) {
      return jsonResponse(400, { error: 'Missing required fields.' });
    }

    if (password.length < 8) {
      return jsonResponse(400, {
        error: 'Password must be at least 8 characters long.',
      });
    }

    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .is('deleted_at', null)
      .single();

    if (companyError || !company) {
      return jsonResponse(404, { error: 'Company not found.' });
    }

    const { data: existingProfile, error: existingProfileError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfileError) {
      return jsonResponse(500, { error: existingProfileError.message });
    }

    if (existingProfile) {
      return jsonResponse(409, {
        error: 'A user with this email already exists.',
      });
    }

    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        app_metadata: {
          role,
        },
        user_metadata: {
          username,
        },
      });

    if (createUserError || !createdUser.user) {
      return jsonResponse(400, {
        error: createUserError?.message ?? 'Unable to create auth user.',
      });
    }

    const userId = createdUser.user.id;

    const { error: insertProfileError } = await adminClient.from('profiles').insert({
      id: userId,
      email: normalizedEmail,
      username,
      role,
      created_by: requesterProfile.id,
      updated_by: requesterProfile.id,
    });

    if (insertProfileError) {
      await adminClient.auth.admin.deleteUser(userId);

      return jsonResponse(500, {
        error: insertProfileError.message,
      });
    }

    const { error: membershipError } = await adminClient.from('company_members').insert({
      company_id: companyId,
      user_id: userId,
      added_by: requesterProfile.id,
    });

    if (membershipError) {
      await adminClient.from('profiles').delete().eq('id', userId);
      await adminClient.auth.admin.deleteUser(userId);

      return jsonResponse(500, {
        error: membershipError.message,
      });
    }

    return jsonResponse(200, {
      user: {
        id: userId,
        email: normalizedEmail,
        username,
        role,
      },
    });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Unexpected edge function error.',
    });
  }
});
