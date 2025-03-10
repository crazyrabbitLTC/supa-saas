import * as dotenv from 'dotenv';
import path from 'path';
import { beforeAll } from 'vitest';

// Load environment variables from .env.test file
beforeAll(() => {
  console.log('Loading test environment variables...');
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
  
  // Log the loaded environment variables for debugging
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[NOT SET]');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]');
}); 