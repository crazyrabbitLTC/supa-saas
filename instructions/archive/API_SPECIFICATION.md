# Supa-SaaS API Specification

## Overview

This document provides a comprehensive specification of the Supa-SaaS platform API. The API is built on Fastify and provides endpoints for managing users, teams, team members, invitations, and subscription tiers.

## Authentication

The API uses JWT-based authentication via Supabase Auth. All authenticated endpoints require a valid JWT token in the `Authorization` header with the format `Bearer {token}`.

Authentication is enforced through the `fastify.authenticate` middleware, which validates the JWT token and attaches the user information to the request object.

## API Base URL

All API endpoints are prefixed with `/api/v1`.

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "data": {
    // Response data varies by endpoint
  }
}
```

### Error Response

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## API Endpoints

### Health Endpoints

#### GET /

Health check endpoint that returns a simple status.

**Response (200)**
```json
{
  "status": "ok"
}
```

#### GET /detailed

Detailed health check that includes information about the system.

**Response (200)**
```json
{
  "status": "ok",
  "timestamp": "2023-05-12T12:00:00.000Z",
  "version": "0.1.0",
  "uptime": 1234
}
```

### Profile Endpoints

#### GET /api/v1/profiles/me

Retrieves the current user's profile.

**Authentication**: Required

**Response (200)**
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "email": "john@example.com",
    "createdAt": "2023-05-12T12:00:00.000Z",
    "updatedAt": "2023-05-12T12:00:00.000Z"
  }
}
```

#### GET /api/v1/profiles/:id

Retrieves a profile by ID.

**Authentication**: Required

**Parameters**:
- `id`: Profile ID (UUID)

**Response (200)**
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "email": "john@example.com",
    "createdAt": "2023-05-12T12:00:00.000Z",
    "updatedAt": "2023-05-12T12:00:00.000Z"
  }
}
```

#### PATCH /api/v1/profiles/:id

Updates a profile.

**Authentication**: Required (can only update own profile)

**Parameters**:
- `id`: Profile ID (UUID)

**Request Body**:
```json
{
  "fullName": "New Name",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Response (200)**
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "New Name",
    "avatarUrl": "https://example.com/new-avatar.jpg",
    "email": "john@example.com",
    "createdAt": "2023-05-12T12:00:00.000Z",
    "updatedAt": "2023-05-12T12:00:00.000Z"
  }
}
```

### Team Endpoints

#### GET /api/v1/teams

Lists all teams the authenticated user is a member of.

**Authentication**: Required

**Response (200)**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Team 1",
      "slug": "team-1",
      "description": "Description of Team 1",
      "logoUrl": "https://example.com/logo.jpg",
      "isPersonal": false,
      "personalUserId": null,
      "subscriptionTier": "free",
      "subscriptionId": null,
      "maxMembers": 5,
      "metadata": {},
      "createdAt": "2023-05-12T12:00:00.000Z",
      "updatedAt": "2023-05-12T12:00:00.000Z"
    }
  ]
}
```

#### POST /api/v1/teams

Creates a new team.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "New Team",
  "description": "Description of New Team",
  "logoUrl": "https://example.com/logo.jpg",
  "isPersonal": false
}
```

**Response (201)**
```json
{
  "data": {
    "id": "uuid",
    "name": "New Team",
    "slug": "new-team",
    "description": "Description of New Team",
    "logoUrl": "https://example.com/logo.jpg",
    "isPersonal": false,
    "personalUserId": null,
    "subscriptionTier": "free",
    "subscriptionId": null,
    "maxMembers": 5,
    "metadata": {},
    "createdAt": "2023-05-12T12:00:00.000Z",
    "updatedAt": "2023-05-12T12:00:00.000Z"
  }
}
```

#### GET /api/v1/teams/:id

Retrieves a team by ID.

**Authentication**: Required (must be a team member)

**Parameters**:
- `id`: Team ID (UUID)

**Response (200)**
```json
{
  "data": {
    "id": "uuid",
    "name": "Team Name",
    "slug": "team-name",
    "description": "Description of Team",
    "logoUrl": "https://example.com/logo.jpg",
    "isPersonal": false,
    "personalUserId": null,
    "subscriptionTier": "free",
    "subscriptionId": null,
    "maxMembers": 5,
    "metadata": {},
    "createdAt": "2023-05-12T12:00:00.000Z",
    "updatedAt": "2023-05-12T12:00:00.000Z"
  }
}
```

#### PUT /api/v1/teams/:id

Updates a team.

**Authentication**: Required (must be a team owner or admin)

**Parameters**:
- `id`: Team ID (UUID)

**Request Body**:
```json
{
  "name": "Updated Team Name",
  "description": "Updated Description",
  "logoUrl": "https://example.com/new-logo.jpg"
}
```

**Response (200)**
```json
{
  "data": {
    "id": "uuid",
    "name": "Updated Team Name",
    "slug": "updated-team-name",
    "description": "Updated Description",
    "logoUrl": "https://example.com/new-logo.jpg",
    "isPersonal": false,
    "personalUserId": null,
    "subscriptionTier": "free",
    "subscriptionId": null,
    "maxMembers": 5,
    "metadata": {},
    "createdAt": "2023-05-12T12:00:00.000Z",
    "updatedAt": "2023-05-12T12:00:00.000Z"
  }
}
```

#### DELETE /api/v1/teams/:id

Deletes a team.

**Authentication**: Required (must be a team owner)

**Parameters**:
- `id`: Team ID (UUID)

**Response (200)**
```json
{
  "data": {
    "success": true
  }
}
```

### Team Members Endpoints

#### GET /api/v1/teams/:id/members

Lists all members of a team.

**Authentication**: Required (must be a team member)

**Parameters**:
- `id`: Team ID (UUID)

**Response (200)**
```json
{
  "data": [
    {
      "id": "uuid",
      "teamId": "uuid",
      "userId": "uuid",
      "role": "owner",
      "createdAt": "2023-05-12T12:00:00.000Z",
      "updatedAt": "2023-05-12T12:00:00.000Z",
      "user": {
        "id": "uuid",
        "fullName": "John Doe",
        "email": "john@example.com",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  ]
}
```

#### POST /api/v1/teams/:id/members

Adds a user to a team directly (without invitation).

**Authentication**: Required (must be a team owner or admin)

**Parameters**:
- `id`: Team ID (UUID)

**Request Body**:
```json
{
  "userId": "uuid",
  "role": "member"
}
```

**Response (201)**
```json
{
  "data": {
    "id": "uuid",
    "teamId": "uuid",
    "userId": "uuid",
    "role": "member",
    "createdAt": "2023-05-12T12:00:00.000Z",
    "updatedAt": "2023-05-12T12:00:00.000Z"
  }
}
```

#### PUT /api/v1/teams/:id/members/:userId

Updates a team member's role.

**Authentication**: Required (must be a team owner, or admin for non-owner updates)

**Parameters**:
- `id`: Team ID (UUID)
- `userId`: User ID (UUID)

**Request Body**:
```json
{
  "role": "admin"
}
```

**Response (200)**
```json
{
  "data": {
    "id": "uuid",
    "teamId": "uuid",
    "userId": "uuid",
    "role": "admin",
    "createdAt": "2023-05-12T12:00:00.000Z",
    "updatedAt": "2023-05-12T12:00:00.000Z"
  }
}
```

#### DELETE /api/v1/teams/:id/members/:userId

Removes a member from a team.

**Authentication**: Required (must be a team owner or admin)

**Parameters**:
- `id`: Team ID (UUID)
- `userId`: User ID (UUID)

**Response (200)**
```json
{
  "data": {
    "success": true
  }
}
```

### Team Invitations Endpoints

#### POST /api/v1/teams/:id/invitations

Creates an invitation to join a team.

**Authentication**: Required (must be a team owner or admin)

**Parameters**:
- `id`: Team ID (UUID)

**Request Body**:
```json
{
  "email": "user@example.com",
  "role": "member"
}
```

**Response (201)**
```json
{
  "data": {
    "id": "uuid",
    "teamId": "uuid",
    "email": "user@example.com",
    "token": "invitation-token",
    "role": "member",
    "expiresAt": "2023-05-19T12:00:00.000Z",
    "createdBy": "uuid",
    "createdAt": "2023-05-12T12:00:00.000Z",
    "updatedAt": "2023-05-12T12:00:00.000Z"
  }
}
```

#### GET /api/v1/teams/:id/invitations

Lists all invitations for a team.

**Authentication**: Required (must be a team owner or admin)

**Parameters**:
- `id`: Team ID (UUID)

**Response (200)**
```json
{
  "data": [
    {
      "id": "uuid",
      "teamId": "uuid",
      "email": "user@example.com",
      "token": "invitation-token",
      "role": "member",
      "expiresAt": "2023-05-19T12:00:00.000Z",
      "createdBy": "uuid",
      "createdAt": "2023-05-12T12:00:00.000Z",
      "updatedAt": "2023-05-12T12:00:00.000Z",
      "creator": {
        "id": "uuid",
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

#### DELETE /api/v1/teams/:id/invitations/:invitationId

Deletes an invitation.

**Authentication**: Required (must be a team owner or admin)

**Parameters**:
- `id`: Team ID (UUID)
- `invitationId`: Invitation ID (UUID)

**Response (200)**
```json
{
  "data": {
    "success": true
  }
}
```

#### GET /api/v1/invitations/:token

Verifies an invitation token and returns details.

**Authentication**: Required

**Parameters**:
- `token`: Invitation token (string)

**Response (200)**
```json
{
  "data": {
    "invitation": {
      "id": "uuid",
      "teamId": "uuid",
      "email": "user@example.com",
      "token": "invitation-token",
      "role": "member",
      "expiresAt": "2023-05-19T12:00:00.000Z",
      "createdBy": "uuid",
      "createdAt": "2023-05-12T12:00:00.000Z",
      "updatedAt": "2023-05-12T12:00:00.000Z"
    },
    "team": {
      "id": "uuid",
      "name": "Team Name",
      "slug": "team-name",
      "description": "Description of Team",
      "logoUrl": "https://example.com/logo.jpg"
    },
    "creator": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### POST /api/v1/invitations/:token/accept

Accepts an invitation to join a team.

**Authentication**: Required

**Parameters**:
- `token`: Invitation token (string)

**Response (200)**
```json
{
  "data": {
    "teamId": "uuid",
    "membership": {
      "id": "uuid",
      "teamId": "uuid",
      "userId": "uuid",
      "role": "member",
      "createdAt": "2023-05-12T12:00:00.000Z",
      "updatedAt": "2023-05-12T12:00:00.000Z"
    }
  }
}
```

### Subscription Endpoints

#### GET /api/v1/teams/subscription-tiers

Lists all available subscription tiers.

**Authentication**: Required

**Response (200)**
```json
{
  "data": [
    {
      "id": "free",
      "name": "Free",
      "maxMembers": 5,
      "priceMonthly": 0,
      "priceYearly": 0,
      "features": ["Basic collaboration", "Up to 5 members"],
      "isTeamPlan": true
    },
    {
      "id": "basic",
      "name": "Basic",
      "maxMembers": 10,
      "priceMonthly": 9.99,
      "priceYearly": 99.99,
      "features": ["Enhanced collaboration", "Up to 10 members", "Advanced features"],
      "isTeamPlan": true
    },
    {
      "id": "pro",
      "name": "Professional",
      "maxMembers": 20,
      "priceMonthly": 19.99,
      "priceYearly": 199.99,
      "features": ["Premium collaboration", "Up to 20 members", "All features"],
      "isTeamPlan": true
    }
  ]
}
```

#### GET /api/v1/teams/:id/subscription

Retrieves the subscription details for a team.

**Authentication**: Required (must be a team member)

**Parameters**:
- `id`: Team ID (UUID)

**Response (200)**
```json
{
  "data": {
    "subscriptionTier": "free",
    "subscriptionId": null,
    "maxMembers": 5,
    "tierDetails": {
      "id": "free",
      "name": "Free",
      "maxMembers": 5,
      "priceMonthly": 0,
      "priceYearly": 0,
      "features": ["Basic collaboration", "Up to 5 members"],
      "isTeamPlan": true
    }
  }
}
```

#### PUT /api/v1/teams/:id/subscription

Updates a team's subscription tier.

**Authentication**: Required (must be a team owner)

**Parameters**:
- `id`: Team ID (UUID)

**Request Body**:
```json
{
  "subscriptionTier": "basic",
  "subscriptionId": "stripe-subscription-id" // Optional
}
```

**Response (200)**
```json
{
  "data": {
    "id": "uuid",
    "name": "Team Name",
    "subscriptionTier": "basic",
    "subscriptionId": "stripe-subscription-id",
    "maxMembers": 10,
    "updatedAt": "2023-05-12T12:00:00.000Z"
  }
}
```

## Data Models

### User

Represents a user in the system. The user data is managed through Supabase Auth.

- `id`: UUID
- `email`: String
- `emailVerified`: Boolean
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Profile

Represents a user's profile information.

- `id`: UUID
- `userId`: UUID (references User)
- `fullName`: String
- `avatarUrl`: String (optional)
- `email`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Team

Represents a team or organization.

- `id`: UUID
- `name`: String
- `slug`: String
- `description`: String (optional)
- `logoUrl`: String (optional)
- `isPersonal`: Boolean
- `personalUserId`: UUID (optional, references User)
- `subscriptionTier`: Enum ('free', 'basic', 'pro', 'enterprise')
- `subscriptionId`: String (optional)
- `maxMembers`: Integer
- `metadata`: JSON (optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### TeamMember

Represents a user's membership in a team.

- `id`: UUID
- `teamId`: UUID (references Team)
- `userId`: UUID (references User)
- `role`: Enum ('owner', 'admin', 'member')
- `createdAt`: DateTime
- `updatedAt`: DateTime

### TeamInvitation

Represents an invitation for a user to join a team.

- `id`: UUID
- `teamId`: UUID (references Team)
- `email`: String
- `token`: String
- `role`: Enum ('owner', 'admin', 'member')
- `expiresAt`: DateTime
- `createdBy`: UUID (references User)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### SubscriptionTier

Represents a subscription tier available for teams.

- `id`: String ('free', 'basic', 'pro', 'enterprise')
- `name`: String
- `maxMembers`: Integer
- `priceMonthly`: Float
- `priceYearly`: Float
- `features`: Array of String
- `isTeamPlan`: Boolean

## Row Level Security (RLS)

The system uses Supabase's Row Level Security to enforce data access controls at the database level:

1. **Profiles**: Users can only access their own profile data
2. **Teams**: Users can only access teams they are members of
3. **TeamMembers**: Access to member information is restricted to team members
4. **TeamInvitations**: Access to invitations is restricted to team admins/owners and the invited user

For detailed information about the RLS implementation, see [SUPABASE_RLS.md](../SUPABASE_RLS.md). 