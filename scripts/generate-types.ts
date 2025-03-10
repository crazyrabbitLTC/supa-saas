#!/usr/bin/env tsx

/**
 * Script to generate TypeScript types from Supabase database schema
 * 
 * Usage:
 * pnpm generate:types
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
const OUTPUT_PATH = path.resolve(process.cwd(), 'packages/database/src/types/supabase.ts');

if (!SUPABASE_PROJECT_ID) {
  console.error('Error: SUPABASE_PROJECT_ID environment variable is not set.');
  console.error('Please add it to your .env file:');
  console.error('SUPABASE_PROJECT_ID=your-project-id');
  process.exit(1);
}

console.log('📝 Generating TypeScript types from Supabase schema...');

// Ensure the output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate types using Supabase CLI
const command = `supabase gen types typescript --project-id ${SUPABASE_PROJECT_ID} --schema public`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error.message}`);
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`Command stderr: ${stderr}`);
  }
  
  // Write the output to the file with additional exports
  const typeDefinitions = `/**
 * TypeScript definitions for Supabase Database
 * Generated using \`supabase gen types typescript\`
 * 
 * @file supabase.ts
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified ${new Date().toISOString().split('T')[0]}
 */

${stdout}

// Export as named export
export type { Database };

// Also export as default export
export default Database;
`;
  
  fs.writeFileSync(OUTPUT_PATH, typeDefinitions);
  console.log(`✅ TypeScript types generated and saved to: ${OUTPUT_PATH}`);
}); 