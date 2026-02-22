# Memona – MemoryLane Personal (Backend)

Production-ready Node.js + Express backend starter using Supabase (PostgreSQL + Auth) and Cloudinary media storage.

## Tech Stack

- Node.js
- Express.js (CommonJS)
- Supabase (`@supabase/supabase-js`)
- Cloudinary (`upload_stream`)
- REST API architecture

## Project Structure


server/
├── src/
│   ├── config/
│   │   ├── supabaseClient.js
│   │   ├── cloudinary.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── memoryController.js
│   │   ├── albumController.js
│   │   ├── milestoneController.js
│   │   └── authController.js
│   ├── routes/
│   │   ├── memoryRoutes.js
│   │   ├── albumRoutes.js
│   │   ├── milestoneRoutes.js
│   │   └── authRoutes.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── uploadMiddleware.js
│   ├── services/
│   │   ├── memoryService.js
│   │   └── albumService.js
│   ├── utils/
│   │   └── responseHandler.js
│   ├── app.js
│   └── server.js
├── .env.example
├── package.json
└── README.md
```

## Environment Variables

Copy `.env.example` to `.env` and fill values:

```env
PORT=5000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

If your existing `memories` table is already created, run this migration in Supabase SQL editor:

`supabase/migrations/20260221_fix_memories_auth_fk_and_rls.sql`

## Install and Run

```bash
npm install
npm run dev
```

Production:

```bash
npm start
```

## Supabase Schema (SQL)

Run this in Supabase SQL editor:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  media_url text,
  media_type text,
  voice_note_url text,
  location_lat numeric,
  location_lng numeric,
  is_milestone boolean default false,
  is_public boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  cover_image_url text,
  created_at timestamptz default now()
);

create table if not exists public.album_memories (
  album_id uuid not null references public.albums(id) on delete cascade,
  memory_id uuid not null references public.memories(id) on delete cascade,
  primary key (album_id, memory_id)
);
```

## API Endpoints

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`

### Memories

- `GET /api/memories`
- `GET /api/memories/:id`
- `POST /api/memories`
- `PUT /api/memories/:id`
- `DELETE /api/memories/:id`

### Albums

- `GET /api/albums`
- `POST /api/albums`
- `PUT /api/albums/:id`
- `DELETE /api/albums/:id`

### Milestones

- `GET /api/milestones`

## Authentication Strategy

- Frontend authenticates users with Supabase.
- Frontend sends `Authorization: Bearer <JWT>`.
- Backend verifies user with `supabase.auth.getUser(token)` in `authMiddleware`.
- Verified user is attached as `req.user`.

## File Upload Strategy

- `multer` memory storage
- 50MB limit
- MIME allowlist: `image/*`, `video/*`
- Upload uses Cloudinary `upload_stream`
- Saved media URL is `secure_url`

## Error Response Format

All errors use:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Security

- `helmet()` enabled
- `cors()` enabled
- request body sanitization
- centralized error handling
- input validation and proper status codes
