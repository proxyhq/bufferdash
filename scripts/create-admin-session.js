#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Check if the user ID is provided
if (process.argv.length < 3) {
  console.error('Usage: node create-admin-session.js <user_id>');
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

async function createAdminSession() {
  try {
    // Get user details using a direct SQL query to the auth.users table
    const { data: userData, error: userError } = await supabase
      .rpc('get_user_email', { user_id: userId });

    if (userError) {
      console.error('Error fetching user:', userError.message);
      return;
    }

    if (!userData) {
      console.error(`User with ID ${userId} not found`);
      return;
    }

    console.log(`Creating admin session for user: ${userData} (${userId})`);

    // Create an admin session for the user
    const { data, error } = await supabase.auth.admin.createSession({
      user_id: userId,
      // Set a long expiry (14 days)
      expires_in: 1209600
    });

    if (error) {
      console.error('Error creating session:', error.message);
      return;
    }

    console.log('Admin session created successfully!');
    console.log('\nAccess Token:', data.session.access_token);
    console.log('\nRefresh Token:', data.session.refresh_token);
    
    // Generate a URL with the access token that can be used to log in
    const loginUrl = `${supabaseUrl}/auth/v1/verify?token=${data.session.access_token}&type=signup&redirect_to=${encodeURIComponent(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')}`;
    
    console.log('\nLogin URL:');
    console.log(loginUrl);
    console.log('\nOpen this URL in your browser to log in as this user.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminSession();
