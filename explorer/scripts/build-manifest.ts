import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { discoverRepo } from './discover.ts';
import { CURATED } from '../src/data/curatedComponents.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPOS_BASE = '/home/christopher/.openclaw/workspace/ui-libraries/repos';
const CLONE_LIST = path.join(REPOS_BASE, 'clone-list.txt');
const MANIFEST_OUT = path.resolve(__dirname, '..', 'manifest.json');
const PUBLIC_MANIFEST = path.resolve(__dirname, '..', 'public', 'manifest.json');

type RepoCategory = 'primitives' | 'styled-system' | 'enterprise' | 'framework' | 'utility' | 'collections' | 'other';

const CATEGORY_MAP: Record<string, RepoCategory> = {
  'zustand': 'utility',
  'react': 'framework',
  'material-ui': 'styled-system',
  'chakra-ui': 'styled-system',
  'ant-design': 'enterprise',
  'mantine': 'styled-system',
  'react-bootstrap': 'styled-system',
  'fluentui': 'enterprise',
  'ariakit': 'primitives',
  'refine': 'framework',
  'headlessui': 'primitives',
  'primitives': 'primitives',
  'ui': 'primitives',
  'tailwindcss': 'utility',
  'react-spectrum': 'primitives',
  'grommet': 'styled-system',
  'evergreen': 'styled-system',
  'blueprint': 'enterprise',
  'carbon': 'enterprise',
  'Semantic-UI-React': 'styled-system',
  'braid-design-system': 'styled-system',
  'flyonui': 'styled-system',
  'agnosticui': 'primitives',
  'awesome-react': 'collections',
  'awesome-react-components': 'collections',
  'react-ui-component-collections': 'collections',
  '20-React-Libraries-Every-React-Developer-Should-Have-': 'collections',
};

const KNOWN_SANDPACK: Record<string, any> = {
  'material-ui': { dependencies: { '@mui/material': 'latest', '@emotion/react': 'latest', '@emotion/styled': 'latest' }, entry: 'Button' },
  'chakra-ui': { dependencies: { '@chakra-ui/react': 'latest', '@emotion/react': 'latest', '@emotion/styled': 'latest', 'framer-motion': 'latest' }, entry: 'Button' },
  'ant-design': { dependencies: { 'antd': 'latest' }, entry: 'Button' },
  'mantine': { dependencies: { '@mantine/core': 'latest', '@mantine/hooks': 'latest' }, entry: 'Button' },
  'react-bootstrap': { dependencies: { 'react-bootstrap': 'latest', 'bootstrap': 'latest' }, entry: 'Button' },
  'primitives': { dependencies: { '@radix-ui/react-dialog': 'latest' }, entry: 'Dialog' },
  'ui': { dependencies: { 'tailwindcss': 'latest', 'class-variance-authority': 'latest' }, entry: 'Button' },
  'headlessui': { dependencies: { '@headlessui/react': 'latest' }, entry: 'Dialog' },
  'ariakit': { dependencies: { '@ariakit/react': 'latest' }, entry: 'Button' },
  'fluentui': { dependencies: { '@fluentui/react-components': 'latest' }, entry: 'Button' },
  'zustand': { dependencies: { 'zustand': 'latest' }, entry: 'Counter' },
  'carbon': { dependencies: { '@carbon/react': 'latest' }, entry: 'Button' },
  'grommet': { dependencies: { 'grommet': 'latest', 'grommet-icons': 'latest', 'styled-components': 'latest' }, entry: 'Button' },
  'blueprint': { dependencies: { '@blueprintjs/core': 'latest' }, entry: 'Button' },
  'evergreen': { dependencies: { 'evergreen-ui': 'latest' }, entry: 'Button' },
  'Semantic-UI-React': { dependencies: { 'semantic-ui-react': 'latest' }, entry: 'Button' },
};

function generateOrbPosition(index: number, total: number = 27): [number, number, number] {
  const phi = Math.acos(1 - 2 * (index + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  const r = 4.5 + (index % 3) * 0.8;
  return [
    parseFloat((r * Math.sin(phi) * Math.cos(theta)).toFixed(3)),
    parseFloat((r * Math.cos(phi) * 1.2).toFixed(3)),
    parseFloat((r * Math.sin(phi) * Math.sin(theta)).toFixed(3)),
  ];
}

async function buildManifest() {
  const lines = fs.readFileSync(CLONE_LIST, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const existingManifest = fs.existsSync(MANIFEST_OUT) ? JSON.parse(fs.readFileSync(MANIFEST_OUT, 'utf8')) : null;

  const repos: any[] = [];
  let idx = 0;

  for (const githubUrl of lines) {
    const repoId = githubUrl.replace(/\.git$/, '').split('/').pop()!;
    const localPath = path.join(REPOS_BASE, repoId);

    if (!fs.existsSync(localPath)) {
      console.warn(`SKIP ${repoId} — not cloned`);
      continue;
    }

    console.log(`DISCOVER ${repoId}...`);
    let discovered;
    try {
      discovered = await discoverRepo(localPath, githubUrl);
    } catch (e) {
      console.warn(`FAIL ${repoId}: ${e}`);
      discovered = { name: repoId, version: 'unknown', description: '', components: [] };
    }

    const category = CATEGORY_MAP[repoId] || 'other';
    const existingEntry = existingManifest?.repos?.find((r: any) => r.id === repoId);

    // Use curated data if available, otherwise fall back to auto-discovery
    const curated = CURATED[repoId];
    const components = curated ? curated.components : discovered.components;
    const sandpackConfig = curated ? curated.sandpackConfig : (KNOWN_SANDPACK[repoId] || { dependencies: {}, entry: 'index' });

    console.log(`  → ${components.length} components (${curated ? 'CURATED' : 'auto-discovered'})`);

    repos.push({
      id: repoId,
      name: discovered.name || repoId,
      githubUrl,
      localPath,
      category,
      description: discovered.description || '',
      version: discovered.version || 'unknown',
      components,
      orbPosition: generateOrbPosition(idx, lines.length),
      orbSize: parseFloat((0.7 + Math.min(components.length / 40, 0.6)).toFixed(2)),
      sandpackConfig,
      lastDiscovered: new Date().toISOString(),
      addedAt: existingEntry?.addedAt || new Date().toISOString(),
    });
    idx++;
  }

  // Build search index
  const searchIndex: any[] = [];
  for (const repo of repos) {
    for (const comp of repo.components) {
      searchIndex.push({
        repoId: repo.id,
        repoName: repo.name,
        componentId: comp.id,
        componentName: comp.name,
        description: comp.description,
        tags: comp.tags,
        category: repo.category,
      });
    }
  }

  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalRepos: repos.length,
    totalComponents: repos.reduce((n: number, r: any) => n + r.components.length, 0),
    repos,
    searchIndex,
  };

  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
  if (fs.existsSync(path.dirname(PUBLIC_MANIFEST))) {
    fs.writeFileSync(PUBLIC_MANIFEST, JSON.stringify(manifest, null, 2));
  }

  console.log(`\nManifest built: ${repos.length} repos, ${manifest.totalComponents} components`);
  console.log(`Written to ${MANIFEST_OUT}`);
}

buildManifest().catch((e) => { console.error(e); process.exit(1); });
