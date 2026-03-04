import React from 'react';

const REGIONS = ['All', 'West Africa', 'East Africa', 'North Africa', 'Southern Africa', 'Central Africa'];

export default function FilterBar({ activeFilter, setActiveFilter, setSearchQuery }) {
  return (
    <div style={{
      position: 'sticky',
      top: '70px', // Adjusted for mobile-friendly nav height
      zIndex: 90,
      background: 'var(--bg)',
      padding: '10px 0',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      width: '100%', // Ensure it stays within screen
      overflow: 'hidden' // Prevents bar from leaking out
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>

        {/* Search Input - Optimized for Mobile Padding */}
        <div style={{ padding: '0 5px' }}>
          <input
            type="text"
            placeholder="Search recipes..."
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: '50px',
              border: '1px solid #eee',
              fontSize: '1rem',
              marginBottom: '15px',
              outline: 'none',
              boxSizing: 'border-box', // Crucial for mobile width
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
            }}
          />
        </div>

        {/* Swipeable Region Pills */}
        <div style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto', // Enables horizontal swipe
          padding: '5px 5px 15px 5px',
          scrollbarWidth: 'none', // Hides scrollbar (Firefox)
          msOverflowStyle: 'none', // Hides scrollbar (IE/Edge)
          WebkitOverflowScrolling: 'touch', // Smooth momentum scrolling for iOS
        }}>
          {/* Internal style tag to hide scrollbars for Chrome/Safari */}
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => setActiveFilter(region)}
              style={{
                flexShrink: 0, // IMPORTANT: Prevents buttons from squishing
                whiteSpace: 'nowrap', // Keeps text on one line
                padding: '10px 22px',
                borderRadius: '50px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem', // Slightly smaller for better mobile fit
                fontWeight: '600',
                transition: 'all 0.2s ease',
                background: activeFilter === region ? 'var(--accent)' : 'white',
                color: activeFilter === region ? 'white' : 'var(--primary)',
                boxShadow: activeFilter === region
                  ? '0 4px 12px rgba(226, 114, 91, 0.3)'
                  : '0 2px 8px rgba(0,0,0,0.05)',
                userSelect: 'none', // Prevents text selection while swiping
                WebkitTapHighlightColor: 'transparent' // Removes blue box on tap
              }}
            >
              {region}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}