import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquareShare, User, Mail, IdCard, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button, Input, PasswordInput, Select, Checkbox, useToast } from '../components/ui';
import { AuthIllustration } from '../components/auth/AuthIllustration';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUpStudent, isConfigured } = useAuth();
  const { addToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [academicYear, setAcademicYear] = useState('1st Year (Undergraduate)');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Field-specific validation errors
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    studentId?: string;
    password?: string;
    confirmPassword?: string;
    agreeToTerms?: string;
    form?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full legal or campus name is required.';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter at least 2 characters.';
    }

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      newErrors.email = 'Institutional college email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = 'Please enter a valid academic email address.';
    }

    if (!studentId.trim()) {
      newErrors.studentId = 'Student registration / roll number is required.';
    }

    if (!password) {
      newErrors.password = 'Account password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      newErrors.password = 'Include uppercase, lowercase letters, and at least one number.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmation password is required.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreeToTerms) {
      newErrors.agreeToTerms = 'You must acknowledge the campus guidelines and terms.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    setIsLoading(true);

    const { error } = await signUpStudent({
      fullName,
      email,
      studentId,
      department,
      academicYear,
      password,
      agreeToTerms,
    });

    setIsLoading(false);

    if (error) {
      setErrors((prev) => ({
        ...prev,
        form: error.message || 'Registration encountered an issue. Please try again.',
      }));
      addToast({
        title: 'Registration Error',
        message: error.message || 'Unable to register student account.',
        variant: 'error',
      });
      return;
    }

    setIsSuccess(true);
    addToast({
      title: 'Student Account Created',
      message: 'Welcome to CampusVoice! Please verify your inbox or proceed to login.',
      variant: 'success',
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center bg-cream py-6 selection:bg-sage selection:text-surface">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="overflow-hidden rounded-2xl border border-[#E5E0D5] bg-[#FFFDF8] shadow-card grid grid-cols-1 lg:grid-cols-12 min-h-[700px]">
          
          {/* LEFT PANEL: Branding & Community Pledge (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#F7F4EC] via-[#FAF8F3] to-[#E6EDE5]/40 p-10 flex-col justify-between border-r border-[#E5E0D5] relative overflow-hidden select-none">
            <div className="space-y-4">
              <Link to="/" className="inline-flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-[#365442] text-[#FFFDF8] flex items-center justify-center shadow-xs group-hover:bg-[#2A4234] transition-colors">
                  <MessageSquareShare className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-lg text-[#292F2B] tracking-tight block">
                    CampusVoice
                  </span>
                  <span className="text-[11px] text-[#68716A] font-medium tracking-wide block">
                    Your Voice. A Better Tomorrow.
                  </span>
                </div>
              </Link>

              <div className="pt-6 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#496B58] block">
                  Student Registration
                </span>
                <h2 className="text-2xl font-serif italic text-[#292F2B] font-semibold leading-snug">
                  Every voice matters.
                </h2>
                <p className="text-xs text-[#68716A] leading-relaxed max-w-sm">
                  Register with your official student credentials to submit grievances, participate in facility surveys, and stay informed on campus remediations.
                </p>
              </div>

              {/* Security Pill */}
              <div className="p-3.5 rounded-xl bg-[#FFFDF8] border border-[#E5E0D5] text-xs text-[#292F2B] space-y-1">
                <div className="flex items-center gap-2 font-semibold text-[#365442]">
                  <ShieldCheck className="w-4 h-4 text-[#496B58]" />
                  <span>Student Identity Protection</span>
                </div>
                <p className="text-[11px] text-[#68716A] leading-relaxed">
                  Your identity is kept confidential from respondents unless explicitly authorized during formal investigation.
                </p>
              </div>
            </div>

            {/* Botanical Graphic */}
            <div className="py-4 my-auto">
              <AuthIllustration />
            </div>

            <div className="pt-4 border-t border-[#E5E0D5]/70 text-[11px] text-[#68716A]">
              <span>Already registered? </span>
              <Link to="/login" className="font-semibold text-[#365442] underline">
                Sign In here
              </Link>
            </div>
          </div>

          {/* RIGHT PANEL: Student Registration Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-[#FFFDF8]">
            <div className="max-w-lg w-full mx-auto space-y-6">
              
              {/* Heading */}
              <div>
                <h1 className="text-2xl font-bold text-[#292F2B] tracking-tight">
                  Student Account Registration
                </h1>
                <p className="text-xs text-[#68716A] mt-1">
                  Create your profile to submit concerns and monitor resolution timelines.
                </p>
              </div>

              {/* Informative Configuration Notice if Supabase keys pending */}
              {!isConfigured && (
                <div className="p-3.5 rounded-xl bg-[#E6EDE5]/50 border border-[#A7B8A5]/60 text-xs text-[#292F2B] space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-[#365442]">
                    <ShieldCheck className="w-4 h-4 text-[#496B58] shrink-0" />
                    <span>Instant Local Registration Active</span>
                  </div>
                  <p className="text-[11px] text-[#68716A] leading-relaxed">
                    You can register and sign in immediately. Your student profile and lodged complaints will persist securely in your local environment.
                  </p>
                </div>
              )}

              {/* Success Screen */}
              {isSuccess ? (
                <div className="p-6 rounded-2xl bg-[#E6EDE5]/70 border border-[#A7B8A5] text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-xl bg-[#365442] text-white flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#292F2B]">Student Account Created!</h3>
                    <p className="text-xs text-[#68716A] leading-relaxed max-w-sm mx-auto">
                      Welcome, <strong>{fullName}</strong>! Your account has been registered and initialized for <strong>{email}</strong>.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => navigate('/dashboard')}
                      endIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Enter Student Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => navigate('/login')}
                    >
                      Sign In Page
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {errors.form && (
                    <div className="p-3.5 rounded-xl bg-[#FAF2EE] border border-[#DEAF9F] text-xs text-[#B8755D] flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B8755D]" />
                      <span>{errors.form}</span>
                    </div>
                  )}

                  {/* Full Name & Student ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Legal Name"
                      required
                      placeholder="e.g., Alex Mercer"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      error={errors.fullName}
                      startIcon={<User className="w-4 h-4" />}
                    />

                    <Input
                      label="Student Roll / ID Number"
                      required
                      placeholder="e.g., CS-2026-042"
                      value={studentId}
                      onChange={(e) => {
                        setStudentId(e.target.value);
                        if (errors.studentId) setErrors((prev) => ({ ...prev, studentId: undefined }));
                      }}
                      error={errors.studentId}
                      startIcon={<IdCard className="w-4 h-4" />}
                    />
                  </div>

                  {/* College Email */}
                  <Input
                    label="Official College / Institutional Email"
                    type="email"
                    required
                    placeholder="alex.mercer@university.edu"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    error={errors.email}
                    helperText="Must be an authorized academic domain email."
                    startIcon={<Mail className="w-4 h-4" />}
                  />

                  {/* Department & Academic Year Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      options={[
                        { value: 'Computer Science & Engineering', label: 'Computer Science & Eng.' },
                        { value: 'Electrical & Electronics Engineering', label: 'Electrical & Electronics' },
                        { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
                        { value: 'Civil & Environmental Engineering', label: 'Civil Engineering' },
                        { value: 'Business Administration & Management', label: 'Business Administration' },
                        { value: 'Sciences & Humanities', label: 'Sciences & Humanities' },
                        { value: 'Architecture & Design', label: 'Architecture & Design' },
                      ]}
                    />

                    <Select
                      label="Academic Year"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      options={[
                        { value: '1st Year (Undergraduate)', label: '1st Year (Undergraduate)' },
                        { value: '2nd Year (Undergraduate)', label: '2nd Year (Undergraduate)' },
                        { value: '3rd Year (Undergraduate)', label: '3rd Year (Undergraduate)' },
                        { value: '4th Year (Undergraduate)', label: '4th Year (Undergraduate)' },
                        { value: 'Postgraduate / Master Degree', label: 'Postgraduate / Master' },
                        { value: 'Doctoral / Ph.D. Researcher', label: 'Doctoral / Ph.D.' },
                      ]}
                    />
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PasswordInput
                      label="Create Password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      error={errors.password}
                      helperText="Min 8 chars, mixed case & number."
                    />

                    <PasswordInput
                      label="Confirm Password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }}
                      error={errors.confirmPassword}
                    />
                  </div>

                  {/* Terms & Guidelines Checkbox */}
                  <div className="pt-2">
                    <Checkbox
                      id="agree-terms"
                      label="I agree to the Community Guidelines and Student Grievance Ethics Code"
                      description="I certify that all complaints submitted under this account will reflect genuine campus observations."
                      checked={agreeToTerms}
                      onChange={(e) => {
                        setAgreeToTerms(e.target.checked);
                        if (errors.agreeToTerms) setErrors((prev) => ({ ...prev, agreeToTerms: undefined }));
                      }}
                      error={errors.agreeToTerms}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full justify-center shadow-sm"
                      isLoading={isLoading}
                      endIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Complete Student Registration
                    </Button>
                  </div>
                </form>
              )}

              {/* Footer Switcher */}
              <div className="pt-4 border-t border-[#E5E0D5]/70 text-center text-xs text-[#68716A]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[#365442] hover:text-[#2A4234] underline underline-offset-2"
                >
                  Sign in here
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
