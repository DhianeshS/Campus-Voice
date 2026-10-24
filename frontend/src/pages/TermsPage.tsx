import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Card, CardContent } from '../components/ui';

export function TermsPage() {
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
          <FileText className="w-4 h-4" />
          <span>Institutional Policies</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#292F2B] tracking-tight">
          Terms of Service & Community Guidelines
        </h1>
        <p className="text-xs text-[#68716A]">
          Effective Academic Year 2026–2027 • CampusVoice Platform Integrity
        </p>
      </div>

      <Card variant="elevated">
        <CardContent className="p-6 sm:p-8 space-y-6 text-sm text-[#292F2B] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#292F2B]">1. Acceptance of Community Standards</h2>
            <p className="text-xs text-[#68716A] leading-relaxed">
              By accessing CampusVoice, students, faculty, and administrative staff agree to submit and resolve grievances in good faith, adhering to standards of factual accuracy, mutual respect, and academic integrity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#292F2B]">2. Student Identity & Confidentiality</h2>
            <p className="text-xs text-[#68716A] leading-relaxed">
              Submissions tagged with confidentiality retain protected status. Department investigators will evaluate grievances based on objective observations without disclosing complainant identities unless required for safety investigations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#292F2B]">3. Prohibition of Fabricated Claims</h2>
            <p className="text-xs text-[#68716A] leading-relaxed">
              Falsifying claims, impersonating students or staff, or submitting knowingly misleading grievances violates the university disciplinary code and may result in account suspension.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#292F2B]">4. Resolution Lifecycles & Audit Trails</h2>
            <p className="text-xs text-[#68716A] leading-relaxed">
              Every status modification—from pending review to resolution—is recorded with an immutable timestamp and the actor’s role to guarantee transparency across administrative departments.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
