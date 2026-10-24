import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../utilities/cn';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'w-full py-12 px-6 rounded-xl border border-dashed border-[#E5E0D5] bg-[#FFFDF8] flex flex-col items-center justify-center text-center',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-[#E6EDE5] text-[#365442] flex items-center justify-center mb-4 shadow-subtle">
        {icon || <Inbox className="w-6 h-6" aria-hidden="true" />}
      </div>
      <h4 className="text-sm font-bold text-[#292F2B] mb-1">{title}</h4>
      <p className="text-xs text-[#68716A] max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
