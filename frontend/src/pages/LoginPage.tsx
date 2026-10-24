import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquareShare, Mail, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { Button, Input, PasswordInput, Checkbox, useToast } from '../components/ui';
import { AuthIllustration } from '../components/auth/AuthIllustration';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isConfigured } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect destination after successful login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const validate = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setEmailError('Please enter your email address.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Please enter your account password.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    setIsLoading(true);
    setFormError('');

    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      setFormError(error.message || 'Authentication failed. Please verify your credentials.');
      addToast({
        title: 'Sign In Failed',
        message: error.message || 'Invalid email or password.',
        variant: 'error',
      });
      return;
    }

    addToast({
      title: 'Welcome Back',
      message: 'You have signed in to CampusVoice successfully.',
      variant: 'success',
    });
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center bg-cream selection:bg-sage selection:text-surface">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="overflow-hidden rounded-2xl border border-[#E5E0D5] bg-[#FFFDF8] shadow-card grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* LEFT PANEL: Branding, Tagline, & Botanical Architectural Motif (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#F7F4EC] via-[#FAF8F3] to-[#E6EDE5]/40 p-10 flex-col justify-between border-r border-[#E5E0D5] relative overflow-hidden select-none">
            {/* Top Brand Mark */}
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
                  Student Grievance Ecosystem
                </span>
                <h2 className="text-2xl font-serif italic text-[#292F2B] font-semibold leading-snug">
                  A simpler way to be heard.
                </h2>
                <p className="text-xs text-[#68716A] leading-relaxed max-w-sm">
                  Voice campus issues transparently, monitor departmental investigation milestones, and hold administration accountable with verified progress tracking.
                </p>
              </div>
            </div>

            {/* Botanical Campus Motif */}
            <div className="py-6 my-auto">
              <AuthIllustration />
            </div>

            {/* Bottom Tagline & Assurance */}
            <div className="pt-4 border-t border-[#E5E0D5]/70 flex items-center justify-between text-[11px] text-[#68716A]">
              <span className="italic font-serif">"Your Campus. Your Voice."</span>
              <span className="flex items-center gap-1 text-[#365442]">
                <Shield className="w-3.5 h-3.5 text-[#496B58]" />
                Supabase Auth Protected
              </span>
            </div>
          </div>

          {/* RIGHT PANEL: Form Inputs & Actions */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-[#FFFDF8]">
            {/* Mobile Header Branding */}
            <div className="lg:hidden flex items-center gap-3 mb-6 pb-4 border-b border-[#E5E0D5]">
              <div className="w-9 h-9 rounded-lg bg-[#365442] text-[#FFFDF8] flex items-center justify-center shadow-xs">
                <MessageSquareShare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base text-[#292F2B] block">CampusVoice</span>
                <span className="text-[10px] text-[#68716A] block">Your Campus. Your Voice. A Better Tomorrow.</span>
              </div>
            </div>

            <div className="max-w-md w-full mx-auto space-y-6">
              {/* Form Heading */}
              <div>
                <h1 className="text-2xl font-bold text-[#292F2B] tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-xs text-[#68716A] mt-1">
                  Enter your campus credentials to access your complaints and notifications.
                </p>
              </div>

              {/* Informative Configuration Notice if Supabase keys pending */}
              {!isConfigured && (
                <div className="p-3.5 rounded-xl bg-[#E6EDE5]/50 border border-[#A7B8A5]/60 text-xs text-[#292F2B] space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-[#365442]">
                    <Shield className="w-4 h-4 text-[#496B58] shrink-0" />
                    <span>Instant Local Sign-In Active</span>
                  </div>
                  <p className="text-[11px] text-[#68716A] leading-relaxed">
                    Local mode is ready. Enter your student email and password to log in directly to your campus dashboard.
                  </p>
                </div>
              )}

              {/* Server Form Error Banner */}
              {formError && (
                <div
                  className="p-3.5 rounded-xl bg-[#FAF2EE] border border-[#DEAF9F] text-xs text-[#B8755D] flex items-start gap-2.5 animate-in fade-in"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B8755D]" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                  label="Campus Email Address"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  error={emailError}
                  startIcon={<Mail className="w-4 h-4" />}
                />

                <div className="space-y-1">
                  <PasswordInput
                    label="Account Password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    error={passwordError}
                  />

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <Checkbox
                      id="remember-me"
                      label="Remember me on this device"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />

                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-[#496B58] hover:text-[#365442] hover:underline transition-colors shrink-0"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-sm"
                    isLoading={isLoading}
                    endIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Sign In to CampusVoice
                  </Button>
                </div>
              </form>

              {/* Navigation Options: Student Register & Admin Portal */}
              <div className="pt-4 border-t border-[#E5E0D5]/70 space-y-3 text-center">
                <p className="text-xs text-[#68716A]">
                  Don't have a student account yet?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-[#365442] hover:text-[#2A4234] underline underline-offset-2"
                  >
                    Register as a Student
                  </Link>
                </p>

                <div className="pt-1">
                  <Link
                    to="/admin/login"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#496B58] hover:text-[#365442] bg-[#E6EDE5]/60 hover:bg-[#E6EDE5] px-3 py-1.5 rounded-lg border border-[#A7B8A5]/40 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#365442]" />
                    <span>Administrator Console Sign In</span>
                  </Link>
                </div>
              </div>

              {/* Legal Links */}
              <div className="pt-4 text-center text-[11px] text-[#8C948E] space-x-3">
                <Link to="/terms" className="hover:text-[#292F2B] hover:underline">
                  Terms of Service
                </Link>
                <span>•</span>
                <Link to="/privacy" className="hover:text-[#292F2B] hover:underline">
                  Privacy Policy
                </Link>
                <span>•</span>
                <span>Protected Identity</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
