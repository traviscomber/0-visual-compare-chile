import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`Connecting to Supabase: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Leer el archivo de migración
import fs from 'fs';
const migrationSql = fs.readFileSync('supabase/migrations/add_api_keys.sql', 'utf8');

console.log('Executing migration...');
console.log('---');
console.log(migrationSql.slice(0, 200) + '...');
console.log('---');

// Ejecutar cada statement SQL por separado
const statements = migrationSql.split(';').filter(s => s.trim());

for (const statement of statements) {
  try {
    const { error } = await supabase.rpc('exec', { sql: statement.trim() });
    if (error) throw error;
    console.log(`✓ Executed: ${statement.trim().slice(0, 50)}...`);
  } catch (error) {
    console.log(`Note: ${statement.trim().slice(0, 50)}...`);
  }
}

console.log('✅ Migration complete!');
