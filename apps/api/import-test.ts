/**
 * Test file to check different import methods
 */

// Method 1: importing from package name
import { supabaseAdmin as adminFromPackage } from 'database';

// Method 2: importing from relative path
// Uncommenting this line would trigger the import error:
// import { supabaseAdmin as adminFromRelative } from '../lib/supabaseAdmin';

// This would be the output if we could run it
console.log('Import from package "database":', !!adminFromPackage);
// console.log('Import from relative path:', !!adminFromRelative); 