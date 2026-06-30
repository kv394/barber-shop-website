import React from 'react';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
}

export default function BulkActionBar({ selectedCount, onClearSelection, onDeleteSelected }: BulkActionBarProps) {
  if (selectedCount === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-crm-surface border border-crm-border rounded-xl shadow-lg px-4 py-2 flex items-center gap-4 z-50">
      <span className="text-sm font-medium text-crm-text">{selectedCount} selected</span>
      <button
        onClick={onDeleteSelected}
        className="bg-status-cancelled/20 text-status-cancelled border border-status-cancelled/30 hover:bg-status-cancelled/30 px-3 py-1 rounded"
      >
        Delete
      </button>
      <button
        onClick={onClearSelection}
        className="bg-crm-muted/10 text-crm-muted border border-crm-muted/30 hover:bg-crm-muted/30 px-3 py-1 rounded"
      >
        Clear Selection
      </button>
    </div>
  );
}
