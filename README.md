# AgencyFlow

> Full-stack project management tool built for marketing agencies.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)

---

## Features

| Feature | Details |
|---|---|
| **Task Management** | Create tasks, assign to team members, set priority & due dates |
| **Kanban Board** | Per-project board view + list view with status columns |
| **Task Threads** | In-task chat threads with file/image/video uploads |
| **Status Updates** | TODO → In Progress → In Review → Done → Blocked |
| **Client Management** | Full client profiles with industry, website, notes |
| **POC Management** | Point-of-contact records per client (email, phone, job title) |
| **Project Management** | Projects tied to clients, managed by your team |
| **Visibility Control** | Per-item visibility: Private / Team / Managers Only / Client |
| **Role-Based Access** | Admin, Manager, Member, Client User roles |
| **File Uploads** | Docs, images, videos via Cloudinary (up to 100 MB) |
| **Team Management** | Admin can change user roles from the Team page |

---

## Tech Stack

- **Framework**: Next.js 16 App Router + TypeScript
- **Database**: PostgreSQL via **Prisma ORM**
- **Auth**: **NextAuth v5** (credentials — email + password)
- **UI**: Tailwind CSS v4 + Radix UI primitives + custom components
- **File Storage**: **Cloudinary** (images, videos, documents)
- **Icons**: Lucide React

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/agency-flow.git
cd agency-flow
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/agencyflow"
AUTH_SECRET="run: openssl rand -hex 32"
NEXTAUTH_URL="http://localhost:3000"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Set up the database

```bash
# Push schema (development)
npm run db:push

# Seed sample data (optional)
npm run db:seed
```

### 4. Run

```bash
npm run dev
# Open http://localhost:3000
```

The **first user to register** becomes **Admin** automatically.

---

## Role Permissions

| Action | Admin | Manager | Member | Client User |
|---|:---:|:---:|:---:|:---:|
| View all clients & projects | ✅ | ✅ | ✅ | ❌ |
| Create/edit clients & projects | ✅ | ✅ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ | ❌ |
| Assign tasks to others | ✅ | ✅ | ❌ | ❌ |
| Edit task status | ✅ | ✅ | Own tasks | ❌ |
| Manage POCs | ✅ | ✅ | ❌ | ❌ |
| Change user roles | ✅ | ❌ | ❌ | ❌ |
| View CLIENT-visibility items | ✅ | ✅ | ✅ | ✅ |
| View MANAGER_ONLY items | ✅ | ✅ | ❌ | ❌ |

## Visibility Levels

- **Private** — Only the creator and assignee
- **Team** — All internal team members
- **Managers Only** — Admins & Managers only
- **Client** — Team + client POC contacts can see this

---

## Deployment (Vercel)

```bash
# Push to GitHub, then import to Vercel
# Set the same environment variables in Vercel dashboard
# Use Vercel Postgres or Neon for DATABASE_URL
```

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected app routes
│   │   ├── dashboard/        # Home dashboard
│   │   ├── clients/          # Client list + detail
│   │   ├── projects/         # Project list + kanban board
│   │   ├── tasks/            # Task list + task detail w/ thread
│   │   ├── pocs/             # POC directory
│   │   └── team/             # Team & role management
│   ├── api/                  # REST API routes
│   ├── login/                # Sign-in page
│   └── register/             # Sign-up page
├── components/
│   ├── layout/               # Sidebar, Header
│   ├── tasks/                # TaskCard, TaskThread, TaskForm
│   ├── shared/               # Badges, VisibilitySelect
│   └── ui/                   # Button, Input, Card, Dialog, etc.
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── db.ts                 # Prisma client singleton
│   ├── cloudinary.ts         # File upload helper
│   └── utils.ts              # Permission helpers, labels
└── types/
    └── next-auth.d.ts        # Session type augmentation
```

---

## License

MIT
