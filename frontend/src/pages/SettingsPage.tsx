import { useState } from 'react';
import { Settings, Bell, KeyRound, Lock } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Checkbox,
  useToast,
} from '../components/ui';

export function SettingsPage() {
  const { addToast } = useToast();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [resolutionUpdates, setResolutionUpdates] = useState(true);
  const [defaultAnonymous, setDefaultAnonymous] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      title: 'Preferences Updated',
      message: 'Notification and communication settings have been saved.',
      variant: 'success',
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addToast({
        title: 'Validation Error',
        message: 'New password must be at least 8 characters long.',
        variant: 'error',
      });
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      addToast({
        title: 'Password Updated',
        message: 'Your account security credentials have been updated.',
        variant: 'success',
      });
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-3 border-b border-[#E5E0D5]">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]/40 mb-1 select-none">
          <Settings className="w-3 h-3 text-[#496B58]" />
          <span>Account Preferences</span>
        </div>
        <h1 className="text-2xl font-bold text-[#292F2B] tracking-tight">
          System & Privacy Settings
        </h1>
        <p className="text-xs text-[#68716A] mt-1 max-w-2xl">
          Manage your notification frequency, student privacy preferences, and institutional authentication credentials.
        </p>
      </div>

      <div className="space-y-6">
        {/* Notification Preferences */}
        <Card>
          <CardHeader className="bg-[#FAF8F3]/50">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#365442]" />
              <span>Notification & Communication Preferences</span>
            </CardTitle>
            <CardDescription>
              Choose how and when you receive milestone alerts for submitted complaints.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveNotifications} className="space-y-4">
              <div className="space-y-3">
                <Checkbox
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  label="Email Alerts on Status Changes"
                  description="Receive instant email notifications when an administrator updates your complaint status."
                />

                <Checkbox
                  checked={resolutionUpdates}
                  onChange={(e) => setResolutionUpdates(e.target.checked)}
                  label="Resolution Verification Reminders"
                  description="Receive a notification when a remediated issue requires your student verification feedback."
                />

                <Checkbox
                  checked={defaultAnonymous}
                  onChange={(e) => setDefaultAnonymous(e.target.checked)}
                  label="Default to Anonymous Submission"
                  description="Automatically redact student identity on all new complaint filings unless explicitly unchecked."
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md">
                  Save Preferences
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security & Password */}
        <Card>
          <CardHeader className="bg-[#FAF8F3]/50">
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#365442]" />
              <span>Security & Password</span>
            </CardTitle>
            <CardDescription>
              Update your account credentials to maintain access security.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />

              <Input
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                helperText="Must contain a combination of letters, numbers, and symbols."
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={savingPassword || !currentPassword || !newPassword}
                  startIcon={<Lock className="w-4 h-4" />}
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
