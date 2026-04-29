import React, { useState } from 'react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddRepoModal({ onClose, onSuccess }: Props) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url.includes('github.com')) {
      setStatus(['Error: URL must be a GitHub repository']);
      return;
    }
    setLoading(true);
    setStatus(['Cloning repository...']);

    try {
      const res = await fetch('/api/repos/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            const lines = text.split('\n').filter(l => l.startsWith('data:'));
            for (const line of lines) {
              const msg = line.replace('data:', '').trim();
              if (msg) setStatus(prev => [...prev, msg]);
            }
          }
        }
      } else {
        const data = await res.json();
        if (data.error) {
          setStatus(prev => [...prev, `Error: ${data.error}`]);
        } else {
          setStatus(prev => [...prev, `Done — ${data.componentCount || 0} components found`]);
        }
      }
      setLoading(false);
      onSuccess();
    } catch (e: any) {
      setStatus(prev => [...prev, `Failed: ${e.message}`]);
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 440, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 16 }}>ADD LIBRARY</div>

        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>GitHub URL</label>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://github.com/org/repo"
          disabled={loading}
          style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 999, padding: '10px 16px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        />

        {status.length > 0 && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-page)', borderRadius: 6, maxHeight: 120, overflow: 'auto' }}>
            {status.map((s, i) => (
              <div key={i} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 2 }}>{s}</div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 999, padding: '8px 20px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !url} style={{ background: 'var(--text-primary)', color: 'var(--text-inverse)', border: 'none', borderRadius: 999, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading || !url ? 0.5 : 1 }}>Clone & Discover</button>
        </div>
      </div>
    </div>
  );
}
