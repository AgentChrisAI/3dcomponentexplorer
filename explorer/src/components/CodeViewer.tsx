import React from 'react';

interface Props {
  repoId: string;
  filePath: string;
  fallbackCode?: string;
}

export default function CodeViewer({ repoId, filePath, fallbackCode }: Props) {
  const code = fallbackCode || `// Source: ${repoId}/${filePath}\n// Run locally with 'npm run dev' to view full source`;

  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 6, padding: 12, overflow: 'auto', maxHeight: 400 }}>
      <pre style={{
        margin: 0,
        whiteSpace: 'pre-wrap',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        lineHeight: 1.6,
        color: 'var(--text-secondary)',
      }}>
        {code}
      </pre>
    </div>
  );
}
