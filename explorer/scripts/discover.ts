import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { Component, ComponentProp } from '../src/types/manifest.ts';

const TAG_RULES: [string, string[]][] = [
  ['form', ['Input', 'Select', 'Checkbox', 'Radio', 'Form', 'Field', 'Textarea']],
  ['interactive', ['Button', 'Modal', 'Dialog', 'Drawer', 'Popover', 'Tooltip', 'Menu']],
  ['layout', ['Grid', 'Flex', 'Stack', 'Container', 'Box', 'Row', 'Col']],
  ['display', ['Card', 'Badge', 'Avatar', 'Icon', 'Image', 'Text', 'Heading']],
  ['navigation', ['Nav', 'Breadcrumb', 'Tab', 'Sidebar', 'Link']],
  ['feedback', ['Alert', 'Toast', 'Spinner', 'Skeleton', 'Progress', 'Loading']],
];

function inferTags(name: string): string[] {
  const tags: string[] = [];
  for (const [tag, keywords] of TAG_RULES) {
    if (keywords.some((k) => name.includes(k))) tags.push(tag);
  }
  return tags.length ? tags : ['other'];
}

function parseProps(source: string, componentName: string): ComponentProp[] {
  const propsPattern = new RegExp(
    `(?:interface|type)\\s+${componentName}Props\\s*(?:=\\s*)?\\{([^}]*)\\}`,
    's'
  );
  const match = source.match(propsPattern);
  if (!match) return [];

  const block = match[1];
  const propLines = block.split('\n').filter((l) => l.includes(':'));
  return propLines.slice(0, 20).map((line) => {
    const trimmed = line.trim().replace(/[;,]$/, '');
    const optional = trimmed.includes('?');
    const [rawName, ...typeParts] = trimmed.split(':');
    const name = rawName.replace('?', '').trim();
    const type = typeParts.join(':').trim();
    return { name, type, required: !optional };
  });
}

function extractExportNames(source: string): string[] {
  const names: string[] = [];
  const defaultMatch = source.match(/export\s+default\s+(?:function|class|const)\s+(\w+)/);
  if (defaultMatch) names.push(defaultMatch[1]);
  const namedMatches = source.matchAll(/export\s+(?:function|class|const)\s+(\w+)/g);
  for (const m of namedMatches) names.push(m[1]);
  return [...new Set(names)];
}

export interface DiscoverResult {
  name: string;
  version: string;
  description: string;
  components: Component[];
}

export async function discoverRepo(repoPath: string, githubUrl: string): Promise<DiscoverResult> {
  const pkgPath = path.join(repoPath, 'package.json');
  let pkgName = path.basename(repoPath);
  let version = 'unknown';
  let description = '';

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkgName = pkg.name || pkgName;
      version = pkg.version || version;
      description = pkg.description || '';
    } catch {}
  }

  // Find component files
  const patterns = [
    'src/index.ts', 'src/index.tsx',
    'packages/*/src/index.tsx',
    'src/**/*.tsx',
    'components/**/*.tsx',
  ];
  const excludes = ['*.test.*', '*.stories.*', '*.spec.*', '*__tests__*', '*node_modules*'];

  const allFiles: string[] = [];
  for (const pat of patterns) {
    try {
      const found = await glob(pat, { cwd: repoPath, ignore: excludes, absolute: false });
      allFiles.push(...found);
    } catch {}
  }

  // Deduplicate
  const uniqueFiles = [...new Set(allFiles)].sort((a, b) => a.split('/').length - b.split('/').length);
  const seen = new Set<string>();
  const components: Component[] = [];

  for (const relPath of uniqueFiles) {
    if (components.length >= 40) break;
    const absPath = path.join(repoPath, relPath);
    let source: string;
    try {
      source = fs.readFileSync(absPath, 'utf8');
    } catch { continue; }

    const names = extractExportNames(source);
    for (const name of names) {
      if (seen.has(name) || components.length >= 40) continue;
      if (/^[a-z]/.test(name) || name.length < 2) continue; // skip non-component exports
      seen.add(name);

      const props = parseProps(source, name);
      const tags = inferTags(name);

      // JSDoc description
      const jsdocMatch = source.match(/\/\*\*\s*\n?\s*\*?\s*(.+?)(?:\n|\*\/)/);
      const desc = jsdocMatch ? jsdocMatch[1].trim() : `${name} component from ${pkgName}`;

      const sandpackExample = [
        `import { ${name} } from '${pkgName}';`,
        '',
        'export default function Preview() {',
        '  return (',
        `    <div style={{ padding: 24, background: '#000', minHeight: 200 }}>`,
        `      <${name} />`,
        '    </div>',
        '  );',
        '}',
      ].join('\n');

      components.push({
        id: name.toLowerCase(),
        name,
        path: relPath,
        description: desc,
        props,
        sandpackExample,
        tags,
      });
    }
  }

  return { name: pkgName, version, description, components };
}

// CLI entry
if (process.argv[1]?.endsWith('discover.ts')) {
  const repoPath = process.argv[2];
  if (!repoPath) {
    console.error('Usage: tsx scripts/discover.ts <repo-path>');
    process.exit(1);
  }
  discoverRepo(repoPath, '').then((r) => {
    console.log(JSON.stringify(r, null, 2));
  });
}
