
# 🌸 Memona – Backend API

## 📌 Project Overview

Memona Backend is a RESTful API server built using Node.js and Express to power the Memona digital memory platform.

It handles:

* User authentication validation (Supabase Auth)
* Memory CRUD operations
* Media upload handling (Cloudinary integration)
* Voice note management
* Milestone logic & anniversary calculations
* Memory sharing (public & private)
* Album management
* Role-based access (User/Admin)
* Row-Level Security (RLS) integration

The backend communicates with Supabase PostgreSQL for structured relational data storage and Cloudinary for media asset management.

---

# 🛠 Tech Stack

### Backend

* Node.js
* Express.js
* REST API architecture
* Multer (file upload handling)

### Database

* PostgreSQL (via Supabase)
* Row Level Security (RLS)
* Foreign key constraints
* Indexed relational schema

### Authentication

* Supabase Auth (JWT-based validation)

### Media Storage

* Cloudinary (Images, Videos, Audio)

### Utilities

* Custom response handler
* Async error wrapper
* Middleware-based architecture

---

# 📡 API Documentation

Base URL:

```
[ https://memona-backend.onrender.com]
```

---

## 🔐 Authentication

All protected routes require:

```
Authorization: Bearer <JWT_TOKEN>
```

JWT is issued by Supabase Auth.

---

## 📁 Memory Routes

### Create Memory

```
POST /api/memories
```

Body:

* title
* description
* media file
* location (optional)
* is_public (boolean)

---

### Get User Memories

```
GET /api/memories
```

Returns all memories belonging to authenticated user.

---

### Get Public Memories

```
GET /api/memories/public
```

Returns memories where `is_public = true`.

---

### Update Memory

```
PUT /api/memories/:id
```

---

### Delete Memory

```
DELETE /api/memories/:id
```

---

## 🎙 Voice Upload

```
POST /api/upload/voice
```

* Accepts audio file via multipart/form-data
* Uploads to Cloudinary
* Stores metadata in `media_files`
* Returns `media_id`

---

## 🏆 Milestones

### Create Milestone

```
POST /api/milestones
```

Modes:

* From existing memory
* Standalone milestone

---

### Get User Milestones

```
GET /api/milestones
```

Returns enriched milestone data including:

* Years since celebration
* Next anniversary date
* Days until next anniversary

---

### Update Milestone

```
PUT /api/milestones/:id
```

---

### Delete Milestone

```
DELETE /api/milestones/:id
```

---

### Get Today’s Reminders

```
GET /api/milestones/today
```

Returns milestones where celebration date matches today (month/day logic).

---

## 👥 Sharing

### Share Memory

```
POST /api/memories/:id/share
```

Body:

```
{
  "shared_with": "<user_uuid>"
}
```

---

### Get Shared Memories

```
GET /api/memories/shared
```

Returns memories shared with authenticated user.

---

## 📁 Albums

### Create Album

```
POST /api/albums
```

### Get Albums

```
GET /api/albums
```

---

# 🗄 Database Schema Explanation

## 🧍 profiles

Stores user profile information.

| Column | Type                   |
| ------ | ---------------------- |
| id     | uuid (FK → auth.users) |
| name   | text                   |
| role   | text (user/admin)      |

---

## 📸 memories

Core memory storage.

| Column        | Type                    |
| ------------- | ----------------------- |
| id            | uuid                    |
| user_id       | uuid (FK → auth.users)  |
| title         | text                    |
| description   | text                    |
| media_id      | uuid (FK → media_files) |
| voice_note_id | uuid (FK → media_files) |
| location_name | text                    |
| location_lat  | numeric                 |
| location_lng  | numeric                 |
| is_public     | boolean                 |
| is_milestone  | boolean                 |
| created_at    | timestamptz             |

---

## 🗂 media_files

Stores Cloudinary metadata.

| Column        | Type        |
| ------------- | ----------- |
| id            | uuid        |
| user_id       | uuid        |
| public_id     | text        |
| secure_url    | text        |
| resource_type | text        |
| duration      | numeric     |
| bytes         | integer     |
| created_at    | timestamptz |

---

## 🏆 milestones

Tracks important life events.

| Column           | Type            |
| ---------------- | --------------- |
| id               | uuid            |
| user_id          | uuid            |
| memory_id        | uuid (nullable) |
| celebration_date | date            |
| reminder_enabled | boolean         |
| created_at       | timestamptz     |

Includes anniversary logic calculation in backend.

---

## 👥 memory_shares

Handles private memory sharing.

| Column      | Type        |
| ----------- | ----------- |
| id          | uuid        |
| memory_id   | uuid        |
| shared_by   | uuid        |
| shared_with | uuid        |
| created_at  | timestamptz |

---

## 📁 albums

Organizes memories into collections.

---

# 🔐 Security Model

* Row Level Security (RLS) enabled on all tables
* Ownership validation on all CRUD routes
* Admin role-based access
* Foreign key constraints with cascade delete
* JWT-based authentication middleware

---

# ⚙️ Installation Steps

## 1️⃣ Clone Repository

```bash
git clone https://github.com/artiverma-00/memona_backend
cd memona_backend
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Create Environment Variables

Create `.env` file:

```
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

## 4️⃣ Run Server

```bash
npm run dev
```

Server runs on:

```
http://localhost:5000
```

---

# 🚀 Deployment Link

Backend Live URL:

```
https://memona-backend.onrender.com
```

Platforms:
* Render

---

# 📌 Future Improvements

* Email notifications for milestone anniversaries
* AI-generated recap videos
* Voice transcription
* Rate limiting middleware
* API documentation with Swagger
* Caching layer for public memories
* Admin profile ehancement
  
  #Thank you

