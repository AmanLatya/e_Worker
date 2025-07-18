# eWorker Backend API Documentation

A Node.js backend for the eWorker mobile app with Express, MongoDB, JWT authentication, and real-time socket communication.

## Table of Contents
- [Setup](#setup)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Authentication Routes](#authentication-routes)
  - [User Profile Routes](#user-profile-routes)
  - [Worker Routes](#worker-routes)
  - [Request Routes](#request-routes)
- [Error Responses](#error-responses)
- [Socket Events](#socket-events)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file with required environment variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_CLIENT_ID=your_google_client_id
   NODE_ENV=development
   ```
4. Start the server:
   ```bash
   npm run dev
   # or
   npm start
   ```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication Routes

Base URL: `/auth`

#### 1. Register User
- **URL:** `POST /auth/register/user`
- **Description:** Register a new user account
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "name": "string (required)",
    "email": "string (required, valid email format)",
    "password": "string (required, min 8 characters)"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "jwt_token",
    "user": {
      "id": "user_id",
      "name": "user_name",
      "email": "user_email",
      "role": "user"
    }
  }
  ```
- **Error Codes:** 400 (validation errors), 500 (server error)

#### 2. Register Worker
- **URL:** `POST /auth/register/worker`
- **Description:** Register a new worker account
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "name": "string (required)",
    "email": "string (required, valid email format)",
    "password": "string (required, min 8 characters)"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "jwt_token",
    "worker": {
      "id": "worker_id",
      "name": "worker_name",
      "email": "worker_email",
      "role": "worker"
    }
  }
  ```
- **Error Codes:** 400 (validation errors), 500 (server error)

#### 3. Login
- **URL:** `POST /auth/login`
- **Description:** Login with email and password (works for both users and workers)
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "email": "string (required)",
    "password": "string (required)"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "jwt_token",
    "role": "user|worker",
    "user": {
      "id": "user_id",
      "name": "user_name",
      "email": "user_email",
      "role": "user|worker"
    }
  }
  ```
- **Error Codes:** 400 (invalid credentials), 500 (server error)

#### 4. Google Authentication
- **URL:** `POST /auth/google`
- **Description:** Login/Register with Google OAuth
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "token": "string (required, Google ID token)",
    "role": "string (optional, 'user' or 'worker', defaults to 'user')"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "jwt_token",
    "isNewUser": boolean,
    "user": {
      "id": "user_id",
      "name": "user_name",
      "email": "user_email",
      "role": "user|worker",
      "picture": "google_profile_picture_url"
    }
  }
  ```
- **Error Codes:** 400 (invalid token), 500 (server error)

#### 5. Complete Worker Profile
- **URL:** `POST /auth/completeworkerprofile`
- **Description:** Update worker profile with location and skills
- **Authentication:** Required (JWT token)
- **Request Body:**
  ```json
  {
    "name": "string (optional)",
    "location": {
      "lat": "number (required)",
      "lng": "number (required)"
    },
    "skill": "string (optional)"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "worker": {
      "id": "worker_id",
      "name": "worker_name",
      "email": "worker_email",
      "skill": "worker_skill",
      "location": {
        "type": "Point",
        "coordinates": [lng, lat]
      }
    }
  }
  ```
- **Error Codes:** 400 (validation errors), 401 (unauthorized), 404 (worker not found), 500 (server error)

### User Profile Routes

Base URL: `/me`

#### 1. Get Current User
- **URL:** `GET /me`
- **Description:** Get current user/worker profile information
- **Authentication:** Required (JWT token)
- **Request Body:** None
- **Response:**
  ```json
  {
    "user": {
      "id": "user_id",
      "name": "user_name",
      "email": "user_email",
      "role": "user|worker",
      "location": "location_object (if worker)",
      "skill": "skill_string (if worker)"
    }
  }
  ```
- **Error Codes:** 401 (unauthorized), 500 (server error)

### Worker Routes

Base URL: `/worker`

#### 1. Register/Update Worker
- **URL:** `POST /worker/register`
- **Description:** Register or update worker profile
- **Authentication:** Required (JWT token)
- **Request Body:**
  ```json
  {
    "name": "string (optional)"
  }
  ```
- **Response:**
  ```json
  {
    "user": {
      "id": "worker_id",
      "name": "worker_name",
      "email": "worker_email",
      "role": "worker"
    }
  }
  ```
- **Error Codes:** 400 (not a worker), 401 (unauthorized), 500 (server error)

#### 2. Find Nearby Workers
- **URL:** `POST /worker/nearby`
- **Description:** Find all workers (currently returns all workers)
- **Authentication:** Not required
- **Request Body:** None
- **Response:**
  ```json
  {
    "workers": [
      {
        "id": "worker_id",
        "name": "worker_name",
        "email": "worker_email",
        "role": "worker"
      }
    ]
  }
  ```
- **Error Codes:** 500 (server error)

### Request Routes

Base URL: `/request`

#### 1. Create Request
- **URL:** `POST /request/create`
- **Description:** Create a new worker request
- **Authentication:** Required (JWT token)
- **Request Body:**
  ```json
  {
    "userLocation": {
      "Coordinates": {
        "ltd": "number (required, latitude)",
        "lng": "number (required, longitude)"
      }
    },
    "workerType": "string (required, must be 'carpanter', 'electrician', or 'plumber')"
  }
  ```
- **Response:**
  ```json
  [
    {
      "id": "worker_id",
      "name": "worker_name",
      "email": "worker_email",
      "location": "location_object",
      "skill": "worker_skill",
      "socketID": "socket_id"
    }
  ]
  ```
- **Error Codes:** 400 (validation errors), 401 (unauthorized), 500 (server error)

#### 2. Accept Request
- **URL:** `POST /request/accept`
- **Description:** Accept a worker request (workers only)
- **Authentication:** Required (JWT token)
- **Request Body:**
  ```json
  {
    "requestID": "string (required, valid MongoDB ObjectId)"
  }
  ```
- **Response:**
  ```json
  {
    "id": "request_id",
    "user": {
      "id": "user_id",
      "name": "user_name",
      "email": "user_email",
      "socketID": "socket_id"
    },
    "worker": {
      "id": "worker_id",
      "name": "worker_name",
      "email": "worker_email"
    },
    "status": "accepted",
    "otp": "6_digit_otp"
  }
  ```
- **Error Codes:** 400 (validation errors), 401 (unauthorized), 404 (request expired), 500 (server error)

#### 3. Confirm Request
- **URL:** `GET /request/confirm`
- **Description:** Confirm a request with OTP (users only)
- **Authentication:** Required (JWT token)
- **Query Parameters:**
  ```
  requestID: string (required, valid MongoDB ObjectId)
  otp: string (required, 6-digit numeric OTP)
  ```
- **Response:**
  ```json
  {
    "id": "request_id",
    "user": {
      "id": "user_id",
      "name": "user_name",
      "email": "user_email",
      "socketID": "socket_id"
    },
    "worker": {
      "id": "worker_id",
      "name": "worker_name",
      "email": "worker_email"
    },
    "status": "ongoing",
    "otp": "6_digit_otp"
  }
  ```
- **Error Codes:** 400 (validation errors), 401 (unauthorized), 500 (server error)

#### 4. Cancel Request
- **URL:** `GET /request/cancel`
- **Description:** Cancel an existing worker request
- **Authentication:** Required (JWT token)
- **Query Parameters:**
  ```
  requestID: string (required, valid MongoDB ObjectId)
  ```
- **Response:**
  - If successfully cancelled:
    ```json
    {
      "id": "request_id",
      "user": { ... },
      "worker": { ... },
      "status": "cancelled"
    }
    ```
  - If already cancelled:
    ```json
    {
      "message": "Cancelled Already"
    }
    ```
- **Error Codes:** 400 (already cancelled, validation errors), 401 (unauthorized), 404 (not found), 500 (server error)

#### 5. Complete Request
- **URL:** `GET /request/complete`
- **Description:** Mark a worker request as completed (workers only)
- **Authentication:** Required (JWT token)
- **Query Parameters:**
  ```
  requestID: string (required, valid MongoDB ObjectId)
  ```
- **Response:**
  - If successfully completed:
    ```json
    {
      "id": "request_id",
      "user": { ... },
      "worker": { ... },
      "status": "completed"
    }
    ```
  - If already completed:
    ```json
    {
      "message": "Complete Already"
    }
    ```
  - If invalid request:
    ```json
    {
      "message": "Invalid Request"
    }
    ```
- **Error Codes:** 400 (already completed, validation errors), 401 (unauthorized), 404 (invalid request), 500 (server error)

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (only in development)"
}
```

Common HTTP status codes:
- **200:** Success
- **201:** Created
- **400:** Bad Request (validation errors)
- **401:** Unauthorized (missing or invalid token)
- **404:** Not Found
- **500:** Internal Server Error

## Socket Events

The API uses WebSocket connections for real-time communication:

### Events Sent to Workers:
- **`new-request`:** When a new request is created
- **`request-accepted`:** When a request is accepted by another worker
- **`request-confirm`:** When a request is confirmed by the user

### Events Sent to Users:
- **`request-accepted`:** When a worker accepts their request
- **`request-confirm`:** When their request is confirmed

### Socket Message Format:
```json
{
  "event": "event_name",
  "data": "event_data_object"
}
```

## Environment Variables

Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `NODE_ENV`: Environment (development/production)

## Notes

- All timestamps are in ISO format
- Location coordinates use [longitude, latitude] format for MongoDB geospatial queries
- OTP is 6 digits and generated automatically for each request
- Socket connections are managed separately from HTTP requests
- Worker types are limited to: 'carpanter', 'electrician', 'plumber'

---
MIT License 