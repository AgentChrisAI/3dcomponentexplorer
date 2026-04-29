import React, { useState, useMemo } from 'react';

interface Repo {
  id: string; name: string; version: string; description: string;
  category: string; githubUrl: string; components: any[];
}

interface Props { repo: Repo; onClose: () => void; }

export default function ComponentPanel({ repo, onClose }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab] = useState<'preview' | 'code' | 'props'>('preview');
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const filtered = repo.components.filter((c: any) =>
      !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.tags?.some((t: string) => t.includes(search.toLowerCase()))
    );
    for (const c of filtered) {
      const cat = c.tags?.[0] || 'other';
      (groups[cat] ??= []).push(c);
    }
    return groups;
  }, [repo.components, search]);

  return (
    <div style={{ position:'fixed', right:0, top:0, bottom:0, width:540, background:'var(--bg-card)', borderLeft:'1px solid var(--border-default)', overflowY:'auto', zIndex:100, transition:'transform 120ms ease' }}>
      <div style={{ padding:20 }}>
        <button onClick={onClose} style={{ background:'none', border:'1px solid var(--border-default)', color:'var(--text-primary)', borderRadius:999, padding:'6px 16px', cursor:'pointer', marginBottom:16, fontFamily:'var(--font-base)' }}>← Back</button>
        <h2 style={{ fontFamily:'var(--font-display)', margin:'8px 0 4px', fontSize:22 }}>{repo.name}</h2>
        <div style={{ color:'var(--text-secondary)', fontSize:14 }}>{repo.description}</div>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <span style={{ background:'var(--bg-hover)', border:'1px solid var(--border-subtle)', borderRadius:999, padding:'2px 10px', fontSize:11, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)' }}>{repo.category}</span>
          <span style={{ color:'var(--text-muted)', fontSize:12 }}>{repo.components.length} components</span>
          <span style={{ color:'var(--text-muted)', fontSize:12, fontFamily:'var(--font-mono)' }}>v{repo.version}</span>
        </div>
        {repo.githubUrl && <a href={repo.githubUrl} target="_blank" rel="noopener" style={{ color:'var(--text-secondary)', fontSize:12, display:'block', marginTop:8 }}>{repo.githubUrl} ↗</a>}
      </div>

      <div style={{ padding:'0 20px 12px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search components..." style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border-default)', borderRadius:999, padding:'8px 16px', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:13, outline:'none' }} />
      </div>

      {Object.entries(grouped).map(([cat, comps]) => (
        <div key={cat} style={{ padding:'0 20px 16px' }}>
          <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)', marginBottom:8 }}>{cat}</div>
          {comps.map((c: any) => (
            <div key={c.id} style={{ border:'1px solid var(--border-subtle)', borderRadius:10, marginBottom:8, overflow:'hidden' }}>
              <div onClick={() => setExpanded(expanded === c.id ? null : c.id)} style={{ padding:'10px 14px', cursor:'pointer', background: expanded === c.id ? 'var(--bg-hover)' : 'transparent', transition:'background 120ms ease' }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{c.name}</div>
                <div style={{ color:'var(--text-secondary)', fontSize:12 }}>{c.description}</div>
              </div>
              {expanded === c.id && (
                <div style={{ borderTop:'1px solid var(--border-subtle)' }}>
                  <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border-subtle)' }}>
                    {(['preview','code','props'] as const).map(t => (
                      <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'6px', background: tab === t ? 'var(--bg-hover)' : 'transparent', border:'none', color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.07em', cursor:'pointer', transition:'background 120ms ease' }}>{t}</button>
                    ))}
                  </div>
                  <div style={{ padding:12, minHeight:120 }}>
                    {tab === 'preview' && <div style={{ color:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:12, background:'var(--bg-page)', padding:16, borderRadius:6 }}>Live preview (Sandpack) will render here</div>}
                    {tab === 'code' && <pre style={{ color:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:12, whiteSpace:'pre-wrap', margin:0 }}>{c.sandpackExample || 'No source available'}</pre>}
                    {tab === 'props' && (
                      c.props?.length > 0 ? (
                        <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:6, overflow:'hidden' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 60px', gap:1 }}>
                            {['Name','Type','Req'].map(h => <div key={h} style={{ background:'var(--bg-card)', padding:'6px 8px', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)' }}>{h}</div>)}
                            {c.props.map((p: any) => (
                              <React.Fragment key={p.name}>
                                <div style={{ background:'var(--bg-card)', padding:'6px 8px', fontFamily:'var(--font-mono)', fontSize:12 }}>{p.name}</div>
                                <div style={{ background:'var(--bg-card)', padding:'6px 8px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-secondary)' }}>{p.type}</div>
                                <div style={{ background:'var(--bg-card)', padding:'6px 8px', fontSize:12, color: p.required ? 'var(--text-primary)' : 'var(--text-muted)' }}>{p.required ? '✓' : '–'}</div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ) : <div style={{ color:'var(--text-muted)', fontSize:12 }}>No props detected</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
