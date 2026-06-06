# Gift Video QR Code Portal

A private portal for store owners to attach personal gift videos to orders, generate QR codes, and let recipients watch their video by scanning the code — no app or login required.

---

## Tech Stack

- **Next.js 14** (App Router, TypeScript strict mode)
- **Supabase** — PostgreSQL database + Auth
- **Cloudinary** — video and QR image storage
- **Tailwind CSS** — styling
- **React Hook Form + Zod** — form validation

---

## Setup Guide

### 1. Clone and install

```bash
git clone <repo-url>
cd gift-video-portal
npm install
```

---

### 2. Supabase setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once the project is ready, go to **SQL Editor** and run the migration:
   - Open `supabase/migrations/001_init.sql`
   - Paste the full contents into the SQL Editor and click **Run**
3. (Optional) Run the seed data:
   - Open `supabase/seed.sql`, paste into SQL Editor and **Run**
4. Go to **Authentication → Providers** and make sure **Email** provider is enabled.
5. Create the admin user:
   - Go to **Authentication → Users → Invite user**
   - Enter your email address and click **Send invitation**
   - Check your email, follow the link, and set a password
   - Alternatively: **Authentication → Users → Add user** and set email + password directly
6. Collect your project credentials:
   - **Project URL**: Settings → API → Project URL
   - **Anon key**: Settings → API → `anon` `public` key
   - **Service role key**: Settings → API → `service_role` key (keep this secret!)

---

### 3. Cloudinary setup

1. Go to [cloudinary.com](https://cloudinary.com) and create a free account.
2. From your **Dashboard**, note:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. No upload preset is needed — this project uses server-side signed uploads.

---

### 4. Environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> **Important**: Never commit `.env.local` to version control.

---

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to the login page.

---

## Deploying to Vercel

1. Push the project to GitHub.
2. Import the repo in the [Vercel dashboard](https://vercel.com/new).
3. Under **Environment Variables**, add all variables from `.env.local.example` with their production values.
4. Set `NEXT_PUBLIC_BASE_URL` to your Vercel production URL (e.g. `https://your-app.vercel.app`).
5. Deploy. Vercel detects Next.js automatically.

---

## How it works

| Step | Who | What |
|------|-----|------|
| 1 | Store admin | Logs into `/login` |
| 2 | Store admin | Creates an order at `/dashboard` |
| 3 | Store admin | Opens order, uploads the customer's gift video |
| 4 | Store admin | Clicks **Generate QR Code** |
| 5 | Store admin | Downloads/prints the QR code and attaches it to the parcel |
| 6 | Recipient | Scans QR code with phone camera |
| 7 | Recipient | Sees the gift video immediately — no login, no app |

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx                  Root layout (font, global CSS)
│   ├── page.tsx                    Redirects to /login
│   ├── login/page.tsx              Admin login form
│   ├── dashboard/
│   │   ├── layout.tsx              Auth guard
│   │   ├── page.tsx                Orders list
│   │   └── orders/[id]/page.tsx    Order detail: upload video + QR
│   ├── v/[token]/page.tsx          Public video player (no auth)
│   └── api/
│       ├── orders/route.ts         GET all, POST create
│       ├── orders/[id]/route.ts    GET one, PATCH update
│       ├── upload-video/route.ts   POST upload video to Cloudinary
│       └── generate-qr/[id]/route.ts  POST generate + upload QR
├── components/
│   ├── OrdersTable.tsx             Interactive orders table with create modal
│   ├── VideoUploadForm.tsx         Video upload with progress bar
│   ├── QRCodeDisplay.tsx           QR image + download/print buttons
│   └── StatusBadge.tsx             Color-coded status pill
└── lib/
    ├── types.ts                    TypeScript interfaces
    ├── supabase/
    │   ├── client.ts               Browser Supabase client
    │   └── server.ts               Server Supabase client (service role)
    ├── cloudinary.ts               Cloudinary upload helpers
    └── qr.ts                       QR generation + upload
```

---

## Notes

- Video uploads support up to 100 MB server-side (50 MB enforced client-side for UX).
- QR codes are 400x400 PNG with error-correction level H, stored on Cloudinary.
- The public video page (`/v/[token]`) uses the Supabase service role key to bypass RLS.
- All secrets (`SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`) are server-only.
