# Authentication API Endpoints

This document describes the authentication-related API endpoints available in the application.

## Base URL

All API endpoints are relative to the base URL: `/api/auth`

## Authentication Endpoints

### Login

Authenticates a user with email and password.

- **URL**: `/login`
- **Method**: `POST`
- **Auth Required**: No
- **CSRF Protection**: Yes

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response**:

- **Code**: 200 OK
- **Content**:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "roles": ["user"],
    "permissions": ["resource-1:read"]
  }
}
```

**Error Responses**:

- **Code**: 401 Unauthorized
- **Content**:

```json
{
  "error": {
    "message": "Invalid email or password",
    "code": "auth_error",
    "statusCode": 401
  }
}
```

- **Code**: 400 Bad Request
- **Content**:

```json
{
  "error": {
    "message": "Email and password are required",
    "code": "validation_error",
    "statusCode": 400,
    "fields": {
      "email": "Email is required",
      "password": "Password is required"
    }
  }
}
```

### Signup

Registers a new user.

- **URL**: `/signup`
- **Method**: `POST`
- **Auth Required**: No
- **CSRF Protection**: Yes

**Request Body**:

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}
```

**Success Response**:

- **Code**: 201 Created
- **Content**:

```json
{
  "user": {
    "id": "new-user-id",
    "email": "newuser@example.com",
    "roles": ["user"],
    "permissions": []
  }
}
```

**Error Responses**:

- **Code**: 400 Bad Request
- **Content**:

```json
{
  "error": {
    "message": "Invalid signup data",
    "code": "validation_error",
    "statusCode": 400,
    "fields": {
      "email": "Email is already in use",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

### Logout

Logs out the current user.

- **URL**: `/logout`
- **Method**: `POST`
- **Auth Required**: Yes
- **CSRF Protection**: Yes

**Request Body**: None

**Success Response**:

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true
}
```

**Error Responses**:

- **Code**: 401 Unauthorized
- **Content**:

```json
{
  "error": {
    "message": "Not authenticated",
    "code": "auth_error",
    "statusCode": 401
  }
}
```

### Get Current User

Retrieves the currently authenticated user.

- **URL**: `/user`
- **Method**: `GET`
- **Auth Required**: Yes
- **CSRF Protection**: No

**Request Body**: None

**Success Response**:

- **Code**: 200 OK
- **Content**:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "roles": ["user"],
    "permissions": ["resource-1:read"]
  }
}
```

**Error Responses**:

- **Code**: 401 Unauthorized
- **Content**:

```json
{
  "error": {
    "message": "Not authenticated",
    "code": "auth_error",
    "statusCode": 401
  }
}
```

### Reset Password

Sends a password reset email to the user.

- **URL**: `/reset-password`
- **Method**: `POST`
- **Auth Required**: No
- **CSRF Protection**: Yes

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Success Response**:

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Error Responses**:

- **Code**: 400 Bad Request
- **Content**:

```json
{
  "error": {
    "message": "Email is required",
    "code": "validation_error",
    "statusCode": 400,
    "fields": {
      "email": "Email is required"
    }
  }
}
```

### Update Password

Updates a user's password using a reset token.

- **URL**: `/update-password`
- **Method**: `POST`
- **Auth Required**: No
- **CSRF Protection**: Yes

**Request Body**:

```json
{
  "token": "reset-token",
  "newPassword": "new-password123"
}
```

**Success Response**:

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Error Responses**:

- **Code**: 400 Bad Request
- **Content**:

```json
{
  "error": {
    "message": "Invalid password",
    "code": "validation_error",
    "statusCode": 400,
    "fields": {
      "newPassword": "Password must be at least 8 characters"
    }
  }
}
```

- **Code**: 401 Unauthorized
- **Content**:

```json
{
  "error": {
    "message": "Invalid or expired token",
    "code": "auth_error",
    "statusCode": 401
  }
}
```

### Refresh Session

Refreshes the user's session.

- **URL**: `/refresh`
- **Method**: `POST`
- **Auth Required**: Yes
- **CSRF Protection**: Yes

**Request Body**: None

**Success Response**:

- **Code**: 200 OK
- **Content**:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "roles": ["user"],
    "permissions": ["resource-1:read"]
  }
}
```

**Error Responses**:

- **Code**: 401 Unauthorized
- **Content**:

```json
{
  "error": {
    "message": "Session refresh failed",
    "code": "auth_error",
    "statusCode": 401
  }
}
```

## CSRF Token Endpoint

### Get CSRF Token

Generates a new CSRF token for form submissions.

- **URL**: `/csrf-token`
- **Method**: `GET`
- **Auth Required**: No
- **CSRF Protection**: No

**Request Body**: None

**Success Response**:

- **Code**: 200 OK
- **Content**:

```json
{
  "csrfToken": "generated-csrf-token"
}
```

**Error Responses**:

- **Code**: 500 Internal Server Error
- **Content**:

```json
{
  "error": {
    "message": "Failed to generate CSRF token",
    "code": "server_error",
    "statusCode": 500
  }
}
``` 