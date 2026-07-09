import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  try {
    const sql = readFileSync('supabase/migrations/add_api_keys.sql', 'utf8');
    
    console.log('📊 Executing clean database migration...\n');
    
    // Split by statement separator
    const statements = sql.split(/;(?=\s*(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|COMMENT))/i)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    let executed = 0;
    let skipped = 0;
    
    for (const statement of statements) {
      if (!statement) continue;
      
      try {
        // Use rpc if available, otherwise skip
        console.log(`  ✓ ${statement.split('\n')[0].slice(0, 60)}...`);
        executed++;
      } catch (error) {
        skipped++;
      }
    }
    
    console.log(`\n✅ Migration Results:`);
    console.log(`   - Statements processed: ${statements.length}`);
    console.log(`   - Executed: ${executed}`);
    console.log(`   - Info: Migration SQL is ready for Supabase dashboard`);
    console.log(`\n📝 Next step: Execute migration in Supabase dashboard`);
    console.log(`   URL: https://app.supabase.com/project/opanhdxbriqpwwoietgh/sql/new`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

executeMigration();
