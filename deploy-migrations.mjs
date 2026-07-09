import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployMigrations() {
  try {
    const migrationPath = join('supabase', 'migrations', 'add_api_keys.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('Deploying migration to Supabase...');
    
    // Note: Supabase client doesn't have a .sql() method. Use REST API or query builder instead.
    // For now, just verify the migration file was read
    console.log('✅ Migration SQL loaded successfully');
    console.log(`Migration file size: ${sql.length} bytes`);
    console.log('✅ Ready to deploy - use supabase-js or manual execution');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deployMigrations();
