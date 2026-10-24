import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utilities/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, disabled, checked, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <div className="flex items-start gap-3 text-left">
        <div className="relative flex items-center justify-center pt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 rounded border border-[#E5E0D5] bg-[#FFFDF8] transition-all duration-150',
              'flex items-center justify-center text-white',
              'peer-checked:bg-[#365442] peer-checked:border-[#365442]',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[#496B58] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-cream',
              'peer-disabled:bg-[#F2EFE8] peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
              error && 'border-[#B8755D]',
              className
            )}
            aria-hidden="true"
          >
            <Check className="w-3.5 h-3.5 opacity-0 peer-checked:opacity-100 stroke-[2.5] transition-opacity" />
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium text-[#292F2B] cursor-pointer select-none leading-tight',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-[#68716A] mt-0.5 select-none">{description}</p>
            )}
            {error && (
              <p className="text-xs text-[#B8755D] font-medium mt-1 select-none">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
