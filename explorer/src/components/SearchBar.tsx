import React, { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';

interface SearchEntry { repoId: string; repoName: string; componentId: string; componentName: string; description: string; tags: string[]; category: string; }
interface Props { searchIndex: SearchEntry[]; onSelect: (repoId: string, componentId: string) => void; onClose: () => void; }

export default function SearchBar({ searchIndex, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => new Fuse(searchIndex, { keys: ['componentName', 'repoName', 'description', 'tags'], threshold: 0.4 }), [searchIndex]);

  const results = useMemo(() => {
    if (!query) return [];
    return fuse.search(query).slice(0, 20).map(r => r.item);
  }, [query, fuse]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) { onSelect(results[selectedIdx].repoId, results[selectedIdx].componentId); onClose(); }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'15vh' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:560, maxHeight:'60vh', overflow:'auto' }}>
        <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }} onKeyDown={onKey} placeholder="Search components, libraries, props..." style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border-default)', borderRadius:999, padding:'12px 20px', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:14, outline:'none', boxSizing:'border-box' }} />
        {results.length > 0 && (
          <div style={{ marginTop:8, border:'1px solid var(--border-subtle)', borderRadius:10, overflow:'hidden' }}>
            {results.map((r, i) => (
              <div key={`${r.repoId}-${r.componentId}-${i}`} onClick={() => { onSelect(r.repoId, r.componentId); onClose(); }} style={{ padding:'10px 16px', background: i === selectedIdx ? 'var(--bg-hover)' : 'transparent', cursor:'pointer', borderBottom:'1px solid var(--border-subtle)', transition:'background 120ms ease' }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{r.componentName}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{r.repoName} · {r.category}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
