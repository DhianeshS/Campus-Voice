import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utilities/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      helperText,
      error,
      id,
      disabled,
      required,
      startIcon,
      endIcon,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#292F2B]"
          >
            {label}
            {required && <span className="text-[#B8755D] ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3.5 text-[#68716A] pointer-events-none flex items-center justify-center">
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              'w-full bg-[#FFFDF8] text-[#292F2B] placeholder:text-[#8C948E] text-sm rounded-lg border border-[#E5E0D5] transition-all duration-150',
              'min-h-[42px] px-3.5 py-2.5',
              'focus:outline-none focus:border-[#496B58] focus:ring-1 focus:ring-[#496B58]',
              'disabled:bg-[#F2EFE8] disabled:text-[#8C948E] disabled:cursor-not-allowed',
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              error && 'border-[#B8755D] focus:border-[#B8755D] focus:ring-[#B8755D]',
              className
            )}
            {...props}
          />

          {endIcon && (
            <div className="absolute right-3.5 text-[#68716A] flex items-center justify-center">
              {endIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="text-xs text-[#B8755D] font-medium flex items-center gap-1 mt-1">
            <span>{error}</span>
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-xs text-[#68716A] mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
