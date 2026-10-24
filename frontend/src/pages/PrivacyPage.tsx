import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Card, CardContent } from '../components/ui';

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#68716A] hover:text-[#292F2B] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Login
      </Link>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#496B58]">
          <Shield className="w-4 h-4" />
          <span>Data Protection & Privacy</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#292F2B] tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#68716A]">
          CampusVoice Data Safeguards & Student Identity Governance
        </p>
      </div>

      <Card variant="elevated">
        <CardContent className="p-6 sm:p-8 space-y-6 text-sm text-[#292F2B] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#292F2B]">1. Information We Collect</h2>
            <p className="text-xs text-[#68716A] leading-relaxed">
              We collect student enrollment numbers, academic email addresses, department affiliations, and submitted grievance text. All passwords are encrypted using one-way cryptographic hashing managed by Supabase Auth; plaintext passwords are never stored or transmitted.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#292F2B]">2. Row-Level Security (RLS) Enforcement</h2>
            <p className="text-xs text-[#68716A] leading-relaxed">
              Our PostgreSQL database enforces PostgreSQL Row-Level Security policies. Students can only query grievances submitted by their authenticated user token, while verified department heads are granted scoped access based on strict role authorization.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#292F2B]">3. Third-Party Sharing Policy</h2>
            <p className="text-xs text-[#68716A] leading-relaxed">
              CampusVoice does not sell, license, or share student records or grievance content with commercial entities, advertising platforms, or external third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#292F2B]">4. Data Retention & Erasure</h2>
            <p className="text-xs text-[#68716A] leading-relaxed">
              Students may request deletion of resolved personal grievances in accordance with university institutional records management standards.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
