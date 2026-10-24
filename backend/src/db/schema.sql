-- ====================================================================
-- CampusVoice Enterprise Database Schema for Supabase PostgreSQL
-- Student Complaint & Grievance Feedback Management System
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumerated Domain Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'staff', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE complaint_status AS ENUM (
    'submitted',
    'under_review',
    'assigned',
    'in_progress',
    'awaiting_information',
    'resolved',
    'closed',
    'reopened',
    'pending',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'status_update',
    'investigation',
    'resolution',
    'system',
    'assignment',
    'info_requested',
    'reopened'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Atomic Reference Number Generator Sequence
CREATE SEQUENCE IF NOT EXISTS complaint_ref_seq START WITH 1001;

-- 4. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  head_officer TEXT,
  contact_email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. User Profiles Table (extends Supabase auth.users without duplicating passwords)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- Maps 1:1 with auth.users.id
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  student_id TEXT, -- University Matriculation Number
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  department_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Complaint Categories Table (11 Institutional Classifications)
CREATE TABLE IF NOT EXISTS public.complaint_categories (
  id TEXT PRIMARY KEY, -- e.g. 'academics', 'infrastructure', 'harassment_misconduct'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  department_name TEXT NOT NULL,
  default_sla_hours INTEGER NOT NULL DEFAULT 48 CHECK (default_sla_hours > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Complaints Table (Primary Grievance Registry)
CREATE TABLE IF NOT EXISTS public.complaints (
  id TEXT PRIMARY KEY, -- e.g. 'CMP-2026-1042'
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 150),
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  category_id TEXT NOT NULL REFERENCES public.complaint_categories(id) ON DELETE RESTRICT,
  priority complaint_priority NOT NULL DEFAULT 'medium',
  status complaint_status NOT NULL DEFAULT 'submitted',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  department_name TEXT,
  location TEXT,
  follow_up_preferences JSONB NOT NULL DEFAULT '{"notificationMethod": "email", "preferredContactTime": "anytime", "isConfidential": false}'::jsonb,
  is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  resolution_summary TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Complaint Attachments Metadata Table
CREATE TABLE IF NOT EXISTS public.complaint_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760), -- 10MB limit
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Complaint Updates Table (Status Transitions & Student-Visible Notes)
CREATE TABLE IF NOT EXISTS public.complaint_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  actor_role user_role NOT NULL,
  old_status complaint_status,
  new_status complaint_status NOT NULL,
  public_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Private Administrator Notes Table (Strictly Hidden from Student Responses)
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role user_role NOT NULL CHECK (author_role IN ('admin', 'staff')),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Student Feedback Table (Supports Complaint Resolution & General Campus Feedback)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id TEXT REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL DEFAULT 'complaint_resolution' CHECK (feedback_type IN ('complaint_resolution', 'general_campus')),
  category VARCHAR(100),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_complaint_feedback UNIQUE(complaint_id, user_id)
);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  complaint_id TEXT REFERENCES public.complaints(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'status_update',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Append-Only Institutional Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id TEXT REFERENCES public.complaints(id) ON DELETE SET NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_email TEXT NOT NULL,
  actor_role user_role NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- Performance Indexes & Query Optimizations
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_user ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned ON public.complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_attachments ON public.complaint_attachments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates ON public.complaint_updates(complaint_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_admin_notes_complaint ON public.admin_notes(complaint_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_complaint ON public.audit_logs(complaint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- ====================================================================
-- Seed Institutional Core Taxonomy & Departments
-- ====================================================================
INSERT INTO public.departments (code, name, head_officer, contact_email) VALUES
  ('ESTATE', 'Campus Facilities & Civil Works', 'Engr. David Chen', 'facilities@university.edu'),
  ('ACADEMIC', 'Academic Affairs Division', 'Prof. Rajesh Kulkarni', 'academics@university.edu'),
  ('HOSTEL', 'Hostel Administration & Chief Warden', 'Col. Marcus Sterling (Retd.)', 'hostel@university.edu'),
  ('ICC', 'Internal Complaints Committee (ICC)', 'Dr. Anita Desai', 'icc@university.edu'),
  ('IT', 'Information Technology & Networking Directorate', 'Vikram Joshi', 'it-support@university.edu'),
  ('TRANSPORT', 'University Transport Services', 'G. Balakrishnan', 'transport@university.edu'),
  ('LIBRARY', 'University Central Library & Learning Hub', 'Dr. S. Meenakshi', 'library@university.edu'),
  ('OMBUDSMAN', 'University Ombudsman Directorate', 'Dr. Evelyn Vance', 'ombudsman@university.edu')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.complaint_categories (id, name, description, department_name, default_sla_hours) VALUES
  ('academics', 'Academics & Curriculum', 'Issues relating to syllabus, lectures, examinations, and grading.', 'Academic Affairs Division', 48),
  ('faculty', 'Faculty-related concerns', 'Inquiries or feedback regarding faculty mentorship and guidance.', 'Academic Affairs Division', 48),
  ('infrastructure', 'Infrastructure & Classroom Facilities', 'Classrooms, laboratory equipment, power supply, and washrooms.', 'Campus Facilities & Civil Works', 48),
  ('hostel', 'Hostel Facilities & Accommodation', 'Room maintenance, hot water, plumbing, mess quality, and laundry.', 'Hostel Administration & Chief Warden', 24),
  ('library', 'Library Services', 'Book borrowing, digital subscriptions, silent study spaces, and cataloging.', 'University Central Library & Learning Hub', 48),
  ('transportation', 'Campus Transportation', 'Campus shuttle buses, route timings, pass distribution, and parking.', 'University Transport Services', 48),
  ('cleanliness', 'Campus Cleanliness & Waste Management', 'Sanitation, garbage collection, and pest control.', 'Campus Facilities & Civil Works', 24),
  ('it_services', 'Information Technology & Wi-Fi', 'Campus Wi-Fi connectivity, portal credentials, and computer labs.', 'Information Technology & Networking Directorate', 24),
  ('administration', 'Administrative Services', 'Scholarship processing, fee receipts, identity cards, and certificates.', 'University Ombudsman Directorate', 72),
  ('harassment_misconduct', 'Harassment or Misconduct', 'Bullying, discriminatory behavior, or inappropriate conduct. Confidential investigation.', 'Internal Complaints Committee (ICC)', 24),
  ('other', 'Other University Concerns', 'General concerns not categorized above.', 'University Ombudsman Directorate', 48)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  department_name = EXCLUDED.department_name,
  default_sla_hours = EXCLUDED.default_sla_hours;

-- ====================================================================
-- 15. Automated Supabase Auth Profile Synchronization Trigger
-- Automatically populates public.profiles whenever a user signs up via auth.users
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    student_id,
    department_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'fullName',
      NEW.raw_user_meta_data->>'full_name',
      split_part(COALESCE(NEW.email, 'student'), '@', 1)
    ),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', '')::user_role,
      'student'::user_role
    ),
    NEW.raw_user_meta_data->>'studentId',
    NEW.raw_user_meta_data->>'department',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    student_id = COALESCE(EXCLUDED.student_id, public.profiles.student_id),
    department_name = COALESCE(EXCLUDED.department_name, public.profiles.department_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users from auth.users into public.profiles
INSERT INTO public.profiles (id, email, full_name, role, student_id, department_name, created_at, updated_at)
SELECT 
  id,
  COALESCE(email, ''),
  COALESCE(
    raw_user_meta_data->>'fullName',
    raw_user_meta_data->>'full_name',
    split_part(COALESCE(email, 'student'), '@', 1)
  ),
  COALESCE(
    NULLIF(raw_user_meta_data->>'role', '')::user_role,
    'student'::user_role
  ),
  raw_user_meta_data->>'studentId',
  raw_user_meta_data->>'department',
  created_at,
  NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  student_id = COALESCE(EXCLUDED.student_id, public.profiles.student_id),
  department_name = COALESCE(EXCLUDED.department_name, public.profiles.department_name),
  updated_at = NOW();

