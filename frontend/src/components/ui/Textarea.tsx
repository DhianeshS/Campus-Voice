import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utilities/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      id,
      disabled,
      required,
      rows = 4,
      maxLength,
      value,
      showCount = false,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold uppercase tracking-wider text-[#292F2B]"
            >
              {label}
              {required && <span className="text-[#B8755D] ml-1">*</span>}
            </label>
          )}

          {showCount && maxLength && (
            <span className="text-xs text-[#68716A]">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          maxLength={maxLength}
          value={value}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            'w-full bg-[#FFFDF8] text-[#292F2B] placeholder:text-[#8C948E] text-sm rounded-lg border border-[#E5E0D5] transition-all duration-150',
            'px-3.5 py-2.5',
            'focus:outline-none focus:border-[#496B58] focus:ring-1 focus:ring-[#496B58]',
            'disabled:bg-[#F2EFE8] disabled:text-[#8C948E] disabled:cursor-not-allowed',
            error && 'border-[#B8755D] focus:border-[#B8755D] focus:ring-[#B8755D]',
            className
          )}
          {...props}
        />

        {error && (
          <p id={errorId} className="text-xs text-[#B8755D] font-medium mt-1">
            {error}
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

Textarea.displayName = 'Textarea';
