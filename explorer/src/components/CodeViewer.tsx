import React, { useEffect, useState } from 'react';

interface Props {
  repoId: string;
  filePath: string;
}

export default function CodeViewer({ repoId, filePath }: Props) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/source?repo=${encodeURIComponent(repoId)}&path=${encodeURIComponent(filePath)}`)
      .then(r => r.json())
      .then(async (data) => {
        if (data.source) {
          // Use Shiki for highlighting if available, otherwise fall back to pre
          try {
            const { codeToHtml } = await import('shiki');
            const highlighted = await codeToHtml(data.source, {
              lang: data.language || 'tsx',
              theme: 'github-dark',
            });
            setHtml(highlighted);
          } catch {
            setHtml(`<pre style="margin:0;white-space:pre-wrap;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary)">${escapeHtml(data.source)}</pre>`);
          }
        } else {
          setHtml('<p style="color:var(--text-muted)">Source not available</p>');
        }
        setLoading(false);
      })
      .catch(() => {
        setHtml('<p style="color:var(--text-muted)">Failed to load source</p>');
        setLoading(false);
      });
  }, [repoId, filePath]);

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 12 }}>Loading source...</div>;

  return (
    <div
      style={{ background: 'var(--bg-page)', borderRadius: 6, padding: 12, overflow: 'auto', maxHeight: 400 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
