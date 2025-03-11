# Supabase Row Level Security (RLS) Setup

## Overview

This document outlines the Row Level Security (RLS) implementation in our Supabase database. RLS ensures that users can only access data they are authorized to see, providing a secure foundation for our multi-tenant SaaS application.

## RLS Policies

### Users Table

| Policy Name | Operation | Definition |
|-------------|-----------|------------|
| Users can read their own data | SELECT | `auth.uid() = id` |
| Users can update their own data | UPDATE | `auth.uid() = id` |
| Service role can manage all users | ALL | `auth.role() = 'service_role'` |

### Profiles Table

| Policy Name | Operation | Definition |
|-------------|-----------|------------|
| Users can read their own profile | SELECT | `auth.uid() = user_id` |
| Users can update their own profile | UPDATE | `auth.uid() = user_id` |
| Service role can manage all profiles | ALL | `auth.role() = 'service_role'` |

### Teams Table

| Policy Name | Operation | Definition |
|-------------|-----------|------------|
| Users can read teams they are members of | SELECT | `EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = id AND team_members.user_id = auth.uid())` |
| Users can create teams | INSERT | `auth.uid() IS NOT NULL` |
| Owners can update their teams | UPDATE | `EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = id AND team_members.user_id = auth.uid() AND team_members.role = 'owner')` |
| Admins can update their teams | UPDATE | `EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = id AND team_members.user_id = auth.uid() AND team_members.role IN ('owner', 'admin'))` |
| Owners can delete their teams | DELETE | `EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = id AND team_members.user_id = auth.uid() AND team_members.role = 'owner')` |
| Service role can manage all teams | ALL | `auth.role() = 'service_role'` |

### Team Members Table

| Policy Name | Operation | Definition |
|-------------|-----------|------------|
| Users can read members of teams they belong to | SELECT | `EXISTS (SELECT 1 FROM team_members AS tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid())` |
| Users can add themselves to teams via invitations | INSERT | `user_id = auth.uid() AND EXISTS (SELECT 1 FROM team_invitations WHERE team_invitations.team_id = team_id AND team_invitations.email = (SELECT email FROM users WHERE users.id = auth.uid()))` |
| Owners/admins can add members to their teams | INSERT | `EXISTS (SELECT 1 FROM team_members AS tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))` |
| Owners can update member roles | UPDATE | `EXISTS (SELECT 1 FROM team_members AS tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid() AND tm.role = 'owner')` |
| Admins can update non-owner member roles | UPDATE | `EXISTS (SELECT 1 FROM team_members AS tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid() AND tm.role = 'admin') AND NOT EXISTS (SELECT 1 FROM team_members AS tm2 WHERE tm2.id = id AND tm2.role = 'owner')` |
| Owners/admins can remove members | DELETE | `EXISTS (SELECT 1 FROM team_members AS tm WHERE tm.team_id = team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')) AND NOT (user_id = auth.uid() AND role = 'owner')` |
| Service role can manage all team members | ALL | `auth.role() = 'service_role'` |

### Team Invitations Table

| Policy Name | Operation | Definition |
|-------------|-----------|------------|
| Users can read invitations for teams they manage | SELECT | `EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_id AND team_members.user_id = auth.uid() AND team_members.role IN ('owner', 'admin'))` |
| Users can read invitations sent to their email | SELECT | `email = (SELECT email FROM users WHERE users.id = auth.uid())` |
| Owners/admins can create invitations | INSERT | `EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_id AND team_members.user_id = auth.uid() AND team_members.role IN ('owner', 'admin'))` |
| Owners/admins can delete invitations | DELETE | `EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_id AND team_members.user_id = auth.uid() AND team_members.role IN ('owner', 'admin'))` |
| Users can delete invitations sent to them | DELETE | `email = (SELECT email FROM users WHERE users.id = auth.uid())` |
| Service role can manage all invitations | ALL | `auth.role() = 'service_role'` |

## Implementation Details

### Service vs. Client Access

- **Service Role**: Our backend API uses the service role to bypass RLS when necessary for administrative functions
- **Client Access**: Frontend applications use the anon key and are subject to RLS policies

### Authentication Flow

1. User authenticates with Supabase Auth
2. JWT token is issued containing the user's ID
3. Subsequent requests include this token
4. Supabase RLS policies use `auth.uid()` to enforce access control

### Testing RLS

We've implemented comprehensive tests to verify that:

- Users cannot access data from teams they don't belong to
- Regular members cannot perform admin/owner actions
- Admins cannot modify owner accounts
- Owners have full control over their teams

## Conclusion

Our RLS implementation provides a secure foundation for the multi-tenant architecture of our SaaS application. By enforcing access control at the database level, we ensure that even if there are bugs in our application code, unauthorized data access is prevented.

The combination of Supabase RLS with our API's additional authorization checks provides defense in depth, making our application both secure and scalable. 