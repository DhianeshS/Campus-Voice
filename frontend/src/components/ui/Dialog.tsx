import { type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'terracotta' | 'info';
  isLoading?: boolean;
  icon?: ReactNode;
}

export function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  icon,
}: DialogProps) {
  const defaultIcons = {
    primary: <HelpCircle className="w-5 h-5 text-[#365442]" />,
    terracotta: <AlertCircle className="w-5 h-5 text-[#B8755D]" />,
    info: <CheckCircle2 className="w-5 h-5 text-[#496B58]" />,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'terracotta' ? 'terracotta' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-[#E6EDE5]/80 shrink-0">
          {icon || defaultIcons[variant]}
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-[#292F2B]">{title}</h4>
          <p className="text-xs text-[#68716A] leading-relaxed">{description}</p>
        </div>
      </div>
    </Modal>
  );
}
