import React from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';

interface Props {
  code: string;
  dependencies: Record<string, string>;
  cssImports?: string[];
}

export default function LivePreview({ code, dependencies, cssImports }: Props) {
  return (
    <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
      <Sandpack
        template="react-ts"
        theme="dark"
        files={{ '/App.tsx': code }}
        customSetup={{ dependencies }}
        options={{
          showNavigator: false,
          showTabs: false,
          showLineNumbers: false,
          editorHeight: 0,
          externalResources: cssImports || [],
        }}
      />
    </div>
  );
}
