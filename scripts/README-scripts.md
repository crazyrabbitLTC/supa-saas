# Scripts

This directory contains utility scripts for development, deployment, and maintenance.

## Purpose

The scripts directory is intended for:
- Development utilities
- Deployment scripts
- Database management scripts
- CI/CD helpers
- Environment setup scripts

## Adding a New Script

1. Create a new script file with a descriptive name
2. Add a comment header explaining the purpose of the script
3. Make the script executable if needed (`chmod +x script.sh`)
4. Document the script in this README

## Conventions

- Scripts should be well-documented with comments
- Include usage examples in script headers
- Use appropriate shebang lines (e.g., `#!/usr/bin/env node` for Node.js scripts)
- Handle errors gracefully
- Provide meaningful exit codes
- Use environment variables for configuration when appropriate 