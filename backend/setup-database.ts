import { supabase } from './src/config/supabase.js';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');

    // Read the SQL schema file
    const schemaPath = path.join(process.cwd(), 'supabase_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      }).single();

      if (error) {
        console.error(`❌ Error on statement ${i + 1}:`, error);
        console.error('Statement:', statement.substring(0, 100) + '...');
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\n✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
