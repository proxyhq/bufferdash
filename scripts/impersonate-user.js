#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Check if the user ID is provided
if (process.argv.length < 3) {
  console.error('Usage: node impersonate-user.js <user_id>');
  process.exit(1);
}

const userId = process.argv[2];

// Create Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function impersonateUser() {
  try {
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError.message);
      return;
    }

    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return;
    }

    console.log(`Generating link for user: ${user.email} (${userId})`);

    // Generate a sign-in link for the user
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    });

    if (error) {
      console.error('Error generating link:', error.message);
      return;
    }

    console.log('Sign-in link generated successfully:');
    console.log(data.properties.action_link);
    console.log('\nOpen this link in your browser to sign in as this user.');
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

impersonateUser();
