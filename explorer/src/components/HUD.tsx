import React from 'react';

const CATEGORIES = ['All', 'primitives', 'styled-system', 'enterprise', 'framework', 'utility', 'collections'];

interface Props {
  totalRepos: number;
  totalComponents: number;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  onSearchOpen: () => void;
}

export default function HUD({ totalRepos, totalComponents, activeCategory, onCategoryChange, onSearchOpen }: Props) {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:50 }}>
      {/* Wordmark */}
      <div style={{ position:'absolute', top:20, left:24, fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, letterSpacing:'0.1em', color:'var(--text-muted)', textTransform:'uppercase' }}>
        OPENCLAW EXPLORER
      </div>

      {/* Stats */}
      <div style={{ position:'absolute', top:20, right:24, fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>
        {totalRepos} libraries · {totalComponents} components
      </div>

      {/* Search trigger */}
      <div style={{ position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)', pointerEvents:'auto' }}>
        <button onClick={onSearchOpen} style={{ background:'transparent', border:'1px solid var(--border-default)', borderRadius:999, padding:'8px 20px', color:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:13, cursor:'pointer', transition:'background 120ms ease' }}>
          ⌘K Search
        </button>
      </div>

      {/* Category pills */}
      <div style={{ position:'absolute', bottom:24, right:24, display:'flex', gap:6, pointerEvents:'auto' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => onCategoryChange(cat === 'All' ? '' : cat)} style={{
            background: (cat === 'All' && !activeCategory) || activeCategory === cat ? 'var(--text-primary)' : 'transparent',
            color: (cat === 'All' && !activeCategory) || activeCategory === cat ? 'var(--text-inverse)' : 'var(--text-muted)',
            border: '1px solid var(--border-default)',
            borderRadius: 999,
            padding: '4px 12px',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            cursor: 'pointer',
            transition: 'background 120ms ease, color 120ms ease',
          }}>{cat}</button>
        ))}
      </div>
    </div>
  );
}
