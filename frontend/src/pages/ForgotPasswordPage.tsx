import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { Button, Input, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export function ForgotPasswordPage() {
  const { requestPasswordReset, isConfigured } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const emailTrimmed = email.trim();

    if (!emailTrimmed) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError('Please enter a valid academic email address.');
      return;
    }

    setIsLoading(true);
    setError('');

    const { error: resetError } = await requestPasswordReset(emailTrimmed);
    setIsLoading(false);

    if (resetError) {
      setError(resetError.message || 'Failed to dispatch password recovery email.');
      addToast({
        title: 'Recovery Request Failed',
        message: resetError.message || 'Unable to find an account with this email.',
        variant: 'error',
      });
      return;
    }

    setIsSuccess(true);
    addToast({
      title: 'Recovery Link Sent',
      message: 'Please check your inbox for password reset instructions.',
      variant: 'success',
    });
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
            <span>Return to Sign In</span>
          </Link>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-[#E5E0D5] bg-[#FFFDF8] shadow-card">
          <div className="p-6 bg-gradient-to-b from-[#E6EDE5]/60 to-[#FAF8F3]/40 border-b border-[#E5E0D5] text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#365442] text-white flex items-center justify-center mx-auto shadow-sm">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-[#292F2B] tracking-tight">
              Password Recovery
            </h1>
            <p className="text-xs text-[#68716A] max-w-xs mx-auto leading-relaxed">
              Enter your registered college email to receive a secure password reset link.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {!isConfigured && (
              <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] text-xs text-[#292F2B] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#365442]">
                  <AlertCircle className="w-3.5 h-3.5 text-[#496B58] shrink-0" />
                  <span>Supabase Email Service Required</span>
                </div>
                <p className="text-[11px] text-[#68716A] leading-relaxed">
                  Password reset emails will be dispatched via Supabase SMTP once environment variables are set in <code className="text-[10px] font-mono">frontend/.env</code>.
                </p>
              </div>
            )}

            {isSuccess ? (
              <div className="p-5 rounded-2xl bg-[#E6EDE5]/80 border border-[#A7B8A5] text-center space-y-3 animate-in fade-in">
                <CheckCircle2 className="w-10 h-10 text-[#365442] mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#292F2B]">Reset Link Dispatched</h3>
                  <p className="text-xs text-[#68716A] leading-relaxed">
                    We have dispatched password recovery instructions to <strong>{email}</strong>. Please follow the link in that email to choose a new password.
                  </p>
                </div>
                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="w-full justify-center">
                      Return to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && (
                  <div
                    className="p-3.5 rounded-xl bg-[#FAF2EE] border border-[#DEAF9F] text-xs text-[#B8755D] flex items-start gap-2.5"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B8755D]" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  label="Registered Email Address"
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  startIcon={<Mail className="w-4 h-4" />}
                  helperText="The email associated with your CampusVoice student account."
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-sm"
                  isLoading={isLoading}
                  endIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Send Recovery Link
                </Button>
              </form>
            )}

            <div className="pt-2 text-center text-xs text-[#68716A]">
              Remembered your credentials?{' '}
              <Link to="/login" className="font-semibold text-[#365442] hover:underline">
                Sign in
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
