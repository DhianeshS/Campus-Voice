import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  Lock,
  Building2,
  Calendar,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { adminComplaintService } from '../../services/adminComplaint.service';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile, UserRole } from '../../types';
import {
  Button,
  Input,
  Select,
  Card,
  CardContent,
  Modal,
  useToast,
} from '../../components/ui';

export function AdminUsersPage() {
  const { user: currentAuthUser, profile: currentAuthProfile } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Modal State for role modification
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [isSelf, setIsSelf] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminComplaintService.getUsers(search, roleFilter);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users in real time', err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  // Initial load & real-time live synchronization
  useEffect(() => {
    loadUsers();

    // 1. Supabase Postgres Realtime Subscription
    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel('realtime_admin_profiles')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          (payload) => {
            console.log('⚡ Real-time Profile Mutation Received:', payload);
            loadUsers();
          }
        )
        .subscribe();
    }

    // 2. High-Frequency Polling Heartbeat (every 3 seconds) for instant live sync
    const heartbeat = setInterval(() => {
      loadUsers();
    }, 3000);

    return () => {
      clearInterval(heartbeat);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadUsers]);

  const currentAdminId = currentAuthUser?.id || currentAuthProfile?.id || 'usr_admin_default';

  const handleOpenRoleModal = (u: UserProfile) => {
    const isCurrentUser =
      u.id === currentAdminId ||
      u.email.toLowerCase() === (currentAuthUser?.email || '').toLowerCase();

    setSelectedUser(u);
    setNewRole(u.role);
    setIsSelf(isCurrentUser);
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (isSelf) {
      addToast({
        title: 'Security Violation Blocked',
        message: 'Administrators cannot alter or escalate their own privilege level.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminComplaintService.updateUserRole(selectedUser.id, newRole, currentAdminId);
      addToast({
        title: 'User Role Updated',
        message: `Security role for ${selectedUser.fullName} has been updated to ${newRole.toUpperCase()}.`,
        variant: 'success',
      });
      setRoleModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      addToast({
        title: 'Action Prohibited',
        message: err.message || 'Could not update user role.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentCount = users.filter((u) => u.role === 'student').length;
  const staffCount = users.filter((u) => u.role === 'staff').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5E0D5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4] mb-1 select-none">
            <Lock className="w-3 h-3 text-[#B8755D]" />
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F2B] tracking-tight">
            Institutional User & Role Registry
          </h1>
          <p className="text-xs text-[#68716A] mt-1 max-w-2xl leading-relaxed">
            Audit registered student accounts, grievance intake officers, and system administrators. Role mutations are synchronized in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-time Live Sync</span>
          </span>

          <Button
            variant="outline"
            size="md"
            onClick={() => loadUsers()}
            startIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Directory
          </Button>
        </div>
      </div>

      {/* 2. Security Non-Self-Escalation Callout */}
      <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#B8755D] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-[#292F2B]">
            Privilege Escalation Protection (Policy CV-SEC-04)
          </span>
          <p className="text-[#68716A] leading-relaxed">
            Administrators are strictly prohibited by both frontend security controls and backend API validation from modifying or escalating their own account roles. Role modifications generate permanent immutable audit entries.
          </p>
        </div>
      </div>

      {/* 3. Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#68716A]">Total Accounts</span>
            <Users className="w-4 h-4 text-[#365442]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#292F2B] block">{users.length}</span>
            <span className="text-[10px] text-[#8C948E]">Enrolled in university database</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#365442]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#365442]">Students</span>
            <GraduationCap className="w-4 h-4 text-[#365442]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#365442] block">{studentCount}</span>
            <span className="text-[10px] text-[#68716A]">Authorized grievance complainants</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#496B58]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#496B58]">Department Staff</span>
            <Briefcase className="w-4 h-4 text-[#496B58]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#496B58] block">{staffCount}</span>
            <span className="text-[10px] text-[#68716A]">Assigned investigation officers</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#B8755D]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#B8755D]">Administrators</span>
            <ShieldCheck className="w-4 h-4 text-[#B8755D]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#B8755D] block">{adminCount}</span>
            <span className="text-[10px] text-[#68716A]">Ombudsmen & Chief Officers</span>
          </div>
        </Card>
      </div>

      {/* 4. Directory Search & Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C948E]" />
            <Input
              type="text"
              placeholder="Search by student name, institutional email, matriculation ID, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={roleFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('all')}
            >
              All Roles
            </Button>
            <Button
              variant={roleFilter === 'student' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('student')}
            >
              Students
            </Button>
            <Button
              variant={roleFilter === 'staff' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('staff')}
            >
              Staff
            </Button>
            <Button
              variant={roleFilter === 'admin' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('admin')}
            >
              Admins
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5. Permitted User Directory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#E5E0D5] text-[#68716A] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">Role & Access Tier</th>
                <th className="py-3 px-4">Matriculation / Staff ID</th>
                <th className="py-3 px-4">Department / Unit</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D5]/70 bg-[#FFFDF8]">
              {users.map((u) => {
                const isCurrentUser =
                  u.id === currentAdminId ||
                  u.email.toLowerCase() === (currentAuthUser?.email || '').toLowerCase();

                return (
                  <tr key={u.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                    {/* User Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#E6EDE5] text-[#365442] flex items-center justify-center font-bold text-xs shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#292F2B] flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4]">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#68716A] block">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role & Access Tier */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          u.role === 'admin'
                            ? 'bg-[#FAF2EE] text-[#B8755D] border-[#ECCEC4]'
                            : u.role === 'staff'
                            ? 'bg-[#E6EDE5] text-[#365442] border-[#A7B8A5]'
                            : 'bg-[#F7F4EC] text-[#68716A] border-[#E5E0D5]'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <ShieldCheck className="w-3 h-3 text-[#B8755D]" />
                        ) : u.role === 'staff' ? (
                          <UserCheck className="w-3 h-3 text-[#365442]" />
                        ) : (
                          <GraduationCap className="w-3 h-3 text-[#68716A]" />
                        )}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    {/* Matriculation / Staff ID */}
                    <td className="py-3.5 px-4 text-[#292F2B] font-mono text-[11px]">
                      {u.studentId || (u.role !== 'student' ? 'FAC-STAFF-AUTH' : '—')}
                    </td>

                    {/* Department / Unit */}
                    <td className="py-3.5 px-4 text-[#68716A]">
                      <div className="flex items-center gap-1.5 truncate max-w-xs">
                        <Building2 className="w-3.5 h-3.5 text-[#8C948E] shrink-0" />
                        <span className="truncate">{u.department || 'General University'}</span>
                      </div>
                    </td>

                    {/* Registered Date */}
                    <td className="py-3.5 px-4 text-[#68716A]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8C948E]" />
                        <span>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                        </span>
                      </div>
                    </td>

                    {/* Access Controls */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRoleModal(u)}
                        startIcon={<KeyRound className="w-3 h-3" />}
                        className="text-xs"
                      >
                        Modify Role
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6. Modify Role Modal with Self-Escalation Guard */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={isSelf ? 'Self-Escalation Guard Active' : `Modify User Role: ${selectedUser?.fullName}`}
        description={
          isSelf
            ? 'Institutional security policies prevent administrators from changing their own authorization levels.'
            : 'Update authorization level, institutional permissions, and triage access.'
        }
      >
        {isSelf ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#FAF2EE] border border-[#DEAF9F] text-[#B8755D] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block">Self-Role Modification Prohibited</span>
                <p className="mt-1 leading-relaxed">
                  To ensure separation of duties and prevent unauthorized privilege escalation, you cannot modify or transfer your own administrative permissions. To adjust your privileges, another authorized chief ombudsman must perform the change.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setRoleModalOpen(false)}>
                Acknowledge & Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#292F2B]">{selectedUser?.fullName}</span>
                <span className="font-mono text-[10px] text-[#68716A]">{selectedUser?.email}</span>
              </div>
              <p className="text-[11px] text-[#68716A]">
                Current Role: <span className="font-bold uppercase text-[#365442]">{selectedUser?.role}</span>
              </p>
            </div>

            <div>
              <label className="block font-semibold text-[#292F2B] mb-1">
                Select New Authorization Level <span className="text-[#B8755D]">*</span>
              </label>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                options={[
                  { label: 'Student (Complainant Access Only)', value: 'student' },
                  { label: 'Staff (Department Triage & Assigned Cases)', value: 'staff' },
                  { label: 'Admin (Full University Grievance Oversight & Taxonomy)', value: 'admin' },
                ]}
              />
            </div>

            {newRole === 'admin' && (
              <div className="p-3 rounded-lg bg-[#FAF2EE] border border-[#DEAF9F] text-[#B8755D] text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Elevation Warning:</strong> Promoting a user to Administrator grants full institutional authority to inspect all sensitive complaints, assign officers, and configure grievance categories.
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setRoleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Recording Changes...' : 'Confirm Role Update'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
