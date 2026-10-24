# CampusVoice — Student Complaint and Feedback Management System

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com)

**Tagline:** *Your Campus. Your Voice. A Better Tomorrow.*

CampusVoice is a modern, enterprise-grade student grievance, feedback, and institutional accountability platform. Designed for higher-education environments, CampusVoice enables students to submit complaints, monitor departmental investigations through real-time milestone updates, and record satisfaction feedback upon resolution. University administrators and ombudspersons utilize dedicated consoles for case assignment, SLA tracking, trend analytics, and exportable audit reporting.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Client Tier: Vercel (Frontend SPA)                    │
│  React 19 • TypeScript • Vite • Tailwind CSS • React Router • Lucide Icons │
│  - Student Grievance Portal (/dashboard, /submit, /complaints, /feedback)    │
│  - Administrator Console (/admin/dashboard, /admin/complaints, /admin/reports)│
│  - Auth Gateway & Identity Pages (/login, /register, /admin/login)          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JSON REST
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       API Tier: Render (Backend REST API)                   │
│  Node.js (v20+) • Express • TypeScript • Helmet • CORS • Zod Validation     │
│  - Global, Auth, & Submission Rate Limiting (express-rate-limit)            │
│  - Role-Based Access Control (RBAC) & Sensitive Whistleblower Masking       │
│  - Internal Admin Notes Complete Isolation from Student Responses           │
│  - Append-Only Audit Logging & CSV Export Formula Neutralization            │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │ Pooled TCP Connection               │ REST / SMTP
                    ▼                                     ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│     Database: Supabase PostgreSQL    │  │     Outbound Notification Mail    │
│  - 13 Relational Tables & Enums      │  │  Resend REST API / SendGrid /     │
│  - Atomic Reference Generator Seq    │  │  SMTP with Verified Receipts      │
│  - Transaction Pooler (Port 6543)    │  │  (Safe skip mode when unconfigured)│
└──────────────────────────────────────┘  └───────────────────────────────────┘
```

---

## 🚀 Technology Stack

| Layer | Technology | Specification / Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Component-driven UI using the Sage & Warm Cream design system |
| **Build Tool** | Vite 8 + PostCSS | Rapid HMR and optimized production bundles (`frontend/dist`) |
| **Routing** | React Router v7 | Client-side routing with `ProtectedRoute` guards and `vercel.json` rewrites |
| **Backend** | Express 4 + TypeScript | Modular RESTful API (`backend/dist/server.js`) |
| **Security** | Helmet + CORS + RateLimit | HTTP security headers, CORS origin verification, 429 throttling |
| **Database** | PostgreSQL 15+ (Supabase) | Relational database with pooled connection support |
| **Authentication**| Supabase Auth | JWT-based authentication with authoritative server-side role resolution |
| **Validation** | Zod v3 | Strict runtime schema parsing for request payloads and query parameters |
| **Hosting** | Vercel & Render | Vercel (Frontend Static/SPA), Render (Backend Web Service) |

---

## 🎨 Official CampusVoice Design System

- **Primary Sage:** `#496B58` (Interactive elements, active links, focus rings)
- **Deep Sage:** `#365442` (Primary buttons, brand marks, status badges)
- **Soft Sage:** `#A7B8A5` (Subtle borders, secondary indicators)
- **Warm Cream:** `#F7F4EC` (Full page background surface)
- **Off-White:** `#FFFDF8` (Card surfaces, inputs, modal containers)
- **Charcoal Text:** `#292F2B` (Headings, primary body copy)
- **Secondary Text:** `#68716A` (Captions, helper labels)
- **Borders:** `#E5E0D5` (Restrained card borders and dividers)
- **Muted Terracotta:** `#B8755D` (Decorative alert badges, critical urgency highlights)

---

## ⚡ Local Development Setup

### 1. Prerequisites
- **Node.js:** v20.0.0 or higher
- **npm:** v10.0.0 or higher
- **Git**

### 2. Clone and Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/campus-voice.git
cd campus-voice

# Install dependencies across both workspaces
npm --prefix frontend install
npm --prefix backend install
```

### 3. Configure Local Environment Variables
Create `.env` files from templates:
```bash
# Backend environment configuration
cp backend/.env.example backend/.env

# Frontend environment configuration
cp frontend/.env.example frontend/.env
```

### 4. Run Development Servers
Start both backend and frontend concurrently:
```bash
# Start backend API (http://localhost:5000)
npm run dev:backend

# Start frontend Vite server (http://localhost:5173)
npm run dev:frontend
```

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env` & Render Dashboard)

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | `5000` (Local) / `10000` (Render) | Server listening port supplied by environment |
| `NODE_ENV` | Yes | `production` | Environment mode (`development`, `test`, `production`) |
| `CLIENT_URL` | Yes | `https://campusvoice.vercel.app` | Allowed CORS origins (comma-separated list permitted) |
| `DATABASE_URL` | Yes | `postgresql://postgres.[ref]:[pass]@[host]:6543/postgres` | PostgreSQL connection string (Supabase transaction pooler) |
| `DATABASE_SSL` | No | `true` | Enables TLS connection to Supabase PostgreSQL |
| `DATABASE_MAX_CONNECTIONS` | No | `20` | Max connection pool size |
| `SUPABASE_URL` | Yes | `https://[ref].supabase.co` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJ...` | Supabase service role key (restricted strictly to server) |
| `SUPABASE_ANON_KEY` | Yes | `eyJ...` | Supabase public anon key |
| `EMAIL_PROVIDER` | No | `none` (`resend`, `sendgrid`, `smtp`) | Outbound email service provider |
| `EMAIL_FROM` | No | `CampusVoice <notifications@campusvoice.edu>` | Verified outbound sender address |
| `RESEND_API_KEY` | No | `re_...` | Resend API key (if `EMAIL_PROVIDER=resend`) |

### Frontend (`frontend/.env` & Vercel Dashboard)

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | `https://campusvoice-api.onrender.com/api/v1` | Public URL of the backend API (never localhost in prod) |
| `VITE_SUPABASE_URL` | Yes | `https://[ref].supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | `eyJ...` | Supabase public client key |

> [!CAUTION]
> Never expose `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or email API keys in frontend environment variables. All variables prefixed with `VITE_` are bundled into the public client JavaScript.

---

## 🗄️ Database Migrations Procedure (Supabase)

CampusVoice uses reproducible SQL migrations located at [`backend/src/db/schema.sql`](file:///c:/Users/M.Lingesh/Campus%20Voice/backend/src/db/schema.sql).

### Method A: Automated Migration Runner
Configure `DATABASE_URL` in `backend/.env` and execute:
```bash
npm run migrate:backend
```
The migration script initializes:
1. `uuid-ossp` extension and domain ENUMs (`user_role`, `complaint_priority`, `complaint_status`, `notification_type`).
2. Atomic reference generator sequence (`complaint_ref_seq`).
3. 13 core relational tables (`profiles`, `departments`, `complaints`, `admin_notes`, `feedback`, `notifications`, `audit_logs`).
4. Performance B-tree indexes.
5. Institutional taxonomy seeds (11 complaint categories and university departments).

### Method B: Supabase SQL Editor
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** -> **New Query**.
3. Copy the complete contents of [`backend/src/db/schema.sql`](file:///c:/Users/M.Lingesh/Campus%20Voice/backend/src/db/schema.sql) and execute.

---

## 🔒 Supabase Authentication Configuration

To configure production authentication in the [Supabase Dashboard](https://supabase.com/dashboard):

1. **URL Configuration (Authentication -> URL Configuration):**
   - **Site URL:** Set to your production frontend (e.g., `https://campusvoice.vercel.app`).
   - **Redirect URLs:** Add:
     - `https://campusvoice.vercel.app/**`
     - `https://campusvoice.vercel.app/reset-password`
     - `http://localhost:5173/**` (for local development)
2. **Email Provider (Authentication -> Providers -> Email):**
   - Enable Email Signup.
   - Set password minimum length to at least 8 characters.
   - Ensure "Confirm Email" is configured according to institutional policy.
3. **Role Enforcement:**
   - Student signups automatically receive the `'student'` role in user metadata and database profiles.
   - Elevated administrator privileges (`admin` or `staff`) must be assigned through database seed scripts or by authorized administrators via `/admin/users`. Self-escalation is strictly prevented.

---

## 🚢 Deployment Guide

### Deploying Frontend to Vercel

1. **Import Repository:**
   - Log in to [Vercel](https://vercel.com) and click **Add New Project**.
   - Select your CampusVoice repository.
2. **Configure Project Settings:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Select `frontend` (or leave as root with the included root `vercel.json`).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Configure Environment Variables:**
   - `VITE_API_URL`: `https://campusvoice-api.onrender.com/api/v1`
   - `VITE_SUPABASE_URL`: `https://[your-project].supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `[your-anon-key]`
4. **Deploy:**
   - Click **Deploy**. Vercel will build the production bundle and automatically apply client-side SPA routing rewrites configured in [`frontend/vercel.json`](file:///c:/Users/M.Lingesh/Campus%20Voice/frontend/vercel.json).

---

### Deploying Backend to Render

#### Option 1: Blueprint Deployment (Recommended)
1. In the [Render Dashboard](https://dashboard.render.com), click **New** -> **Blueprint**.
2. Connect your CampusVoice repository. Render automatically reads [`render.yaml`](file:///c:/Users/M.Lingesh/Campus%20Voice/render.yaml).
3. Supply required secret environment variables (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`).
4. Click **Apply**.

#### Option 2: Manual Web Service
1. In Render, click **New** -> **Web Service**.
2. Select your repository.
3. Configure:
   - **Runtime:** `Node`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/server.js`
   - **Health Check Path:** `/api/health`
4. In **Environment Variables**, add the variables specified in the Backend Environment Variables table above.
5. Click **Create Web Service**.

---

## 🧪 Verification and Quality Checks

Run the verification suites prior to releasing new versions:

```bash
# 1. Typecheck & production builds
npm run typecheck
npm run build

# 2. Architecture & integration test suite (12 tests)
npm run test:backend

# 3. Comprehensive security & QA audit suite (39 tests)
npm run test:audit
```

---

## 🛠️ Troubleshooting Guidance

### 1. CORS `Blocked by CORS policy`
- **Symptom:** Browser console displays `Access to fetch at ... from origin ... has been blocked by CORS policy`.
- **Resolution:** Verify that `CLIENT_URL` in the Render environment variables matches the exact origin of your Vercel deployment (e.g., `https://campusvoice.vercel.app`), without extra slashes or protocol mismatches. Multiple origins can be comma-separated: `https://campusvoice.vercel.app,http://localhost:5173`.

### 2. Database Connection Pooling Timeout (`ETIMEDOUT` or `connection limit reached`)
- **Symptom:** Database queries hang or fail on Supabase.
- **Resolution:** Use the Supabase **Transaction Pooler** connection string (Port `6543`), not the direct session connection (Port `5432`). Ensure `DATABASE_SSL=true`.

### 3. Vercel 404 on Page Refresh
- **Symptom:** Refreshing a URL like `/admin/complaints` or `/dashboard` returns Vercel 404.
- **Resolution:** Verify [`frontend/vercel.json`](file:///c:/Users/M.Lingesh/Campus%20Voice/frontend/vercel.json) contains the rewrite rule pointing all paths `/(.*)` to `/index.html`.

### 4. Cold Start Latency on Render Free Tier
- **Symptom:** First request after 15 minutes of inactivity takes 30-50 seconds.
- **Resolution:** Render's free tier spins down idle instances. The frontend includes responsive loading skeletons and retry states. For critical deployments, upgrade the Render instance to the Starter plan.

---

## 📄 License
CampusVoice is released under the MIT License.
