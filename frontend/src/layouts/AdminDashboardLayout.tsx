import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  FolderKanban,
  Tags,
  Users,
  ScrollText,
  Sliders,
  LogOut,
  Menu,
  X,
  Bell,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Sparkles,
  BarChart3,
  MessageSquareCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Modal } from '../components/ui';
import { cn } from '../utilities/cn';

export interface AdminDashboardLayoutProps {
  children?: ReactNode;
}

export function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Administrative Navigation Items
  const adminNavItems = [
    { name: 'Dashboard Overview', href: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Complaints Ledger', href: '/admin/complaints', icon: <FolderKanban className="w-4 h-4" /> },
    { name: 'Category Registry', href: '/admin/categories', icon: <Tags className="w-4 h-4" /> },
    { name: 'Executive Reports', href: '/admin/reports', icon: <BarChart3 className="w-4 h-4" /> },
    { name: 'Feedback & Ratings', href: '/admin/feedback', icon: <MessageSquareCheck className="w-4 h-4" /> },
    { name: 'User Management', href: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { name: 'Audit Trail', href: '/admin/audit-logs', icon: <ScrollText className="w-4 h-4" /> },
    { name: 'SLA & Settings', href: '/admin/settings', icon: <Sliders className="w-4 h-4" /> },
  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Sidebar Content
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFDF8] border-r border-[#E5E0D5] text-[#292F2B]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E5E0D5] flex items-center justify-between">
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-3 group select-none"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="w-9 h-9 rounded-lg bg-[#2A4234] text-[#FFFDF8] flex items-center justify-center shadow-xs group-hover:bg-[#1E3025] transition-colors">
            <ShieldAlert className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-[#292F2B] tracking-tight block">
                CampusVoice
              </span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4]">
                Admin
              </span>
            </div>
            <span className="text-[10px] text-[#68716A] font-medium tracking-wide block">
              Grievance Oversight Console
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-[#68716A] hover:bg-[#F7F4EC] transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold tracking-wider text-[#8C948E] px-3 mb-2 select-none">
          Administrative Operations
        </div>
        {adminNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors duration-150',
                active
                  ? 'bg-[#E6EDE5] text-[#365442] font-semibold shadow-xs border-l-2 border-l-[#365442]'
                  : 'text-[#68716A] hover:text-[#292F2B] hover:bg-[#F7F4EC]'
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn('w-4 h-4 shrink-0', active ? 'text-[#365442]' : 'text-[#8C948E]')}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-[#E5E0D5]/70">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#8C948E] px-3 mb-2 select-none">
            Cross-Portal Link
          </div>
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-[#496B58] hover:bg-[#E6EDE5]/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#496B58]" />
              <span>Student Grievance Portal</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#68716A]" />
          </Link>
        </div>
      </nav>

      {/* User Card & Logout in Sidebar Footer */}
      <div className="p-3.5 border-t border-[#E5E0D5] bg-[#FAF8F3]/60 space-y-2 mt-auto">
        <button
          type="button"
          onClick={() => setProfileModalOpen(true)}
          className="w-full p-2 rounded-xl bg-[#FFFDF8] border border-[#E5E0D5] flex items-center justify-between text-left hover:border-[#A7B8A5] transition-colors"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#2A4234] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {profile?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-[#292F2B] block truncate">
                {profile?.fullName || 'Dr. Evelyn Vance'}
              </span>
              <span className="text-[10px] text-[#B8755D] font-semibold block truncate">
                Chief Grievance Officer
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#B8755D] hover:bg-[#FAF2EE] transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Exit Administrative Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-cream text-charcoal font-sans antialiased selection:bg-sage selection:text-surface">
      {/* 1. Desktop Persistent Left Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 select-none z-30">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Off-Canvas Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[#292F2B]/40 transition-opacity backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-modal z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* 3. Main Application Surface */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar with Notifications & Profile */}
        <header className="sticky top-0 z-20 bg-[#FFFDF8]/95 backdrop-blur-xs border-b border-[#E5E0D5] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-[#292F2B] hover:bg-[#F7F4EC] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
              aria-label="Open administrative menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb Context */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#68716A]">
              <span className="font-semibold text-[#292F2B]">Admin Console</span>
              <span>/</span>
              <span className="capitalize text-[#365442] font-semibold">
                {location.pathname.replace('/admin/', '').replace('/admin', '') || 'Dashboard Overview'}
              </span>
            </div>
          </div>

          {/* Right Top Header Actions */}
          <div className="flex items-center gap-3">
            {/* SLA Target Pill Indicator */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]"
              title="Standard SLA: 48-Hour Triage & Investigation Window"
            >
              <Clock className="w-3.5 h-3.5 text-[#496B58]" />
              <span>SLA Target: 48h Resolution</span>
            </div>

            {/* Notification Bell Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg text-[#68716A] hover:text-[#292F2B] hover:bg-[#F7F4EC] relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
                aria-label="View administrative notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B8755D] ring-2 ring-[#FFFDF8]" />
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#E5E0D5] bg-[#FFFDF8] shadow-card z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3.5 border-b border-[#E5E0D5] bg-[#FAF8F3] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#365442]" />
                      <span className="text-xs font-bold text-[#292F2B]">Administrative Triage Queue</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4]">
                      Live Queue
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E0D5]/60 text-left p-2 space-y-1">
                    <div className="p-2.5 rounded-lg bg-[#FAF8F3] text-xs">
                      <span className="font-semibold text-[#292F2B] block">Grievances Awaiting Triage</span>
                      <p className="text-[11px] text-[#68716A] mt-0.5">
                        New student complaints have been registered and are pending departmental officer assignment.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg text-xs">
                      <span className="font-semibold text-[#292F2B] block">SLA Monitoring Active</span>
                      <p className="text-[11px] text-[#68716A] mt-0.5">
                        Automatic 48-hour institutional timers are tracking investigation milestones.
                      </p>
                    </div>
                  </div>

                  <div className="p-2 border-t border-[#E5E0D5] bg-[#FAF8F3] text-center">
                    <Link
                      to="/admin/complaints"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-semibold text-[#365442] hover:underline"
                    >
                      Open Full Complaints Ledger
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Officer Profile Avatar */}
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8] hover:bg-[#F7F4EC] transition-colors"
              aria-label="View administrative profile"
            >
              <div className="w-6 h-6 rounded-full bg-[#2A4234] text-white flex items-center justify-center text-[10px] font-bold">
                {profile?.fullName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-[#292F2B]">
                {profile?.fullName?.split(' ')[0] || 'Administrator'}
              </span>
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Administrator Profile Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Administrative Officer Profile"
        description="Verified institutional authority and ombudsperson clearance credentials"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-[#B8755D] border-[#DEAF9F] hover:bg-[#FAF2EE]"
            >
              Exit Session
            </Button>
            <Button variant="primary" size="sm" onClick={() => setProfileModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5]">
            <div className="w-12 h-12 rounded-full bg-[#2A4234] text-white flex items-center justify-center text-base font-bold">
              {profile?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#292F2B]">{profile?.fullName || 'Dr. Evelyn Vance'}</h4>
              <p className="text-xs text-[#68716A]">{profile?.email || user?.email || 'admin@university.edu'}</p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4]">
                <ShieldCheck className="w-3 h-3 text-[#B8755D]" />
                Authorized Chief Grievance Officer
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8]">
              <span className="text-[10px] uppercase font-bold text-[#8C948E] block">
                Directorate
              </span>
              <span className="text-xs font-semibold text-[#292F2B]">
                University Ombudsman Office
              </span>
            </div>

            <div className="p-3 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8]">
              <span className="text-[10px] uppercase font-bold text-[#8C948E] block">
                Access Level
              </span>
              <span className="text-xs font-semibold text-[#2A4234]">
                Full Institutional Oversight
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
