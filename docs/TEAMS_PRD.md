# Teams Feature: Product Requirements Document

## Overview

This feature will implement team-based access management for the SaaS-Supabase Boilerplate, allowing users to create and join teams, manage team members, and assign different permission levels through roles. We'll leverage Supabase's native authentication, Row Level Security (RLS) policies, and other built-in features to implement this securely and effectively.

## Goals

- Enable users to create and manage teams
- Automatically create a personal team for each user upon registration
- Allow users to be members of multiple teams
- Implement team-based access control with different roles
- Support team and individual subscription plans with limits
- Provide flexible invitation methods (email and links)
- Leverage Supabase's auth and RLS for security
- Design for future extensibility of the role system

## User Stories

1. As a new user, I want a personal team created automatically when I register
2. As a user, I want to create new teams and become their owner
3. As a team owner, I want to invite people to my team via email or invitation link
4. As a team owner, I want to manage team members and their roles
5. As a team owner, I want to upgrade my team's subscription plan
6. As a user, I want to accept invitations to join teams
7. As a user, I want to view all teams I belong to
8. As a user, I want to switch between teams
9. As a team admin, I want to manage team settings and members

## Database Schema Design

### Tables

1. **teams**
   - `id`: uuid (primary key)
   - `name`: text (required)
   - `slug`: text (unique identifier for the team)
   - `description`: text
   - `logo_url`: text (URL to team's logo)
   - `is_personal`: boolean (indicates if this is a user's personal team)
   - `personal_user_id`: uuid (foreign key to auth.users.id, only set for personal teams)
   - `subscription_tier`: text (enum: 'free', 'basic', 'pro', 'enterprise')
   - `subscription_id`: text (ID from payment provider)
   - `max_members`: integer (limit based on subscription tier)
   - `metadata`: jsonb (flexible field for future extensions)
   - `created_at`: timestamp with time zone
   - `updated_at`: timestamp with time zone

2. **team_members**
   - `id`: uuid (primary key)
   - `team_id`: uuid (foreign key to teams.id)
   - `user_id`: uuid (foreign key to auth.users.id)
   - `role`: text (enum: 'owner', 'admin', 'member')
   - `created_at`: timestamp with time zone
   - `updated_at`: timestamp with time zone
   - Unique constraint on (team_id, user_id)

3. **team_invitations**
   - `id`: uuid (primary key)
   - `team_id`: uuid (foreign key to teams.id)
   - `email`: text (email of the person being invited)
   - `role`: text (the role they will have when accepting)
   - `token`: uuid (unique token for the invitation link)
   - `created_by`: uuid (foreign key to auth.users.id)
   - `expires_at`: timestamp with time zone
   - `created_at`: timestamp with time zone
   - Unique constraint on (team_id, email)

4. **team_analytics** (optional)
   - `id`: uuid (primary key)
   - `team_id`: uuid (foreign key to teams.id)
   - `month`: date (year and month)
   - `active_users`: integer (count of active users)
   - `resource_usage`: jsonb (usage metrics for different resources)
   - `created_at`: timestamp with time zone
   - `updated_at`: timestamp with time zone

5. **subscription_tiers** (for plan definitions)
   - `id`: uuid (primary key)
   - `name`: text (e.g., 'free', 'basic', 'pro', 'enterprise')
   - `max_members`: integer
   - `max_resources`: jsonb (limits for various resources)
   - `price_monthly`: integer (in cents)
   - `price_yearly`: integer (in cents)
   - `features`: jsonb (features included in this tier)
   - `is_team_plan`: boolean (whether this is a team or individual plan)
   - `created_at`: timestamp with time zone
   - `updated_at`: timestamp with time zone

### Functions and Triggers

1. **Create Personal Team Function**
   - Automatically create a personal team when a user registers
   - Set the `is_personal` flag to true
   - Add the user as the owner

2. **Team Member Count Validation**
   - Validate that adding a new member doesn't exceed the team's `max_members` limit
   - Only apply this to non-personal teams

3. **Ensure Team Owner Trigger**
   - Prevent removing the last owner from a team
   - Ensure personal teams always have exactly one owner

### RLS Policies

1. **teams table**
   - Users can view teams they are members of
   - Only team owners can update team details
   - Only authenticated users can create teams
   - Only team owners can delete non-personal teams
   - Personal teams cannot be deleted

2. **team_members table**
   - Users can view members of teams they belong to
   - Team owners and admins can add members (subject to subscription limits)
   - Team owners can change roles of members (except their own owner role)
   - Team admins can change roles of members (except owner and admin roles)
   - Personal team membership cannot be modified

3. **team_invitations table**
   - Team owners and admins can create invitations
   - Team owners and admins can view/manage invitations for their teams
   - Anyone can accept an invitation with the correct token

4. **subscription_tiers table**
   - Anyone can view subscription tiers
   - Only system admins can modify subscription tiers

## Implementation Details

### Role System

The initial implementation will include three roles:
- **Owner**: Full control over the team, including billing and deletion
- **Admin**: Can manage team settings and members, but cannot delete the team or change billing
- **Member**: Basic access to team resources

The role system will be implemented using a simple enum type in the `team_members` table. This approach allows for easy extension in the future by adding new values to the enum.

### Team Creation Flow

1. When a user registers, a personal team is automatically created
2. Users can create additional teams from the UI
3. When creating a team, the user becomes the owner
4. New teams start on the free plan with appropriate limits

### Invitation System

Two methods for inviting users:
1. **Email Invitations**:
   - Send an email with a unique link containing the invitation token
   - When clicked, direct to the app with the token to accept

2. **Invitation Links**:
   - Generate a unique link with the invitation token
   - The link can be shared manually by the team owner/admin

### Subscription and Billing

1. Both teams and individual users can have subscription plans
2. Team plans apply to the entire team and set limits like maximum members
3. Individual plans apply to the user across all teams they're part of
4. Plans define resource limits and feature access

### Team Analytics (Optional)

Team analytics could track:
- Active user counts per team
- Resource usage (storage, API calls, etc.)
- Feature utilization
- Collaboration metrics (if applicable)

These analytics could be used for:
- Reporting to team owners/admins
- Billing based on usage
- Identifying opportunities for plan upgrades
- Improving team collaboration

## API Endpoints

### Teams Management

- `POST /api/teams` - Create a new team
- `GET /api/teams` - List teams the user is a member of
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team details
- `DELETE /api/teams/:id` - Delete a team (non-personal only)
- `GET /api/teams/current` - Get the currently active team
- `POST /api/teams/switch/:id` - Switch the active team

### Team Membership

- `GET /api/teams/:id/members` - List team members
- `POST /api/teams/:id/members` - Add a member to the team
- `PUT /api/teams/:id/members/:userId` - Update member role
- `DELETE /api/teams/:id/members/:userId` - Remove a member

### Team Invitations

- `POST /api/teams/:id/invitations` - Create an invitation
- `GET /api/teams/:id/invitations` - List pending invitations
- `GET /api/invitations/:token` - Verify an invitation
- `POST /api/invitations/:token/accept` - Accept an invitation
- `DELETE /api/invitations/:id` - Delete an invitation

### Subscriptions

- `GET /api/subscription-tiers` - List available subscription tiers
- `POST /api/teams/:id/subscription` - Update team subscription
- `GET /api/teams/:id/subscription` - Get team subscription details

## Frontend Components

### Page Components

1. **Team Dashboard**
   - Overview of the team
   - Quick access to team settings and members
   - Team activity feed (if applicable)

2. **Team Settings**
   - Update team name, description, logo
   - Manage subscription plan
   - Advanced team settings

3. **Team Members**
   - List of all team members with roles
   - Interface for managing roles
   - Member removal functionality

4. **Team Invitations**
   - Create and manage invitations
   - View pending invitations
   - Resend or delete invitations

5. **Team Switcher**
   - UI component for switching between teams
   - Create new team option
   - Indication of the current active team

### Reusable Components

1. **InviteMemberForm** - Form for inviting new members
2. **TeamMemberList** - List of team members with role management
3. **TeamSelector** - Dropdown for changing active team
4. **SubscriptionPlanSelector** - UI for selecting and updating plans
5. **RolePermissionBadge** - Visual indicator of user's role/permissions

## Implementation Plan

### Phase 1: Database Setup (1-2 weeks)
1. Create migration file for the new tables
2. Set up RLS policies
3. Create database triggers for managing team ownership and auto-creating personal teams
4. Implement subscription tier constraints
5. Generate TypeScript types

### Phase 2: Backend Services (2-3 weeks)
1. Create team service for team CRUD operations
2. Implement team membership management with role-based access control
3. Build invitation system with both email and link-based invitations
4. Implement subscription management
5. Create team analytics service (if desired)

### Phase 3: API Layer (1-2 weeks)
1. Implement API endpoints for team management
2. Add API endpoints for team membership
3. Create API endpoints for invitations
4. Develop subscription management endpoints
5. Add validation and error handling

### Phase 4: Frontend Components (2-3 weeks)
1. Create team creation and management UI
2. Build team members management interface
3. Implement invitation system UI
4. Add team switching functionality
5. Develop subscription management interface

### Phase 5: Testing and Documentation (1-2 weeks)
1. Write comprehensive tests for all components
2. Create documentation for the teams feature
3. Add examples for integrating team-scoped resources
4. Develop migration guide for adding teams to existing applications

## Supporting Team-Scoped Resources

To make a resource team-scoped, follow these guidelines:

1. **Database Schema**:
   - Add a `team_id` column to the resource table
   - Create a foreign key relationship to the `teams` table
   - Set up RLS policies that check team membership and roles

2. **RLS Policy Pattern**:
   ```sql
   CREATE POLICY "Team members can view resources" ON "public"."resource_table"
   FOR SELECT USING (
     team_id IN (
       SELECT team_id FROM team_members WHERE user_id = auth.uid()
     )
   );

   CREATE POLICY "Team owners and admins can edit resources" ON "public"."resource_table"
   FOR UPDATE USING (
     team_id IN (
       SELECT team_id FROM team_members 
       WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
     )
   );
   ```

3. **API Access**:
   - Include team context in API calls
   - Verify team membership and appropriate role in API handlers
   - Use the current active team as the default context

4. **Frontend Integration**:
   - Display resources in the context of the current team
   - Provide UI for switching between teams
   - Show appropriate actions based on user's role in the team

## Future Extensions

1. **Custom Roles**: Extend the role system to support custom-defined roles with granular permissions
2. **Team Hierarchy**: Add support for departments or sub-teams within a team
3. **Resource Sharing**: Allow sharing resources between teams
4. **Advanced Analytics**: Enhanced team usage analytics and reporting
5. **Multi-Factor Authentication**: Team-enforced security policies

## Success Metrics

1. User adoption of team features
2. Team creation and growth rates
3. Invitation acceptance rates
4. Upgrade rates to paid team plans
5. Active users per team 