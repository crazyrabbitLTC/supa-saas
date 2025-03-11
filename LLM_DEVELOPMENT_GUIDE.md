# LLM Development Guide: Expanding the Supa-SaaS Platform

This guide is designed for AI assistants to help developers expand the Supa-SaaS platform with new features. It provides a structured approach to understanding the codebase, implementing new features, and ensuring they integrate properly with the existing architecture.

## Table of Contents

1. [Understanding the Architecture](#understanding-the-architecture)
2. [Adding New Database Entities](#adding-new-database-entities)
3. [Implementing API Endpoints](#implementing-api-endpoints)
4. [Securing with Row Level Security](#securing-with-row-level-security)
5. [Testing New Features](#testing-new-features)
6. [Frontend Integration](#frontend-integration)
7. [Common Patterns and Best Practices](#common-patterns-and-best-practices)
8. [Troubleshooting Guide](#troubleshooting-guide)

## Understanding the Architecture

### Project Structure

The Supa-SaaS platform follows a monorepo structure with clear separation of concerns:

```
saas-supabase-boilerplate/
├── apps/
│   ├── web/                      # Next.js frontend
│   ├── api/                      # Fastify API service
│   └── services/                 # Background services and jobs
├── packages/
│   ├── database/                 # Database types and services
│   ├── config/                   # Shared configuration
│   └── tsconfig/                 # Shared TypeScript configs
├── scripts/                      # Utility scripts
└── supabase/                     # Supabase configuration and migrations
```

### Key Components

1. **Database Layer**: 
   - Located in `packages/database`
   - Contains service classes for database operations
   - Handles type conversions and error handling

2. **API Layer**:
   - Located in `apps/api`
   - Built with Fastify
   - Organized into controllers, routes, and plugins

3. **Authentication**:
   - Uses Supabase Auth
   - JWT-based authentication
   - Custom auth plugin in `apps/api/src/plugins/auth.ts`

4. **Row Level Security**:
   - Implemented at the database level
   - Policies defined in Supabase migrations
   - Enforces multi-tenant data isolation

## Adding New Database Entities

### Step 1: Define the Database Schema

1. Create a new migration file in `supabase/migrations`:

```sql
-- Example: Create a new 'documents' table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can read documents from teams they belong to
CREATE POLICY "Users can read documents from their teams" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = documents.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

-- Only document creator or team admins/owners can update documents
CREATE POLICY "Users can update their own documents or as admin" ON documents
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = documents.team_id 
      AND team_members.user_id = auth.uid() 
      AND team_members.role IN ('admin', 'owner')
    )
  );

-- Similar policies for INSERT and DELETE...
```

### Step 2: Generate TypeScript Types

After applying the migration, generate TypeScript types:

```bash
pnpm supabase:gen:types:local
```

### Step 3: Create a Service Class

In `packages/database/src/services`, create a new service file:

```typescript
// documentService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

interface CreateDocumentParams {
  teamId: string;
  title: string;
  content?: string;
  createdBy: string;
}

interface UpdateDocumentParams {
  id: string;
  title?: string;
  content?: string;
}

class DocumentService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  async createDocument({ teamId, title, content, createdBy }: CreateDocumentParams): Promise<Document | null> {
    const { data, error } = await this.supabase
      .from('documents')
      .insert({
        team_id: teamId,
        title,
        content,
        created_by: createdBy
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return null;
    }

    return data;
  }

  async getDocumentById(id: string): Promise<Document | null> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting document:', error);
      return null;
    }

    return data;
  }

  async getTeamDocuments(teamId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('team_id', teamId);

    if (error) {
      console.error('Error getting team documents:', error);
      return [];
    }

    return data || [];
  }

  async updateDocument({ id, title, content }: UpdateDocumentParams): Promise<Document | null> {
    const updates: DocumentUpdate = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return null;
    }

    return data;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }

    return true;
  }
}

export default DocumentService;
```

### Step 4: Export the Service

Update `packages/database/src/index.ts` to export your new service:

```typescript
// Add to existing exports
export { default as documentService } from './services/documentService';
```

## Implementing API Endpoints

### Step 1: Create a Controller

In `apps/api/src/controllers`, create a new controller file:

```typescript
// documentController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { documentService } from '@your-org/database';

// Validation schemas
const createDocumentSchema = z.object({
  teamId: z.string().uuid(),
  title: z.string().min(1).max(255),
  content: z.string().optional()
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional()
});

export class DocumentController {
  async createDocument(
    request: FastifyRequest<{ 
      Body: z.infer<typeof createDocumentSchema> 
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { teamId, title, content } = request.body;
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.code(401).send({ 
          error: 'Unauthorized',
          message: 'User not authenticated' 
        });
      }

      // Check if user is a member of the team
      const isMember = await teamService.isTeamMember(teamId, userId);
      if (!isMember) {
        return reply.code(403).send({ 
          error: 'Forbidden',
          message: 'User is not a member of this team' 
        });
      }

      const document = await documentService.createDocument({
        teamId,
        title,
        content,
        createdBy: userId
      });

      if (!document) {
        return reply.code(500).send({ 
          error: 'Internal Server Error',
          message: 'Failed to create document' 
        });
      }

      return reply.code(201).send({ data: document });
    } catch (error: any) {
      request.log.error(error, 'Error creating document');
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: error.message 
      });
    }
  }

  async getDocumentById(
    request: FastifyRequest<{ 
      Params: { id: string } 
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.code(401).send({ 
          error: 'Unauthorized',
          message: 'User not authenticated' 
        });
      }

      const document = await documentService.getDocumentById(id);
      
      if (!document) {
        return reply.code(404).send({ 
          error: 'Not Found',
          message: 'Document not found' 
        });
      }

      // Check if user is a member of the team
      const isMember = await teamService.isTeamMember(document.team_id, userId);
      if (!isMember) {
        return reply.code(403).send({ 
          error: 'Forbidden',
          message: 'User is not a member of this team' 
        });
      }

      return reply.send({ data: document });
    } catch (error: any) {
      request.log.error(error, 'Error getting document');
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: error.message 
      });
    }
  }

  // Implement other methods: getTeamDocuments, updateDocument, deleteDocument
}
```

### Step 2: Create Routes

In `apps/api/src/routes`, create a new route file:

```typescript
// documents.ts
import { FastifyPluginAsync, FastifyInstance } from 'fastify';
import { DocumentController } from '../controllers/documentController';

const documentController = new DocumentController();

export const documentRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Create a new document
  fastify.post<{
    Body: {
      teamId: string;
      title: string;
      content?: string;
    }
  }>('/documents', {
    schema: {
      body: {
        type: 'object',
        required: ['teamId', 'title'],
        properties: {
          teamId: { type: 'string', format: 'uuid' },
          title: { type: 'string', minLength: 1, maxLength: 255 },
          content: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                team_id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                content: { type: 'string' },
                created_by: { type: 'string', format: 'uuid' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: documentController.createDocument.bind(documentController)
  });

  // Get document by ID
  fastify.get<{
    Params: {
      id: string;
    }
  }>('/documents/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                team_id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                content: { type: 'string' },
                created_by: { type: 'string', format: 'uuid' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: documentController.getDocumentById.bind(documentController)
  });

  // Get team documents
  fastify.get<{
    Params: {
      teamId: string;
    }
  }>('/teams/:teamId/documents', {
    schema: {
      params: {
        type: 'object',
        required: ['teamId'],
        properties: {
          teamId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  team_id: { type: 'string', format: 'uuid' },
                  title: { type: 'string' },
                  content: { type: 'string' },
                  created_by: { type: 'string', format: 'uuid' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: documentController.getTeamDocuments.bind(documentController)
  });

  // Update document
  fastify.put<{
    Params: {
      id: string;
    },
    Body: {
      title?: string;
      content?: string;
    }
  }>('/documents/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          content: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                team_id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                content: { type: 'string' },
                created_by: { type: 'string', format: 'uuid' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: documentController.updateDocument.bind(documentController)
  });

  // Delete document
  fastify.delete<{
    Params: {
      id: string;
    }
  }>('/documents/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        204: {
          type: 'null'
        }
      }
    },
    preHandler: fastify.authenticate,
    handler: documentController.deleteDocument.bind(documentController)
  });
};
```

### Step 3: Register Routes

Update `apps/api/src/routes/index.ts` to include your new routes:

```typescript
import { documentRoutes } from './documents';

export function registerRoutes(server: FastifyInstance): void {
  // Existing code...
  
  // Register document routes
  server.register(documentRoutes, { prefix: '/api/v1' });
}
```

## Securing with Row Level Security

### Understanding RLS Patterns

The platform uses several common RLS patterns:

1. **User-based access**: `auth.uid() = user_id`
2. **Team membership**: `EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = id AND team_members.user_id = auth.uid())`
3. **Role-based access**: `team_members.role IN ('owner', 'admin')`

### Implementing RLS for New Entities

1. Always enable RLS on new tables:
   ```sql
   ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
   ```

2. Create appropriate policies:
   ```sql
   -- Read policy
   CREATE POLICY "Read policy name" ON your_table
     FOR SELECT USING (condition);
   
   -- Insert policy
   CREATE POLICY "Insert policy name" ON your_table
     FOR INSERT WITH CHECK (condition);
   
   -- Update policy
   CREATE POLICY "Update policy name" ON your_table
     FOR UPDATE USING (condition);
   
   -- Delete policy
   CREATE POLICY "Delete policy name" ON your_table
     FOR DELETE USING (condition);
   ```

3. Always include a service role bypass:
   ```sql
   CREATE POLICY "Service role can do all" ON your_table
     USING (auth.role() = 'service_role');
   ```

## Testing New Features

### Step 1: Create Integration Tests

In `apps/api/src/__tests__/integration`, create a new test file:

```typescript
// documents.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { SuperTest, Test } from 'supertest';
import { initTestServer } from '../helpers/testUtils';

describe('Document Endpoints', () => {
  let server: FastifyInstance;
  let request: SuperTest<Test>;
  let auth: {
    getAuthHeader: (userId: string) => Promise<{ Authorization: string }>;
    createTestUser: any;
  };
  let cleanup: (ids: { teamIds?: string[]; userIds?: string[] }) => Promise<void>;
  
  // Test data
  let userId: string;
  let teamId: string;
  let documentId: string;
  
  beforeAll(async () => {
    // Initialize test server
    const testServer = await initTestServer();
    server = testServer.server;
    request = testServer.request;
    auth = testServer.auth;
    cleanup = testServer.cleanup;
    
    // Create test user
    const user = await auth.createTestUser();
    userId = user.id;
    
    // Create test team
    const teamResponse = await request
      .post('/api/v1/teams')
      .set(await auth.getAuthHeader(userId))
      .send({
        name: `test-team-${Date.now()}`,
        isPersonal: false
      });
    
    teamId = teamResponse.body.data.id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await cleanup({
      teamIds: [teamId],
      userIds: [userId]
    });
    
    // Close server
    await server.close();
  });
  
  describe('POST /api/v1/documents', () => {
    it('should create a new document', async () => {
      const response = await request
        .post('/api/v1/documents')
        .set(await auth.getAuthHeader(userId))
        .send({
          teamId,
          title: 'Test Document',
          content: 'This is a test document'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Test Document');
      expect(response.body.data.content).toBe('This is a test document');
      expect(response.body.data.team_id).toBe(teamId);
      expect(response.body.data.created_by).toBe(userId);
      
      // Save document ID for later tests
      documentId = response.body.data.id;
    });
    
    it('should return 401 if not authenticated', async () => {
      const response = await request
        .post('/api/v1/documents')
        .send({
          teamId,
          title: 'Unauthorized Document',
          content: 'This should fail'
        });
      
      expect(response.status).toBe(401);
    });
    
    // Add more tests...
  });
  
  describe('GET /api/v1/documents/:id', () => {
    it('should return document by ID', async () => {
      const response = await request
        .get(`/api/v1/documents/${documentId}`)
        .set(await auth.getAuthHeader(userId));
      
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(documentId);
      expect(response.body.data.title).toBe('Test Document');
    });
    
    // Add more tests...
  });
  
  // Add tests for other endpoints...
});
```

### Step 2: Run Tests

```bash
cd apps/api
NODE_ENV=test npx vitest run src/__tests__/integration/documents.test.ts
```

## Frontend Integration

### Step 1: Create API Client

In your frontend application, create a client for your new API endpoints:

```typescript
// apps/web/src/api/documents.ts
import { apiClient } from './client';

export interface Document {
  id: string;
  teamId: string;
  title: string;
  content?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentParams {
  teamId: string;
  title: string;
  content?: string;
}

export interface UpdateDocumentParams {
  title?: string;
  content?: string;
}

export const documentsApi = {
  async createDocument(params: CreateDocumentParams): Promise<Document> {
    const response = await apiClient.post('/documents', params);
    return response.data.data;
  },
  
  async getDocumentById(id: string): Promise<Document> {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data.data;
  },
  
  async getTeamDocuments(teamId: string): Promise<Document[]> {
    const response = await apiClient.get(`/teams/${teamId}/documents`);
    return response.data.data;
  },
  
  async updateDocument(id: string, params: UpdateDocumentParams): Promise<Document> {
    const response = await apiClient.put(`/documents/${id}`, params);
    return response.data.data;
  },
  
  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  }
};
```

### Step 2: Create React Components

Create components to interact with your new API:

```tsx
// apps/web/src/components/documents/DocumentList.tsx
import React, { useEffect, useState } from 'react';
import { documentsApi, Document } from '../../api/documents';
import { useTeam } from '../../hooks/useTeam';

export const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentTeam } = useTeam();
  
  useEffect(() => {
    if (!currentTeam) return;
    
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const data = await documentsApi.getTeamDocuments(currentTeam.id);
        setDocuments(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [currentTeam]);
  
  if (!currentTeam) {
    return <div>Please select a team</div>;
  }
  
  if (loading) {
    return <div>Loading documents...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return (
    <div>
      <h2>Team Documents</h2>
      {documents.length === 0 ? (
        <p>No documents found</p>
      ) : (
        <ul>
          {documents.map(doc => (
            <li key={doc.id}>
              <a href={`/documents/${doc.id}`}>{doc.title}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

## Common Patterns and Best Practices

### 1. Response Format

Always follow the established response format:

```typescript
// Success response
return reply.send({ data: result });

// Error response
return reply.code(statusCode).send({ 
  error: 'Error Type',
  message: 'Detailed error message' 
});
```

### 2. Authentication and Authorization

Always use the authentication middleware:

```typescript
fastify.route({
  // ...
  preHandler: fastify.authenticate,
  handler: yourHandler
});
```

Check for proper authorization in your handlers:

```typescript
// Team membership check
const isMember = await teamService.isTeamMember(teamId, userId);
if (!isMember) {
  return reply.code(403).send({ 
    error: 'Forbidden',
    message: 'User is not a member of this team' 
  });
}

// Role check
const hasRole = await teamService.hasTeamRole(teamId, userId, 'admin');
if (!hasRole) {
  return reply.code(403).send({ 
    error: 'Forbidden',
    message: 'User does not have required role' 
  });
}
```

### 3. Error Handling

Use try/catch blocks in all handlers:

```typescript
try {
  // Your code
} catch (error: any) {
  request.log.error(error, 'Error message');
  return reply.code(500).send({ 
    error: 'Internal Server Error',
    message: error.message 
  });
}
```

### 4. Validation

Use Zod schemas for validation:

```typescript
const schema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  age: z.number().int().positive().optional()
});

const result = schema.safeParse(data);
if (!result.success) {
  // Handle validation error
}
```

## Troubleshooting Guide

### Database Issues

1. **RLS Policy Blocking Access**:
   - Check if the user has the correct role
   - Verify RLS policies are correctly defined
   - Use the service role for debugging

2. **Type Errors**:
   - Regenerate types with `pnpm supabase:gen:types:local`
   - Check for mismatches between camelCase and snake_case

### API Issues

1. **Authentication Failures**:
   - Check JWT token expiration
   - Verify the auth plugin is correctly registered
   - Ensure `fastify.authenticate` is used as preHandler

2. **Route Not Found**:
   - Verify route registration in `routes/index.ts`
   - Check for typos in route paths
   - Ensure prefix is correctly applied

### Testing Issues

1. **Test Database Setup**:
   - Verify Supabase is running locally
   - Check environment variables are correctly set
   - Ensure test database is properly initialized

2. **Test Failures**:
   - Use `LOG_LEVEL=debug` for detailed logs
   - Check for race conditions in test setup/teardown
   - Verify test data is properly cleaned up between tests 