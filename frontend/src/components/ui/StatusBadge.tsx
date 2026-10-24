import { cn } from '../../utilities/cn';
import type { ComplaintStatus, ComplaintPriority } from '../../types';

export interface StatusBadgeProps {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, priority, className, size = 'sm' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  if (status) {
    const config: Record<ComplaintStatus, { label: string; style: string; dot: string }> = {
      submitted: {
        label: 'Submitted',
        style: 'bg-[#FAF8F3] text-[#8C6D46] border-[#E8DFC8]',
        dot: 'bg-[#BFA175]',
      },
      pending: {
        label: 'Submitted',
        style: 'bg-[#FAF8F3] text-[#8C6D46] border-[#E8DFC8]',
        dot: 'bg-[#BFA175]',
      },
      under_review: {
        label: 'Under Review',
        style: 'bg-[#E6EDE5] text-[#365442] border-[#A7B8A5]/70 font-medium',
        dot: 'bg-[#496B58]',
      },
      assigned: {
        label: 'Assigned',
        style: 'bg-[#EBF2F1] text-[#3D5C5A] border-[#B5D0CE] font-medium',
        dot: 'bg-[#3D5C5A]',
      },
      in_progress: {
        label: 'In Progress',
        style: 'bg-[#EBF1EC] text-[#2A4234] border-[#BACDC0] font-semibold',
        dot: 'bg-[#365442]',
      },
      awaiting_information: {
        label: 'Awaiting Info',
        style: 'bg-[#FAF2EE] text-[#B8755D] border-[#ECCEC4] font-medium',
        dot: 'bg-[#B8755D]',
      },
      resolved: {
        label: 'Resolved',
        style: 'bg-[#D0DDD0]/60 text-[#2A4234] border-[#A7B8A5] font-semibold',
        dot: 'bg-[#2A4234]',
      },
      closed: {
        label: 'Closed',
        style: 'bg-[#F0EFEB] text-[#68716A] border-[#D9D5CC]',
        dot: 'bg-[#8C948E]',
      },
      reopened: {
        label: 'Reopened',
        style: 'bg-[#F7EBE6] text-[#B8755D] border-[#DEAF9F] font-semibold',
        dot: 'bg-[#B8755D]',
      },
      rejected: {
        label: 'Closed / Dismissed',
        style: 'bg-[#FAF2EE] text-[#B8755D] border-[#ECCEC4]',
        dot: 'bg-[#B8755D]',
      },
    };

    const item = config[status] || {
      label: status,
      style: 'bg-[#FAF8F3] text-[#292F2B] border-[#E5E0D5]',
      dot: 'bg-[#8C948E]',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border select-none transition-colors duration-150',
          sizeClasses[size],
          item.style,
          className
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', item.dot)} aria-hidden="true" />
        <span>{item.label}</span>
      </span>
    );
  }

  if (priority) {
    const config: Record<ComplaintPriority, { label: string; style: string }> = {
      low: {
        label: 'Low Priority',
        style: 'bg-[#FAF8F3] text-[#68716A] border-[#E5E0D5]',
      },
      medium: {
        label: 'Medium Priority',
        style: 'bg-[#E6EDE5] text-[#365442] border-[#A7B8A5]/50',
      },
      high: {
        label: 'High Priority',
        style: 'bg-[#FAF2EE] text-[#9C5A28] border-[#DEAF9F]',
      },
      urgent: {
        label: 'Urgent',
        style: 'bg-[#F5E6E0] text-[#B8755D] border-[#DEAF9F] font-bold tracking-wide',
      },
    };

    const item = config[priority];
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md border uppercase text-[10px] font-semibold tracking-wider select-none',
          sizeClasses[size],
          item.style,
          className
        )}
      >
        {item.label}
      </span>
    );
  }

  return null;
}
