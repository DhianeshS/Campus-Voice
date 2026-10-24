# CampusVoice Enterprise Backend API

Modular REST API service for CampusVoice built with **Node.js**, **Express**, **TypeScript**, and **PostgreSQL hosted on Supabase**.

---

## 1. Architecture Overview

```
backend/
├── src/
│   ├── app.ts                  # Express Application configuration & middleware pipeline
│   ├── server.ts               # HTTP Server listener & lifecycle management
│   ├── config/
│   │   └── env.ts              # Zod-validated environment configuration
│   ├── db/
│   │   ├── database.ts         # pg connection pool, transaction helper, error sanitization
│   │   ├── schema.sql          # Repeatable PostgreSQL relational schema & initial taxonomy
│   │   ├── migrate.ts          # Automated schema migration runner
│   │   └── supabase.ts         # Supabase JS client integration
│   ├── middleware/
│   │   ├── auth.ts             # Supabase Auth verification & RBAC authorization
│   │   ├── errorHandler.ts     # Centralized error handler & status mapping
│   │   └── notFoundHandler.ts  # 404 handler for undefined API routes
│   ├── repositories/           # Parameterized database access & transaction execution
│   │   ├── profile.repository.ts
│   │   ├── category.repository.ts
│   │   ├── complaint.repository.ts
│   │   ├── feedback.repository.ts
│   │   ├── notification.repository.ts
│   │   └── audit.repository.ts
│   ├── services/               # Institutional business logic & SLA tracking
│   │   ├── complaint.service.ts
│   │   ├── admin.service.ts
│   │   └── health.service.ts
│   ├── controllers/            # HTTP Request/Response handlers
│   │   ├── auth.controller.ts
│   │   ├── complaint.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── admin.controller.ts
│   │   └── health.controller.ts
│   ├── validators/             # Zod input validation schemas
│   │   ├── auth.validator.ts
│   │   ├── complaint.validator.ts
│   │   └── feedback.validator.ts
│   ├── routes/                 # Express route definitions
│   │   ├── index.ts
│   │   ├── health.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── complaint.routes.ts
│   │   ├── notification.routes.ts
│   │   └── admin.routes.ts
│   └── types/                  # Shared TypeScript domain contracts
```

---

## 2. PostgreSQL Database Schema on Supabase

The database schema (`src/db/schema.sql`) implements relational modeling with integrity guarantees:

1. **`departments`**: Institutional directorates with active status and contact routing.
2. **`profiles`**: Extends `auth.users(id)` without duplicating passwords. Stores student matriculation numbers, department relations, and verified roles.
3. **`complaint_categories`**: 11 institutional classifications with default SLA resolution thresholds.
4. **`complaints`**: Core grievance table with check constraints, foreign keys, and atomic reference sequence generation (`complaint_ref_seq`).
5. **`complaint_attachments`**: Attachment metadata with 10MB file size limit constraints.
6. **`complaint_updates`**: Chronological status milestone ledger.
7. **`admin_notes`**: Private administrator internal notes, strictly isolated from student API queries.
8. **`feedback`**: Student satisfaction ratings with `CHECK (rating >= 1 AND rating <= 5)`.
9. **`notifications`**: Real-time student and staff notification queue with read status and contextual alert types.
10. **`audit_logs`**: Append-only immutable administrative ledger.

---

## 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Configuration Parameters:
- `PORT`: HTTP port for API server (default: `5000`).
- `NODE_ENV`: Application environment (`development` | `test` | `production`).
- `CLIENT_URL`: Allowed frontend origin for CORS (e.g. `http://localhost:5173` or comma-separated list).
- `DATABASE_URL`: Direct PostgreSQL connection URI from Supabase:
  - Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
- `DATABASE_SSL`: Enable SSL connection (`true`).
- `DATABASE_MAX_CONNECTIONS`: Max pool connections (default: `20`).
- `SUPABASE_URL`: Supabase project URL (`https://your-project.supabase.co`).
- `SUPABASE_ANON_KEY`: Supabase project anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (kept strictly server-side).

### Email Notification Configuration (Optional Provider Integration):
- `EMAIL_PROVIDER`: Active email provider (`'resend'` | `'sendgrid'` | `'smtp'` | `'none'`).
- `EMAIL_FROM`: Sender email identity (e.g. `CampusVoice <notifications@campusvoice.edu>`).
- `RESEND_API_KEY`: API key for Resend (`re_...`).
- `SENDGRID_API_KEY`: API key for SendGrid (`SG....`).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Standard SMTP transport credentials.
*Note: If no email provider is configured, the system operates in safe skip mode and will never falsely claim that an email was delivered.*

---

## 4. API Endpoints

### Student Feedback Endpoints
- `POST /api/v1/feedback` — Submit general campus feedback or grievance resolution review (1-5 stars).
- `GET /api/v1/feedback/my` — Retrieve student's own submitted feedback history.
- `GET /api/v1/admin/feedback` — Administrator feedback ledger with multi-criteria filtering.
- `GET /api/v1/admin/feedback/metrics` — Aggregate satisfaction scores, breakdown, and recurring concern analysis.

### Executive Reports & Analytics Endpoints
- `GET /api/v1/admin/reports` — Live database reports (status breakdown, category distribution, daily submissions, turnaround distribution, and department summaries).
- `GET /api/v1/admin/reports/export?format=csv` — Safe CSV export with formula injection protection and confidential student identity masking.

### Notifications Endpoints
- `GET /api/v1/notifications` — Notification stream for the authenticated user.
- `PUT /api/v1/notifications/:id/read` — Mark notification as read (with strict ownership enforcement).
- `PUT /api/v1/notifications/read-all` — Mark all notifications as read for current user.

---

## 5. Development & Migration Commands

```bash
# Install dependencies
npm install

# Run database schema migration on Supabase PostgreSQL
npm run migrate

# Start backend dev server with hot reload
npm run dev

# Run full backend test suite
npm test

# Build production TypeScript bundle
npm run build

# Start production server
npm start
```

---

## 6. Security & Access Control Policies

1. **Token Verification**: Every authenticated request is verified against Supabase Auth via `auth.getUser(token)`.
2. **Authoritative Roles**: Roles and identities are fetched from the database profiles table. User IDs or roles in request bodies are never trusted.
3. **Student Isolation**: Students can access only their own complaints and their own feedback.
4. **Confidential Identity Protection**: Sensitive grievances (harassment or confidential reports) automatically mask complainant identities as `[Protected Student Identity]` in both ledger views and CSV exports for non-chief administrators.
5. **Self-Escalation Guard**: Administrators are strictly prevented on both frontend and backend from modifying or escalating their own privilege levels.
6. **Internal Notes Sanitization**: Staff internal notes are stored in dedicated tables and stripped prior to dispatching responses to students.
7. **Email Delivery Transparency**: Email delivery status is captured honestly; the system never claims successful delivery without a verified receipt from the provider.
