import { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  useToast,
} from '../../components/ui';

export function AdminSettingsPage() {
  const { addToast } = useToast();

  const [triageHours, setTriageHours] = useState('24');
  const [resolutionHours, setResolutionHours] = useState('48');
  const [escalationWarningHours, setEscalationWarningHours] = useState('36');
  const [autoMaskSensitive, setAutoMaskSensitive] = useState(true);
  const [ombudspersonEmail, setOmbudspersonEmail] = useState('ombudsman@university.edu');
  const [digestFrequency, setDigestFrequency] = useState('daily');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    addToast({
      title: 'Institutional Policy Saved',
      message: 'Service-level agreements and compliance parameters have been updated.',
      variant: 'success',
    });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5E0D5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4] mb-1 select-none">
            <Lock className="w-3 h-3 text-[#B8755D]" />
            <span>Institutional Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F2B] tracking-tight">
            SLA Policy & Administrative Governance
          </h1>
          <p className="text-xs text-[#68716A] mt-1 max-w-2xl leading-relaxed">
            Configure institutional service-level agreements, automated escalation timers, confidentiality redaction rules, and ombudsman routing.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          startIcon={saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
        >
          {saved ? 'Settings Saved' : 'Save Policy Changes'}
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 2. Service Level Agreement Parameters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#365442]" />
                <CardTitle className="text-sm font-bold text-[#292F2B]">
                  Service Level Agreement (SLA) Targets
                </CardTitle>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]">
                Active Policy: Standard 48h Resolution
              </span>
            </div>
            <CardDescription className="text-xs text-[#68716A]">
              Governs overdue calculation across the administrator workspace and grievance dashboards.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#292F2B] mb-1">
                  Initial Triage Window (Hours)
                </label>
                <Input
                  type="number"
                  min="6"
                  max="72"
                  value={triageHours}
                  onChange={(e) => setTriageHours(e.target.value)}
                  className="text-xs"
                />
                <span className="text-[10px] text-[#8C948E] mt-1 block">
                  Time allocated to review and assign an initial officer.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#292F2B] mb-1">
                  Escalation Warning Threshold (Hours)
                </label>
                <Input
                  type="number"
                  min="12"
                  max="120"
                  value={escalationWarningHours}
                  onChange={(e) => setEscalationWarningHours(e.target.value)}
                  className="text-xs"
                />
                <span className="text-[10px] text-[#8C948E] mt-1 block">
                  Triggers amber priority tag before case breaches SLA.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#292F2B] mb-1">
                  Default Resolution SLA (Hours)
                </label>
                <Input
                  type="number"
                  min="24"
                  max="168"
                  value={resolutionHours}
                  onChange={(e) => setResolutionHours(e.target.value)}
                  className="text-xs"
                />
                <span className="text-[10px] text-[#8C948E] mt-1 block">
                  Cases exceeding this threshold are marked Overdue.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Confidentiality & Student Privacy Governance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#365442]" />
              <CardTitle className="text-sm font-bold text-[#292F2B]">
                Student Confidentiality & Sensitive Case Routing
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-[#68716A]">
              Safeguards whistleblower identity and sensitive misconduct reports.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <span className="font-semibold text-[#292F2B] block">
                  Automatic Student Identity Masking
                </span>
                <p className="text-[11px] text-[#68716A]">
                  Automatically replace student matriculation numbers and names with <code className="bg-[#E6EDE5] px-1 py-0.5 rounded font-mono text-[10px]">[Protected Student Identity]</code> on general administrator tables for sensitive grievances (Harassment, Misconduct, Whistleblower reports).
                </p>
              </div>

              <input
                type="checkbox"
                checked={autoMaskSensitive}
                onChange={(e) => setAutoMaskSensitive(e.target.checked)}
                className="w-4 h-4 accent-[#365442] rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#292F2B] mb-1">
                  Institutional Ombudsman Direct Routing Email
                </label>
                <Input
                  type="email"
                  value={ombudspersonEmail}
                  onChange={(e) => setOmbudspersonEmail(e.target.value)}
                  className="text-xs"
                />
                <span className="text-[10px] text-[#8C948E] mt-1 block">
                  Receives automated dispatch for escalated and whistleblower cases.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#292F2B] mb-1">
                  Overdue Digest Notification Frequency
                </label>
                <Select
                  value={digestFrequency}
                  onChange={(e) => setDigestFrequency(e.target.value)}
                  options={[
                    { label: 'Real-time (Immediate upon SLA breach)', value: 'immediate' },
                    { label: 'Daily Morning Digest (08:00 AM)', value: 'daily' },
                    { label: 'Bi-Weekly Administrative Briefing', value: 'biweekly' },
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Action Confirmation */}
        <div className="pt-2 flex justify-end">
          <Button
            variant="primary"
            size="md"
            type="submit"
            startIcon={saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          >
            {saved ? 'Policy Saved Successfully' : 'Save Institutional Policy'}
          </Button>
        </div>
      </form>
    </div>
  );
}
