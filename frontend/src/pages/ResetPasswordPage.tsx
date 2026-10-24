import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, PasswordInput, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword, isConfigured } = useAuth();
  const { addToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please provide a new password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setIsLoading(true);

    const { error: resetError } = await resetPassword(password);
    setIsLoading(false);

    if (resetError) {
      setError(resetError.message || 'Failed to update your password.');
      addToast({
        title: 'Reset Failed',
        message: resetError.message || 'Unable to update password.',
        variant: 'error',
      });
      return;
    }

    setIsSuccess(true);
    addToast({
      title: 'Password Updated',
      message: 'Your account password has been updated successfully.',
      variant: 'success',
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center bg-cream py-10 selection:bg-sage selection:text-surface">
      <div className="w-full max-w-md mx-auto px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-[#E5E0D5] bg-[#FFFDF8] shadow-card">
          <div className="p-6 bg-gradient-to-b from-[#E6EDE5]/60 to-[#FAF8F3]/40 border-b border-[#E5E0D5] text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#365442] text-white flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-[#292F2B] tracking-tight">
              Create New Password
            </h1>
            <p className="text-xs text-[#68716A] max-w-xs mx-auto leading-relaxed">
              Set a strong, unique password to secure your CampusVoice account.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {!isConfigured && (
              <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] text-xs text-[#292F2B] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#365442]">
                  <AlertCircle className="w-3.5 h-3.5 text-[#496B58] shrink-0" />
                  <span>Password Reset Session</span>
                </div>
                <p className="text-[11px] text-[#68716A] leading-relaxed">
                  In production, opening the reset link from your email establishes a temporary recovery token in the URL hash for Supabase Auth.
                </p>
              </div>
            )}

            {isSuccess ? (
              <div className="p-5 rounded-2xl bg-[#E6EDE5]/80 border border-[#A7B8A5] text-center space-y-4 animate-in fade-in">
                <CheckCircle2 className="w-10 h-10 text-[#365442] mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#292F2B]">Password Successfully Reset</h3>
                  <p className="text-xs text-[#68716A] leading-relaxed">
                    Your new credentials are now active. You may now log in to CampusVoice.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Sign In
                </Button>
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

                <PasswordInput
                  label="New Password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  helperText="At least 8 characters with numbers and letters."
                />

                <PasswordInput
                  label="Confirm New Password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-sm"
                  isLoading={isLoading}
                  endIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Update Account Password
                </Button>
              </form>
            )}

            <div className="pt-2 text-center text-xs text-[#68716A]">
              <Link to="/login" className="font-semibold text-[#365442] hover:underline">
                Cancel and return to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
