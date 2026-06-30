import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };
  const renderPageNumbers = () => {
    const pages = [];
    // Show up to 5 page numbers, with ellipsis if needed
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 rounded ${i === currentPage ? 'bg-crm-primary text-white' : 'bg-crm-muted text-crm-text'} hover:bg-crm-primary/10`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex items-center gap-2 mt-4 justify-center">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded bg-crm-muted text-crm-text disabled:opacity-50"
      >
        ‹ Prev
      </button>
      {renderPageNumbers()}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded bg-crm-muted text-crm-text disabled:opacity-50"
      >
        Next ›
      </button>
    </div>
  );
}
