#!/usr/bin/env node

/**
 * Fix TypeScript Configuration Paths
 * 
 * This script fixes the TypeScript configuration paths in all packages.
 * It ensures that the paths to shared TypeScript configurations are correct.
 * 
 * Usage: node scripts/fix-tsconfig-paths.js
 */

const fs = require('fs');
const path = require('path');

// Paths to fix
const pathsToFix = [
  'packages/database/tsconfig.json',
  'packages/config/tsconfig.json',
  'apps/api/tsconfig.json',
  'apps/services/tsconfig.json',
  'apps/web/tsconfig.json',
];

// Fix each path
pathsToFix.forEach(filePath => {
  console.log(`Fixing ${filePath}...`);
  
  try {
    // Read the file
    const tsconfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Determine the correct path based on the file location
    const isPackage = filePath.startsWith('packages/');
    const isApp = filePath.startsWith('apps/');
    
    if (isPackage) {
      // For packages, the path should be "../tsconfig/xxx.json"
      if (tsconfig.extends && tsconfig.extends.includes('tsconfig/')) {
        const configName = tsconfig.extends.split('/').pop();
        tsconfig.extends = `../tsconfig/${configName}`;
      }
    } else if (isApp) {
      // For apps, the path should be "../../packages/tsconfig/xxx.json"
      if (tsconfig.extends && tsconfig.extends.includes('tsconfig/')) {
        const configName = tsconfig.extends.split('/').pop();
        tsconfig.extends = `../../packages/tsconfig/${configName}`;
      }
    }
    
    // Write the file
    fs.writeFileSync(filePath, JSON.stringify(tsconfig, null, 2));
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log('Done fixing TypeScript configuration paths.'); 