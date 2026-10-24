import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FolderGit2,
  MessageSquareCheck,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquareShare,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentComplaintService } from '../services/studentComplaint.service';
import { Button, Modal } from '../components/ui';
import { cn } from '../utilities/cn';

export interface StudentDashboardLayoutProps {
  children?: ReactNode;
}

export function StudentDashboardLayout({ children }: StudentDashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const userId = user?.id || 'guest_student';
  const notifications = studentComplaintService.getNotifications(userId);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Submit Complaint', href: '/submit', icon: <PlusCircle className="w-4 h-4" /> },
    { name: 'My Complaints', href: '/complaints', icon: <FolderGit2 className="w-4 h-4" /> },
    { name: 'Feedback', href: '/feedback', icon: <MessageSquareCheck className="w-4 h-4" /> },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: <Bell className="w-4 h-4" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeVariant: 'terracotta' as const,
    },
    { name: 'My Profile', href: '/profile', icon: <User className="w-4 h-4" /> },
    { name: 'Settings', href: '/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Reusable Sidebar Content
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFDF8] border-r border-[#E5E0D5] text-[#292F2B]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E5E0D5] flex items-center justify-between">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 group select-none"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="w-9 h-9 rounded-lg bg-[#365442] text-[#FFFDF8] flex items-center justify-center shadow-xs group-hover:bg-[#2A4234] transition-colors">
            <MessageSquareShare className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-[#292F2B] tracking-tight block">
              CampusVoice
            </span>
            <span className="text-[10px] text-[#68716A] font-medium tracking-wide block">
              Student Grievance Portal
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
          Student Workspace
        </div>
        {navItems.map((item) => {
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

              {item.badge !== undefined && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[#FAF2EE] text-[#B8755D] border-[#ECCEC4]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Card & Logout in Sidebar Footer */}
      <div className="p-3.5 border-t border-[#E5E0D5] bg-[#FAF8F3]/60 space-y-2 mt-auto">
        <button
          type="button"
          onClick={() => setProfileModalOpen(true)}
          className="w-full p-2 rounded-xl bg-[#FFFDF8] border border-[#E5E0D5] flex items-center justify-between text-left hover:border-[#A7B8A5] transition-colors"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#365442] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {profile?.fullName?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-[#292F2B] block truncate">
                {profile?.fullName || 'Enrolled Student'}
              </span>
              <span className="text-[10px] text-[#68716A] block truncate">
                {profile?.department || 'Active Scholar'}
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
          <span>Log out</span>
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
              aria-label="Open sidebar menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb / Title Context */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#68716A]">
              <span className="font-semibold text-[#292F2B]">Student Portal</span>
              <span>/</span>
              <span className="capitalize text-[#496B58] font-medium">
                {location.pathname.replace('/', '') || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Right Top Header Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg text-[#68716A] hover:text-[#292F2B] hover:bg-[#F7F4EC] relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
                aria-label={`View notifications (${unreadCount} unread)`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B8755D] ring-2 ring-[#FFFDF8]" />
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#E5E0D5] bg-[#FFFDF8] shadow-card z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3.5 border-b border-[#E5E0D5] bg-[#FAF8F3] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#365442]" />
                      <span className="text-xs font-bold text-[#292F2B]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4]">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          studentComplaintService.markAllNotificationsAsRead(userId);
                          setNotificationsOpen(false);
                        }}
                        className="text-[11px] text-[#496B58] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E0D5]/60 text-left">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#68716A]">
                        No notifications currently.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            'p-3.5 text-xs transition-colors hover:bg-[#FAF8F3]',
                            !notif.read && 'bg-[#E6EDE5]/30'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-[#292F2B]">{notif.title}</span>
                            <span className="text-[10px] text-[#8C948E] shrink-0">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#68716A] mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-[#E5E0D5] bg-[#FAF8F3] text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-semibold text-[#365442] hover:underline"
                    >
                      View all notification history
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Details Shortcut */}
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8] hover:bg-[#F7F4EC] transition-colors"
              aria-label="View profile options"
            >
              <div className="w-6 h-6 rounded-full bg-[#365442] text-white flex items-center justify-center text-[10px] font-bold">
                {profile?.fullName?.charAt(0).toUpperCase() || 'S'}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-[#292F2B]">
                {profile?.fullName?.split(' ')[0] || 'Profile'}
              </span>
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Student Profile Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Student Profile & Enrollment"
        description="Verified institutional identity and registration credentials"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-[#B8755D] border-[#DEAF9F] hover:bg-[#FAF2EE]"
            >
              Sign Out
            </Button>
            <Button variant="primary" size="sm" onClick={() => setProfileModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5]">
            <div className="w-12 h-12 rounded-full bg-[#365442] text-white flex items-center justify-center text-base font-bold">
              {profile?.fullName?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#292F2B]">{profile?.fullName}</h4>
              <p className="text-xs text-[#68716A]">{profile?.email || user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]">
                <Sparkles className="w-3 h-3 text-[#496B58]" />
                Enrolled Student Account
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8]">
              <span className="text-[10px] uppercase font-bold text-[#8C948E] block">
                Registration / Roll ID
              </span>
              <span className="text-xs font-semibold text-[#292F2B]">
                {profile?.studentId || 'CS-2026-042'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8]">
              <span className="text-[10px] uppercase font-bold text-[#8C948E] block">
                Academic Year
              </span>
              <span className="text-xs font-semibold text-[#292F2B]">
                {profile?.academicYear || '3rd Year Undergraduate'}
              </span>
            </div>

            <div className="col-span-2 p-3 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8]">
              <span className="text-[10px] uppercase font-bold text-[#8C948E] block">
                Department
              </span>
              <span className="text-xs font-semibold text-[#292F2B]">
                {profile?.department || 'Computer Science & Engineering'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#FAF8F3] border border-[#E5E0D5] text-[11px] text-[#68716A] flex items-start gap-2">
            <Clock className="w-4 h-4 text-[#496B58] shrink-0 mt-0.5" />
            <span>
              Member of CampusVoice governance network since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'October 2026'}.
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
