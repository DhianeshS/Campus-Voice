import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utilities/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'cream' | 'terracotta-accent';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#FFFDF8] border border-[#E5E0D5] shadow-subtle',
      elevated: 'bg-[#FFFFFF] border border-[#E5E0D5] shadow-card',
      cream: 'bg-[#F7F4EC] border border-[#E5E0D5]',
      'terracotta-accent': 'bg-[#FFFDF8] border-l-4 border-l-[#B8755D] border-y border-r border-[#E5E0D5] shadow-subtle',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-xl transition-all duration-150', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-5 border-b border-[#E5E0D5]/60 flex flex-col space-y-1.5', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-bold text-[#292F2B] tracking-tight leading-snug', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-xs text-[#68716A] leading-relaxed', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-t border-[#E5E0D5]/60 bg-[#FAF8F3]/50 rounded-b-xl flex items-center justify-between gap-4', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';
