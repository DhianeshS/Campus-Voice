import { useState } from 'react';
import { User, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  useToast,
} from '../components/ui';

export function ProfilePage() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const [fullName, setFullName] = useState(profile?.fullName || 'Alex Mercer');
  const [department, setDepartment] = useState(profile?.department || 'Computer Science & Engineering');
  const [studentId, setStudentId] = useState(profile?.studentId || 'CS-2026-042');
  const [academicYear, setAcademicYear] = useState(profile?.academicYear || '3rd Year Undergraduate');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    addToast({
      title: 'Profile Updated',
      message: 'Your student enrollment credentials have been refreshed.',
      variant: 'success',
    });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-3 border-b border-[#E5E0D5]">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]/40 mb-1 select-none">
          <User className="w-3 h-3 text-[#496B58]" />
          <span>Student Identity</span>
        </div>
        <h1 className="text-2xl font-bold text-[#292F2B] tracking-tight">
          My Institutional Profile
        </h1>
        <p className="text-xs text-[#68716A] mt-1 max-w-2xl">
          Review your verified enrollment details, academic affiliation, and institutional security standing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Student ID Badge Card */}
        <div className="space-y-4">
          <Card className="text-center p-6 bg-[#FAF8F3]/60 border-[#E5E0D5]">
            <div className="w-20 h-20 rounded-2xl bg-[#365442] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-subtle">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-bold text-base text-[#292F2B]">{fullName}</h3>
            <p className="text-xs text-[#68716A] mt-0.5">{user?.email || 'student@university.edu'}</p>
            <div className="mt-4 pt-4 border-t border-[#E5E0D5] flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]">
                <Shield className="w-3 h-3" />
                Verified Student
              </span>
            </div>
          </Card>

          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E5E0D5] text-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#8C948E] block">
              Enrollment Status
            </span>
            <div className="flex items-center gap-2 text-[#365442] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Active Academic Standing</span>
            </div>
            <p className="text-[11px] text-[#68716A] leading-relaxed">
              Authenticated through the CampusVoice single sign-on credential authority.
            </p>
          </div>
        </div>

        {/* Right Columns: Editable Enrollment Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="bg-[#FAF8F3]/50">
              <CardTitle>Academic & Personal Details</CardTitle>
              <CardDescription>
                Ensure your department and student roll number match official university records.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />

                  <Input
                    label="Student Roll / ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Academic Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />

                  <Input
                    label="Academic Year"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Institutional Email (Single Sign-On)"
                  value={user?.email || 'student@university.edu'}
                  disabled
                  helperText="University email cannot be altered directly. Contact registrar to update."
                />

                <div className="pt-2 flex items-center justify-between">
                  {saved && (
                    <span className="text-xs text-[#365442] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Changes saved successfully
                    </span>
                  )}
                  <Button type="submit" variant="primary" size="md" className="ml-auto">
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
