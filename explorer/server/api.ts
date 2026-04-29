import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import Fuse from 'fuse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const MANIFEST_PATH = path.resolve(__dirname, '..', 'manifest.json');
const PUBLIC_MANIFEST = path.resolve(__dirname, '..', 'public', 'manifest.json');
const REPOS_BASE = '/home/christopher/.openclaw/workspace/ui-libraries/repos';

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

// ── READ ENDPOINTS ──────────────────────────────────────────────

app.get('/api/manifest', (_req, res) => {
  res.json(loadManifest());
});

app.get('/api/repos', (_req, res) => {
  const m = loadManifest();
  const repos = m.repos.map((r: any) => ({ ...r, components: undefined }));
  res.json(repos);
});

app.get('/api/repos/:repoId', (req, res) => {
  const m = loadManifest();
  const repo = m.repos.find((r: any) => r.id === req.params.repoId);
  if (!repo) return res.status(404).json({ error: 'Repo not found' });
  res.json(repo);
});

app.get('/api/repos/:repoId/components', (req, res) => {
  const m = loadManifest();
  const repo = m.repos.find((r: any) => r.id === req.params.repoId);
  if (!repo) return res.status(404).json({ error: 'Repo not found' });
  res.json(repo.components);
});

app.get('/api/repos/:repoId/components/:componentId', (req, res) => {
  const m = loadManifest();
  const repo = m.repos.find((r: any) => r.id === req.params.repoId);
  if (!repo) return res.status(404).json({ error: 'Repo not found' });
  const comp = repo.components.find((c: any) => c.id === req.params.componentId);
  if (!comp) return res.status(404).json({ error: 'Component not found' });
  res.json(comp);
});

app.get('/api/search', (req, res) => {
  const m = loadManifest();
  const q = (req.query.q as string) || '';
  const category = req.query.category as string;
  const tag = req.query.tag as string;
  const limit = parseInt(req.query.limit as string) || 20;

  let index = m.searchIndex || [];
  if (category) index = index.filter((e: any) => e.category === category);
  if (tag) index = index.filter((e: any) => e.tags?.includes(tag));

  if (!q) {
    return res.json({ results: index.slice(0, limit), total: index.length, query: q });
  }

  const fuse = new Fuse(index, { keys: ['componentName', 'repoName', 'description', 'tags'], threshold: 0.4 });
  const results = fuse.search(q).slice(0, limit).map(r => r.item);
  res.json({ results, total: results.length, query: q });
});

app.get('/api/source', (req, res) => {
  const repoId = req.query.repo as string;
  const relPath = req.query.path as string;
  if (!repoId || !relPath) return res.status(400).json({ error: 'Missing repo or path' });

  // Security: prevent directory traversal
  const repoPath = path.join(REPOS_BASE, repoId);
  const fullPath = path.resolve(repoPath, relPath);
  if (!fullPath.startsWith(repoPath)) return res.status(403).json({ error: 'Path traversal denied' });

  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });

  const source = fs.readFileSync(fullPath, 'utf8');
  const ext = path.extname(fullPath).replace('.', '');
  const langMap: Record<string, string> = { tsx: 'tsx', ts: 'typescript', jsx: 'jsx', js: 'javascript', css: 'css' };
  res.json({ source, language: langMap[ext] || ext, path: relPath });
});

// ── WRITE ENDPOINTS ─────────────────────────────────────────────

app.post('/api/repos/add', (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('github.com')) {
    return res.status(400).json({ error: 'Invalid GitHub URL' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (msg: string) => res.write(`data:${msg}\n\n`);

  const repoId = url.replace(/\.git$/, '').split('/').pop();
  const localPath = path.join(REPOS_BASE, repoId);

  send('Cloning repository...');

  try {
    if (!fs.existsSync(localPath)) {
      execSync(`git clone --depth 1 ${url} ${localPath}`, { timeout: 60000 });
    } else {
      send('Repository already cloned, re-discovering...');
    }

    // Append to clone-list if not present
    const cloneList = path.join(REPOS_BASE, 'clone-list.txt');
    const existing = fs.readFileSync(cloneList, 'utf8');
    if (!existing.includes(url)) {
      fs.appendFileSync(cloneList, `\n${url}`);
    }

    send('Discovering components...');

    // Run build-manifest
    const scriptPath = path.resolve(__dirname, '..', 'scripts', 'build-manifest.ts');
    execSync(`npx tsx ${scriptPath}`, { cwd: path.resolve(__dirname, '..'), timeout: 120000 });

    send('Updating manifest...');

    // Copy to public
    if (fs.existsSync(PUBLIC_MANIFEST)) {
      fs.copyFileSync(MANIFEST_PATH, PUBLIC_MANIFEST);
    }

    const m = loadManifest();
    const newRepo = m.repos.find((r: any) => r.id === repoId);
    const count = newRepo?.components?.length || 0;

    send(`Done — ${count} components found`);
    res.end();
  } catch (e: any) {
    send(`Error: ${e.message}`);
    res.end();
  }
});

app.post('/api/repos/:repoId/rediscover', (req, res) => {
  const repoId = req.params.repoId;
  try {
    const scriptPath = path.resolve(__dirname, '..', 'scripts', 'build-manifest.ts');
    execSync(`npx tsx ${scriptPath}`, { cwd: path.resolve(__dirname, '..'), timeout: 120000 });
    const m = loadManifest();
    const repo = m.repos.find((r: any) => r.id === repoId);
    res.json(repo || { error: 'Repo not found after rebuild' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/repos/:repoId', (req, res) => {
  const m = loadManifest();
  m.repos = m.repos.filter((r: any) => r.id !== req.params.repoId);
  m.totalRepos = m.repos.length;
  m.totalComponents = m.repos.reduce((n: number, r: any) => n + (r.components?.length || 0), 0);
  m.searchIndex = m.searchIndex?.filter((e: any) => e.repoId !== req.params.repoId) || [];
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2));
  res.json({ success: true });
});

// ── AGENT CONTEXT ENDPOINT ──────────────────────────────────────

app.get('/api/agent/context', (_req, res) => {
  const m = loadManifest();
  const categories: Record<string, string[]> = {};
  for (const r of m.repos) {
    (categories[r.category] ??= []).push(r.name);
  }
  res.json({
    description: `OpenClaw UI Library Explorer. Contains ${m.totalRepos} React component libraries with ${m.totalComponents} total components.`,
    capabilities: ['search', 'browse', 'source-view', 'live-preview', 'add-repo'],
    endpoints: {
      'GET /api/manifest': 'Full manifest JSON',
      'GET /api/repos': 'All repos (no component source)',
      'GET /api/repos/:id': 'Single repo with components',
      'GET /api/repos/:id/components': 'Component list',
      'GET /api/repos/:id/components/:cid': 'Single component',
      'GET /api/search?q=&category=&tag=&limit=': 'Fuzzy search',
      'GET /api/source?repo=&path=': 'Source file content',
      'POST /api/repos/add {url}': 'Clone and discover new repo (SSE)',
      'POST /api/repos/:id/rediscover': 'Re-run discovery',
      'DELETE /api/repos/:id': 'Remove from manifest',
    },
    categories,
    stats: { totalRepos: m.totalRepos, totalComponents: m.totalComponents, lastUpdated: m.generatedAt },
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
