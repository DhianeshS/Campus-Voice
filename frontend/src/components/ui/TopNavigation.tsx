import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquareShare, Menu, X, Activity, Layers, LogOut, UserCircle } from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { cn } from '../../utilities/cn';

export interface NavItem {
  name: string;
  href: string;
}

export function TopNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { health, loading: healthLoading } = useHealthCheck();
  const { user, profile, signOut } = useAuth();

  const navItems: NavItem[] = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Complaints', href: '/complaints' },
    { name: 'Submit Issue', href: '/submit' },
    ...(profile?.role === 'admin' || profile?.role === 'staff'
      ? [{ name: 'Admin Console', href: '/admin/dashboard' }]
      : []),
    { name: 'Design System', href: '/design-system' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF8]/95 backdrop-blur-xs border-b border-[#E5E0D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group select-none">
              <div className="w-9 h-9 rounded-lg bg-[#365442] text-[#FFFDF8] flex items-center justify-center shadow-xs group-hover:bg-[#2A4234] transition-colors">
                <MessageSquareShare className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-[#292F2B] tracking-tight flex items-center gap-2">
                  CampusVoice
                  {profile?.role === 'admin' && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4] tracking-wider">
                      Admin
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-[#68716A] font-medium tracking-tight hidden sm:block">
                  Your Campus. Your Voice. A Better Tomorrow.
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 select-none">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'px-3.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150',
                    active
                      ? 'bg-[#E6EDE5] text-[#365442] font-semibold shadow-xs'
                      : 'text-[#68716A] hover:text-[#292F2B] hover:bg-[#F7F4EC]'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Status Indicators & Auth Actions */}
          <div className="hidden sm:flex items-center gap-3 select-none">
            {/* System Status Pill */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                healthLoading
                  ? 'bg-[#FAF8F3] text-[#68716A] border-[#E5E0D5]'
                  : health?.status === 'ok'
                  ? 'bg-[#E6EDE5] text-[#365442] border-[#A7B8A5]/60'
                  : 'bg-[#FAF2EE] text-[#B8755D] border-[#ECCEC4]'
              )}
              title={health ? `API Online: ${health.service}` : 'API Standby'}
            >
              <Activity className={cn('w-3.5 h-3.5', healthLoading && 'animate-spin')} />
              <span>{healthLoading ? 'Checking...' : health?.status === 'ok' ? 'API Online' : 'API Standby'}</span>
            </div>

            {/* Auth Actions */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#E5E0D5]">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#FAF8F3] border border-[#E5E0D5]">
                  <div className="w-6 h-6 rounded-full bg-[#365442] text-white flex items-center justify-center text-[10px] font-bold">
                    {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-[#292F2B] max-w-[110px] truncate">
                      {profile?.fullName || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-[#68716A] capitalize">
                      {profile?.role || 'student'}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-[#E5E0D5]">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#292F2B] hover:bg-[#F7F4EC] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E5E0D5] bg-[#FFFDF8] px-4 pt-2 pb-5 space-y-2 select-none animate-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1 text-[11px] text-[#68716A] italic border-b border-[#E5E0D5]/50 mb-2">
            "Your Campus. Your Voice. A Better Tomorrow."
          </div>

          {/* User info if logged in */}
          {user && (
            <div className="p-3 mb-2 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCircle className="w-6 h-6 text-[#365442]" />
                <div>
                  <span className="text-xs font-bold text-[#292F2B] block">
                    {profile?.fullName}
                  </span>
                  <span className="text-[10px] text-[#68716A] capitalize">
                    {profile?.role} Account
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          )}

          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#E6EDE5] text-[#365442] font-semibold'
                    : 'text-[#68716A] hover:text-[#292F2B] hover:bg-[#F7F4EC]'
                )}
              >
                {item.name}
              </Link>
            );
          })}

          {!user && (
            <div className="pt-3 border-t border-[#E5E0D5] grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="md" className="w-full justify-center">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full justify-center">
                  Register
                </Button>
              </Link>
            </div>
          )}

          <div className="pt-3 border-t border-[#E5E0D5] mt-2 flex items-center justify-between text-xs text-[#68716A]">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#496B58]" />
              API Service:
            </span>
            <span className={health?.status === 'ok' ? 'text-[#365442] font-semibold' : 'text-[#B8755D] font-semibold'}>
              {health?.status === 'ok' ? 'Online' : 'Standby'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
