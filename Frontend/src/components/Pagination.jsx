import React from 'react';

/**
 * Simple Prev / Next pagination.
 * hasMore = true  → fetched exactly PAGE_SIZE records, likely more exist.
 * hasMore = false → fetched fewer than PAGE_SIZE, we are on the last page.
 */
export default function Pagination({ page, hasMore, onPrev, onNext, loading, pageSize = 100 }) {
  if (page === 1 && !hasMore) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '16px 0',
      marginTop: '8px',
    }}>
      <button
        onClick={onPrev}
        disabled={page === 1 || loading}
        style={btnStyle(page === 1 || loading)}
      >
        ← Previous
      </button>

      <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>
        Page {page} &nbsp;·&nbsp; showing up to {pageSize} records
      </span>

      <button
        onClick={onNext}
        disabled={!hasMore || loading}
        style={btnStyle(!hasMore || loading)}
      >
        Next →
      </button>
    </div>
  );
}

function btnStyle(disabled) {
  return {
    padding: '7px 18px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    background: disabled ? '#f3f4f6' : '#fff',
    color: disabled ? '#9ca3af' : '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    fontSize: '13px',
    transition: 'background 0.15s',
  };
}
