import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquareShare, X } from 'lucide-react';
import { cn } from '../../utilities/cn';

export interface SidebarItem {
  name: string;
  href: string;
  icon: ReactNode;
  badge?: string | number;
  badgeVariant?: 'sage' | 'terracotta';
}

export interface SidebarProps {
  items: SidebarItem[];
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  footer?: ReactNode;
}

export function Sidebar({ items, isOpen = true, onClose, className, footer }: SidebarProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const content = (
    <div className="flex flex-col h-full bg-[#FFFDF8] border-r border-[#E5E0D5] text-[#292F2B]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E5E0D5] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" onClick={onClose}>
          <div className="w-9 h-9 rounded-lg bg-[#365442] text-[#FFFDF8] flex items-center justify-center shadow-xs">
            <MessageSquareShare className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-[#292F2B] tracking-tight block">
              CampusVoice
            </span>
            <span className="text-[10px] text-[#68716A] font-medium tracking-wide block">
              Your Voice. A Better Tomorrow.
            </span>
          </div>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[#68716A] hover:bg-[#F7F4EC] transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold tracking-wider text-[#8C948E] px-3 mb-2">
          Navigation
        </div>
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors duration-150',
                active
                  ? 'bg-[#E6EDE5] text-[#365442] font-semibold'
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
                <span
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                    item.badgeVariant === 'terracotta'
                      ? 'bg-[#FAF2EE] text-[#B8755D] border-[#ECCEC4]'
                      : 'bg-[#E6EDE5] text-[#365442] border-[#A7B8A5]/60'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Optional User or Status Footer */}
      {footer && (
        <div className="p-4 border-t border-[#E5E0D5] bg-[#FAF8F3]/60 mt-auto">
          {footer}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className={cn('hidden md:block w-64 h-screen sticky top-0 shrink-0 select-none', className)}>
        {content}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {isOpen && onClose && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[#292F2B]/40 transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-modal z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
