import { executeQuery, getDbPool } from '../db/database';
import type { CategoryInfo } from '../types';

const INITIAL_CATEGORIES: CategoryInfo[] = [
  {
    id: 'academics',
    name: 'Academics & Curriculum',
    description: 'Issues relating to syllabus, lectures, examinations, and grading.',
    department: 'Academic Affairs Division',
    isActive: true,
  },
  {
    id: 'faculty',
    name: 'Faculty-related concerns',
    description: 'Inquiries or feedback regarding faculty mentorship and guidance.',
    department: 'Academic Affairs Division',
    isActive: true,
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure & Classroom Facilities',
    description: 'Classrooms, laboratory equipment, power supply, and washrooms.',
    department: 'Campus Facilities & Civil Works',
    isActive: true,
  },
  {
    id: 'hostel',
    name: 'Hostel Facilities & Accommodation',
    description: 'Room maintenance, hot water, plumbing, mess quality, and laundry.',
    department: 'Hostel Administration & Chief Warden',
    isActive: true,
  },
  {
    id: 'library',
    name: 'Library Services',
    description: 'Book borrowing, digital subscriptions, silent study spaces, and cataloging.',
    department: 'University Central Library & Learning Hub',
    isActive: true,
  },
  {
    id: 'transportation',
    name: 'Campus Transportation',
    description: 'Campus shuttle buses, route timings, pass distribution, and parking.',
    department: 'University Transport Services',
    isActive: true,
  },
  {
    id: 'cleanliness',
    name: 'Campus Cleanliness & Waste Management',
    description: 'Sanitation, garbage collection, and pest control.',
    department: 'Campus Facilities & Civil Works',
    isActive: true,
  },
  {
    id: 'it_services',
    name: 'Information Technology & Wi-Fi',
    description: 'Campus Wi-Fi connectivity, portal credentials, and computer labs.',
    department: 'Information Technology & Networking Directorate',
    isActive: true,
  },
  {
    id: 'administration',
    name: 'Administrative Services',
    description: 'Scholarship processing, fee receipts, identity cards, and certificates.',
    department: 'University Ombudsman Directorate',
    isActive: true,
  },
  {
    id: 'harassment_misconduct',
    name: 'Harassment or Misconduct',
    description: 'Bullying, discriminatory behavior, or inappropriate conduct. Confidential investigation.',
    department: 'Internal Complaints Committee (ICC)',
    isActive: true,
  },
  {
    id: 'other',
    name: 'Other University Concerns',
    description: 'General concerns not categorized above.',
    department: 'University Ombudsman Directorate',
    isActive: true,
  },
];

const MEMORY_CATEGORIES = new Map<string, CategoryInfo>(
  INITIAL_CATEGORIES.map((c) => [c.id, { ...c }])
);

export const categoryRepository = {
  async listCategories(): Promise<CategoryInfo[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `SELECT id, name, description, department_name as department, 
                  default_sla_hours as "defaultSlaHours", is_active as "isActive"
           FROM public.complaint_categories
           ORDER BY name ASC`
        );
        if (res.rows.length > 0) return res.rows;
      } catch (err) {
        // Fall back to memory
      }
    }

    return Array.from(MEMORY_CATEGORIES.values());
  },

  async getCategoryById(id: string): Promise<CategoryInfo | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `SELECT id, name, description, department_name as department, 
                  default_sla_hours as "defaultSlaHours", is_active as "isActive"
           FROM public.complaint_categories
           WHERE id = $1`,
          [id]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        // Fall back to memory
      }
    }

    return MEMORY_CATEGORIES.get(id) || null;
  },

  async saveCategory(category: CategoryInfo): Promise<CategoryInfo> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `INSERT INTO public.complaint_categories (id, name, description, department_name, is_active, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             department_name = EXCLUDED.department_name,
             is_active = EXCLUDED.is_active,
             updated_at = NOW()
           RETURNING id, name, description, department_name as department, is_active as "isActive"`,
          [category.id, category.name, category.description, category.department, category.isActive]
        );
        if (res.rows.length > 0) {
          MEMORY_CATEGORIES.set(category.id, res.rows[0]);
          return res.rows[0];
        }
      } catch (err) {
        // Fall back to memory
      }
    }

    MEMORY_CATEGORIES.set(category.id, category);
    return category;
  },
};
