import { Loader2 } from 'lucide-react';
import { cn } from '../../utilities/cn';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2
      className={cn('animate-spin text-[#496B58]', sizeClasses[size], className)}
      aria-hidden="true"
    />
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[#EDE8DB]/70', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function LoadingState({
  message = 'Loading details...',
  size = 'md',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'w-full py-12 flex flex-col items-center justify-center gap-3 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size={size} />
      <p className="text-xs font-medium text-[#68716A]">{message}</p>
    </div>
  );
}
