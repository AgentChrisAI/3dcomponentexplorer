import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
}

interface Component {
  id: string;
  name: string;
  path: string;
  description: string;
  props: ComponentProp[];
  sandpackExample?: string;
  tags: string[];
}

const TAG_RULES: [string, string[]][] = [
  ['form', ['Input', 'Select', 'Checkbox', 'Radio', 'Form', 'Field', 'Textarea', 'Switch', 'Slider', 'DatePicker', 'TimePicker', 'Upload', 'Rate', 'Transfer', 'ColorPicker']],
  ['interactive', ['Button', 'Modal', 'Dialog', 'Drawer', 'Popover', 'Tooltip', 'Menu', 'Dropdown', 'Popconfirm', 'FloatButton']],
  ['layout', ['Grid', 'Flex', 'Stack', 'Container', 'Box', 'Row', 'Col', 'Layout', 'Space', 'Divider', 'Splitter']],
  ['display', ['Card', 'Badge', 'Avatar', 'Icon', 'Image', 'Text', 'Heading', 'Typography', 'Tag', 'Statistic', 'Descriptions', 'Table', 'List', 'Tree', 'Timeline', 'Calendar', 'Segmented']],
  ['navigation', ['Nav', 'Breadcrumb', 'Tab', 'Tabs', 'Sidebar', 'Link', 'Pagination', 'Steps', 'Anchor', 'Affix']],
  ['feedback', ['Alert', 'Toast', 'Spinner', 'Skeleton', 'Progress', 'Loading', 'Notification', 'Message', 'Result', 'Spin', 'Watermark']],
];

function inferTags(name: string): string[] {
  const tags: string[] = [];
  for (const [tag, keywords] of TAG_RULES) {
    if (keywords.some((k) => name.toLowerCase().includes(k.toLowerCase()))) tags.push(tag);
  }
  return tags.length ? tags : ['other'];
}

function parseProps(source: string, componentName: string): ComponentProp[] {
  const patterns = [
    new RegExp(`(?:interface|type)\\s+${componentName}Props\\s*(?:=\\s*)?\\{([^}]*)\\}`, 's'),
    new RegExp(`(?:interface|type)\\s+${componentName}Props\\s*(?:extends[^{]*)?\\{([^}]*)\\}`, 's'),
  ];
  for (const pat of patterns) {
    const match = source.match(pat);
    if (!match) continue;
    const block = match[1];
    const propLines = block.split('\n').filter((l) => l.includes(':') && !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    return propLines.slice(0, 20).map((line) => {
      const trimmed = line.trim().replace(/[;,]$/, '');
      const optional = trimmed.includes('?');
      const [rawName, ...typeParts] = trimmed.split(':');
      const name = rawName.replace('?', '').trim();
      const type = typeParts.join(':').trim();
      return { name, type, required: !optional };
    });
  }
  return [];
}

function extractComponentExports(source: string): string[] {
  const names: string[] = [];
  // default export function/class
  const defMatch = source.match(/export\s+default\s+(?:function|class)\s+(\w+)/);
  if (defMatch) names.push(defMatch[1]);
  // named export function/class/const with capital letter
  const namedMatches = source.matchAll(/export\s+(?:function|class|const)\s+([A-Z]\w+)/g);
  for (const m of namedMatches) names.push(m[1]);
  // React.forwardRef pattern
  const forwardRefMatches = source.matchAll(/export\s+const\s+([A-Z]\w+)\s*=\s*(?:React\.)?forwardRef/g);
  for (const m of forwardRefMatches) names.push(m[1]);
  return [...new Set(names)];
}

// For monorepos, find the nearest package.json to the component file
// and use its "name" field as the import package
function resolvePackageName(repoPath: string, relPath: string, fallback: string): string {
  const parts = relPath.split('/');
  // Walk up from the component file looking for package.json
  for (let i = parts.length - 1; i >= 0; i--) {
    const dir = path.join(repoPath, ...parts.slice(0, i));
    const pkgFile = path.join(dir, 'package.json');
    if (fs.existsSync(pkgFile)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
        if (pkg.name && pkg.name !== fallback && !pkg.name.includes('/root') && !pkg.private) {
          return pkg.name;
        }
      } catch {}
    }
  }
  // Known fallback mappings for common monorepos
  const KNOWN: Record<string, string> = {
    'root': '@ariakit/react',
    'braid': 'braid-design-system',
    'carbon': '@carbon/react',
    '@blueprintjs/root': '@blueprintjs/core',
    '@fluentui/fluentui-repo': '@fluentui/react-components',
    '@mui/monorepo': '@mui/material',
    'chakra-ui': '@chakra-ui/react',
    'mantine-a91763c0e2': '@mantine/core',
    'react-spectrum-monorepo': '@adobe/react-spectrum',
    'refinedev': '@refinedev/core',
    'primitives': '@radix-ui/react-dialog',
  };
  return KNOWN[fallback] || fallback;
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

  // Expanded glob patterns for monorepo support
  const patterns = [
    'src/index.ts', 'src/index.tsx',
    'src/*.tsx', 'src/**/*.tsx',
    'packages/*/src/index.tsx', 'packages/*/src/*.tsx', 'packages/*/src/**/*.tsx',
    'packages/*/index.tsx', 'packages/*/lib/*.tsx',
    'components/*.tsx', 'components/**/*.tsx',
    'lib/*.tsx', 'lib/**/*.tsx',
    'modules/*/src/*.tsx', 'modules/*/src/**/*.tsx',
  ];
  const excludes = [
    '**/*.test.*', '**/*.spec.*', '**/*.stories.*', '**/__tests__/**',
    '**/__mocks__/**', '**/node_modules/**', '**/dist/**', '**/build/**',
    '**/*.d.ts', '**/examples/**', '**/demo/**',
  ];

  const allFiles: string[] = [];
  for (const pat of patterns) {
    try {
      const found = await glob(pat, { cwd: repoPath, ignore: excludes, absolute: false });
      allFiles.push(...found);
    } catch {}
  }

  const uniqueFiles = [...new Set(allFiles)].sort((a, b) => a.split('/').length - b.split('/').length);
  const seen = new Set<string>();
  const components: Component[] = [];

  for (const relPath of uniqueFiles) {
    if (components.length >= 40) break;
    const absPath = path.join(repoPath, relPath);
    let source: string;
    try { source = fs.readFileSync(absPath, 'utf8'); } catch { continue; }

    const names = extractComponentExports(source);
    for (const name of names) {
      if (seen.has(name) || components.length >= 40) continue;
      if (name.length < 2) continue;
      // Skip internal/utility names
      if (/^(use[A-Z]|create[A-Z]|with[A-Z]|get[A-Z]|set[A-Z]|is[A-Z]|has[A-Z])/.test(name)) continue;
      if (name.startsWith('Internal') || name.startsWith('_') || name === 'default') continue;
      seen.add(name);

      const props = parseProps(source, name);
      const tags = inferTags(name);

      const jsdocMatch = source.match(/\/\*\*\s*\n?\s*\*?\s*(.+?)(?:\n|\*\/)/);
      const desc = jsdocMatch ? jsdocMatch[1].trim().slice(0, 120) : `${name} component from ${pkgName}`;

      // Resolve correct npm package name for sandpack imports
      const importPkg = resolvePackageName(repoPath, relPath, pkgName);

      const sandpackExample = [
        `import { ${name} } from '${importPkg}';`,
        '',
        'export default function Preview() {',
        '  return (',
        `    <div style={{ padding: 24, background: '#000', minHeight: 200 }}>`,
        `      <${name} />`,
        '    </div>',
        '  );',
        '}',
      ].join('\n');

      components.push({ id: name.toLowerCase(), name, path: relPath, description: desc, props, sandpackExample, tags });
    }
  }

  return { name: pkgName, version, description, components };
}

// CLI entry
if (process.argv[1]?.endsWith('discover.ts')) {
  const repoPath = process.argv[2];
  if (!repoPath) { console.error('Usage: tsx scripts/discover.ts <repo-path>'); process.exit(1); }
  discoverRepo(repoPath, '').then((r) => { console.log(JSON.stringify(r, null, 2)); });
}
