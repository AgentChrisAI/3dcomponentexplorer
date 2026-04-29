import React, { useEffect, useState } from 'react';

interface Props {
  repoId: string;
  filePath: string;
  fallbackCode?: string;
}

export default function CodeViewer({ repoId, filePath, fallbackCode }: Props) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Try API first, fall back to inline code
    fetch(`/api/source?repo=${encodeURIComponent(repoId)}&path=${encodeURIComponent(filePath)}`)
      .then(r => {
        if (!r.ok) throw new Error('API not available');
        return r.json();
      })
      .then(async (data) => {
        if (data.source) {
          try {
            const { codeToHtml } = await import('shiki');
            const highlighted = await codeToHtml(data.source, { lang: data.language || 'tsx', theme: 'github-dark' });
            setHtml(highlighted);
          } catch {
            setHtml(wrapPre(data.source));
          }
        } else {
          throw new Error('No source');
        }
        setLoading(false);
      })
      .catch(async () => {
        // Fallback: show the sandpackExample or path info
        const code = fallbackCode || `// Source: ${repoId}/${filePath}\n// API server not running — run locally with: npm run dev`;
        try {
          const { codeToHtml } = await import('shiki');
          const highlighted = await codeToHtml(code, { lang: 'tsx', theme: 'github-dark' });
          setHtml(highlighted);
        } catch {
          setHtml(wrapPre(code));
        }
        setLoading(false);
      });
  }, [repoId, filePath, fallbackCode]);

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 12 }}>Loading source...</div>;

  return (
    <div
      style={{ background: 'var(--bg-page)', borderRadius: 6, padding: 12, overflow: 'auto', maxHeight: 400 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function wrapPre(s: string): string {
  const escaped = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<pre style="margin:0;white-space:pre-wrap;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary)">${escaped}</pre>`;
}
