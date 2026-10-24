import { type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utilities/cn';

export interface ErrorStateProps {
  title?: string;
  message: string;
  code?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  code,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'w-full py-10 px-6 rounded-xl border border-[#DEAF9F] bg-[#FAF2EE]/60 flex flex-col items-center justify-center text-center',
        className
      )}
      role="alert"
    >
      <div className="w-12 h-12 rounded-xl bg-[#FAF2EE] text-[#B8755D] border border-[#DEAF9F] flex items-center justify-center mb-3.5 shadow-subtle">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>

      <h4 className="text-sm font-bold text-[#292F2B] mb-1">{title}</h4>
      <p className="text-xs text-[#68716A] max-w-sm mb-3 leading-relaxed">
        {message}
      </p>

      {code && (
        <span className="text-[10px] font-mono text-[#8C948E] bg-[#E5E0D5]/50 px-2 py-0.5 rounded mb-4">
          Error code: {code}
        </span>
      )}

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          startIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
