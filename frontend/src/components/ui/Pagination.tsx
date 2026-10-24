import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utilities/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  totalRecords?: number;
  pageSize?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  totalRecords,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1 && !totalRecords) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const startRecord = pageSize ? (currentPage - 1) * pageSize + 1 : undefined;
  const endRecord = pageSize && totalRecords ? Math.min(currentPage * pageSize, totalRecords) : undefined;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 select-none',
        className
      )}
      aria-label="Pagination"
    >
      {/* Records count display if provided */}
      {totalRecords !== undefined && startRecord !== undefined && endRecord !== undefined && (
        <p className="text-xs text-[#68716A]">
          Showing <span className="font-semibold text-[#292F2B]">{startRecord}</span> to{' '}
          <span className="font-semibold text-[#292F2B]">{endRecord}</span> of{' '}
          <span className="font-semibold text-[#292F2B]">{totalRecords}</span> results
        </p>
      )}

      {/* Page controls */}
      <nav className="inline-flex items-center gap-1">
        {/* Previous button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8] text-[#292F2B] hover:bg-[#F7F4EC] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Number buttons */}
        {getPageNumbers().map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[#68716A]">
                …
              </span>
            );
          }

          const pageNum = Number(page);
          const isCurrent = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-medium transition-colors border',
                isCurrent
                  ? 'bg-[#365442] border-[#365442] text-white shadow-xs'
                  : 'bg-[#FFFDF8] border-[#E5E0D5] text-[#292F2B] hover:bg-[#F7F4EC]'
              )}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8] text-[#292F2B] hover:bg-[#F7F4EC] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
