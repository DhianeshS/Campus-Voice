import { executeQuery, getDbPool } from '../db/database';
import type { UserProfile, UserRole } from '../types';

// Seed memory store for fallback when database is in standby mode
const MEMORY_PROFILES = new Map<string, UserProfile>([
  [
    '0096fa2a-be2d-45d5-9d20-28d956942664',
    {
      id: '0096fa2a-be2d-45d5-9d20-28d956942664',
      email: 'dhianeshs26@gmail.com',
      fullName: 'Dhianesh',
      role: 'admin',
      studentId: '922524106055',
      department: 'Electrical & Electronics Engineering',
      createdAt: '2026-10-24T02:55:33Z',
    },
  ],
  [
    'usr_admin_default',
    {
      id: 'usr_admin_default',
      email: 'admin@university.edu',
      fullName: 'Dr. Evelyn Vance',
      role: 'admin',
      department: 'University Ombudsman Directorate',
      createdAt: '2026-08-15T09:00:00Z',
    },
  ],
  [
    'usr_staff_facilities',
    {
      id: 'usr_staff_facilities',
      email: 'david.chen@university.edu',
      fullName: 'Engr. David Chen',
      role: 'staff',
      department: 'Campus Facilities & Maintenance',
      createdAt: '2026-09-01T10:30:00Z',
    },
  ],
  [
    'usr_staff_icc',
    {
      id: 'usr_staff_icc',
      email: 'anita.desai@university.edu',
      fullName: 'Dr. Anita Desai',
      role: 'admin',
      department: 'Internal Complaints Committee',
      createdAt: '2026-08-20T11:00:00Z',
    },
  ],
  [
    'usr_student_alex',
    {
      id: 'usr_student_alex',
      email: 'alex.mercer@university.edu',
      fullName: 'Alex Mercer',
      role: 'student',
      studentId: 'CS-2026-042',
      department: 'Computer Science & Engineering',
      academicYear: '3rd Year Undergraduate',
      createdAt: '2026-10-01T08:00:00Z',
    },
  ],
]);

export const profileRepository = {
  async getProfileById(id: string): Promise<UserProfile | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `SELECT id, email, full_name as "fullName", role, student_id as "studentId", 
                  department_name as department, phone, avatar_url as "avatarUrl", 
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM public.profiles 
           WHERE id = $1`,
          [id]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        // Fall back to memory
      }
    }

    return MEMORY_PROFILES.get(id) || null;
  },

  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `SELECT id, email, full_name as "fullName", role, student_id as "studentId", 
                  department_name as department, phone, avatar_url as "avatarUrl", 
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM public.profiles 
           WHERE email = $1`,
          [email.toLowerCase().trim()]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        // Fall back to memory
      }
    }

    for (const p of MEMORY_PROFILES.values()) {
      if (p.email.toLowerCase() === email.toLowerCase().trim()) return p;
    }
    return null;
  },

  async upsertProfile(profile: UserProfile): Promise<UserProfile> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `INSERT INTO public.profiles (id, email, full_name, role, student_id, department_name, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             role = EXCLUDED.role,
             student_id = COALESCE(EXCLUDED.student_id, public.profiles.student_id),
             department_name = COALESCE(EXCLUDED.department_name, public.profiles.department_name),
             updated_at = NOW()
           RETURNING id, email, full_name as "fullName", role, student_id as "studentId", 
                     department_name as department, created_at as "createdAt", updated_at as "updatedAt"`,
          [
            profile.id,
            profile.email.toLowerCase().trim(),
            profile.fullName,
            profile.role,
            profile.studentId || null,
            profile.department || null,
          ]
        );
        if (res.rows.length > 0) {
          MEMORY_PROFILES.set(profile.id, res.rows[0]);
          return res.rows[0];
        }
      } catch (err) {
        // Fall back to memory
      }
    }

    MEMORY_PROFILES.set(profile.id, profile);
    return profile;
  },

  async updateUserRole(id: string, newRole: UserRole): Promise<UserProfile> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `UPDATE public.profiles 
           SET role = $1, updated_at = NOW()
           WHERE id = $2
           RETURNING id, email, full_name as "fullName", role, student_id as "studentId", 
                     department_name as department, created_at as "createdAt", updated_at as "updatedAt"`,
          [newRole, id]
        );
        if (res.rows.length > 0) {
          MEMORY_PROFILES.set(id, res.rows[0]);
          return res.rows[0];
        }
      } catch (err) {
        // Fall back to memory
      }
    }

    const existing = MEMORY_PROFILES.get(id);
    if (!existing) {
      throw new Error(`User with ID ${id} not found.`);
    }
    const updated = { ...existing, role: newRole, updatedAt: new Date().toISOString() };
    MEMORY_PROFILES.set(id, updated);
    return updated;
  },

  async listUsers(search?: string, roleFilter?: string): Promise<UserProfile[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        let sql = `SELECT id, email, full_name as "fullName", role, student_id as "studentId", 
                          department_name as department, created_at as "createdAt", updated_at as "updatedAt"
                   FROM public.profiles WHERE 1=1`;
        const params: unknown[] = [];

        if (roleFilter && roleFilter !== 'all') {
          params.push(roleFilter);
          sql += ` AND role = $${params.length}`;
        }

        if (search && search.trim()) {
          params.push(`%${search.trim().toLowerCase()}%`);
          sql += ` AND (LOWER(full_name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(student_id) LIKE $${params.length})`;
        }

        sql += ` ORDER BY created_at DESC`;
        const res = await executeQuery<any>(sql, params);
        if (res.rows.length > 0) return res.rows;
      } catch (err) {
        // Fall back to memory
      }
    }

    let users = Array.from(MEMORY_PROFILES.values());
    if (roleFilter && roleFilter !== 'all') {
      users = users.filter((u) => u.role === roleFilter);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.studentId && u.studentId.toLowerCase().includes(q))
      );
    }
    return users;
  },
};
