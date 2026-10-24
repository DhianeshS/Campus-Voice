import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Mail, ArrowRight, ArrowLeft, AlertCircle, Lock } from 'lucide-react';
import { Button, Input, PasswordInput, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { signInAdmin, isConfigured } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || isLoading) return;

    setIsLoading(true);
    setError('');

    const { error: authError } = await signInAdmin(email, password);
    setIsLoading(false);

    if (authError) {
      setError(authError.message || 'Administrative verification failed.');
      addToast({
        title: 'Access Denied',
        message: authError.message || 'Unauthorized administrator access attempt.',
        variant: 'error',
      });
      return;
    }

    addToast({
      title: 'Administrator Verified',
      message: 'Access granted to campus administrative consoles.',
      variant: 'success',
    });
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center bg-cream py-10 selection:bg-sage selection:text-surface">
      <div className="w-full max-w-md mx-auto px-4 sm:px-6">
        
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#68716A] hover:text-[#292F2B] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Student Sign In</span>
          </Link>
        </div>

        {/* Admin Card */}
        <div className="overflow-hidden rounded-2xl border border-[#E5E0D5] bg-[#FFFDF8] shadow-card">
          
          {/* Header Banner with Security Callout */}
          <div className="p-6 bg-gradient-to-b from-[#E6EDE5]/80 to-[#FAF8F3]/60 border-b border-[#E5E0D5] text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#365442] text-white flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFFDF8] text-[#365442] border border-[#A7B8A5]">
                <ShieldAlert className="w-3 h-3 text-[#B8755D]" />
                Authorized Personnel Only
              </span>
              <h1 className="text-xl font-bold text-[#292F2B] tracking-tight">
                Administrative Console Access
              </h1>
              <p className="text-xs text-[#68716A] max-w-xs mx-auto leading-relaxed">
                Dedicated authentication gateway for university administrators, deans, and facility heads.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Supabase Notice */}
            {!isConfigured && (
              <div className="p-3 rounded-xl bg-[#E6EDE5]/50 border border-[#A7B8A5]/60 text-xs text-[#292F2B] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#365442]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#496B58] shrink-0" />
                  <span>Instant Administrative Sign-In Active</span>
                </div>
                <p className="text-[11px] text-[#68716A] leading-relaxed">
                  Local demo mode is enabled. Enter any administrator or staff email (e.g. <code className="bg-[#FFFDF8] px-1 py-0.5 rounded text-[10px] font-mono">admin@university.edu</code>) and password to enter the administrative console.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="p-3.5 rounded-xl bg-[#FAF2EE] border border-[#DEAF9F] text-xs text-[#B8755D] flex items-start gap-2.5"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B8755D]" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Administrative Email"
                type="email"
                required
                autoComplete="email"
                placeholder="dean.academics@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startIcon={<Mail className="w-4 h-4" />}
                helperText="Must match an audited staff directory address."
              />

              <PasswordInput
                label="Security Key / Password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-sm"
                  isLoading={isLoading}
                  endIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify & Enter Console
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-[#E5E0D5]/70 text-center text-xs text-[#68716A] space-y-2">
              <div className="flex items-center justify-center gap-1 text-[11px] text-[#365442]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#496B58]" />
                <span>Audited TLS Session with Tamper Detection</span>
              </div>
              <p className="text-[11px] text-[#8C948E]">
                All administrative access events and status overrides are logged to institutional audit tables.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
