import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployMigrations() {
  try {
    const migrationPath = path.join('supabase', 'migrations', 'add_api_keys.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Deploying migration to Supabase...');
    
    // Execute the migration SQL
    const { error } = await supabase.sql(sql);
    
    if (error) {
      console.error('❌ Error deploying migration:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration deployed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deployMigrations();
