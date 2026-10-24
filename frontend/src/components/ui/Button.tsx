import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utilities/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'terracotta' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      startIcon,
      endIcon,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99]';

    const variants: Record<ButtonVariant, string> = {
      // Deep sage primary button as per visual guidelines
      primary:
        'bg-[#365442] hover:bg-[#2A4234] text-[#FFFDF8] shadow-sm border border-[#2A4234]/30',
      // Secondary soft sage tint
      secondary:
        'bg-[#E6EDE5] hover:bg-[#D0DDD0] text-[#365442] border border-[#A7B8A5]/40 shadow-sm',
      // Restrained outline
      outline:
        'bg-[#FFFDF8] hover:bg-[#F7F4EC] text-[#292F2B] border border-[#E5E0D5] hover:border-[#D5CFBF] shadow-subtle',
      // Subtle ghost
      ghost:
        'bg-transparent hover:bg-[#E6EDE5]/60 text-[#68716A] hover:text-[#292F2B]',
      // Muted terracotta accent for destructive or high-importance actions
      terracotta:
        'bg-[#B8755D] hover:bg-[#A0644E] text-[#FFFDF8] shadow-sm border border-[#A0644E]/30',
      // Subtle inline link
      link:
        'bg-transparent text-[#496B58] hover:text-[#365442] underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'text-xs px-3 py-1.5 rounded-md min-h-[32px] gap-1.5',
      md: 'text-sm px-4 py-2.5 rounded-lg min-h-[40px] gap-2',
      lg: 'text-base px-5 py-3 rounded-lg min-h-[46px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
        {!isLoading && startIcon && <span className="shrink-0">{startIcon}</span>}
        <span>{children}</span>
        {!isLoading && endIcon && <span className="shrink-0">{endIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
