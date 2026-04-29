# Coding Agent Prompt — OpenClaw 3D Component Library Explorer

## Project Identity

You are building **OpenClaw UI Explorer** — a 3D interactive component library browser. It is a local-first Vite + React + TypeScript application that renders a WebGL 3D space of floating orbs, one per React library repo. Clicking an orb opens a panel showing that library's components with live sandboxed previews and source code. The system is agent-searchable via both a REST API and a flat manifest JSON.

This project already has a working 3D WebGL scene in a standalone HTML file (`xai-component-library.html`). Your job is to migrate that scene into a proper Vite + React app and wire it to real data.

---

## Design System — Non-Negotiable

Every pixel must match the **xAI/Grok design language** exactly. You have extracted these tokens. Use them without exception.

```css
:root {
 --bg-page:        #000000;
 --bg-surface:     #0a0a0a;
 --bg-card:        #111111;
 --bg-hover:       #161616;
 --bg-selected:    #1a1a1a;
 --bg-input:       #0d0d0d;
 --border-subtle:  rgba(255,255,255,0.06);
 --border-default: rgba(255,255,255,0.12);
 --border-strong:  rgba(255,255,255,0.22);
 --text-primary:   #ffffff;
 --text-secondary: rgba(255,255,255,0.55);
 --text-muted:     rgba(255,255,255,0.32);
 --text-inverse:   #000000;
 --accent:         #ffffff;
 --accent-text:    #000000;
 --status-online:  #00d26a;
 --font-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
 --font-mono: "SF Mono", "Fira Code", "Cascadia Code", monospace;
 --font-display: 'Syne', sans-serif;
 --r-sm: 6px; --r-md: 10px; --r-lg: 16px; --r-pill: 999px;
 --t-fast: 120ms ease; --t-base: 200ms ease;
 --t-slow: 400ms cubic-bezier(.16,1,.3,1);
}
```

**Hard rules:**
- Black (`#000`) background everywhere. No exceptions.
- Zero colour accents — monochromatic white/black only. `#00d26a` for online status dot only.
- No `box-shadow` for elevation — borders only.
- No gradients, blur, or glow effects.
- Buttons: `border-radius: 999px` always. Primary = white fill, ghost = outlined.
- Grid-seam tables: parent `background: rgba(255,255,255,0.06); gap: 1px` — children `background: #111`.
- Transitions: `120ms ease` on background/border only. No transforms, no springs.
- All monospace values (code, tokens, keys, paths) use `var(--font-mono)`.
- Section labels: `10px / 600 / uppercase / letter-spacing: 0.07em / color: rgba(255,255,255,0.32)`.
- Typography hierarchy: `font-family: 'Syne'` for display/headings, system stack for UI.

---

## Repo Locations

```
Base path: /home/christopher/.openclaw/workspace/ui-libraries/repos/
Clone list: /home/christopher/.openclaw/workspace/ui-libraries/repos/clone-list.txt
Manifest out: /home/christopher/.openclaw/workspace/ui-libraries/manifest.json
Explorer app: /home/christopher/.openclaw/workspace/ui-libraries/explorer/
```

**Known repos (may not be exhaustive — read clone-list.txt as source of truth):**
zustand, react, material-ui, chakra-ui, ant-design, mantine, react-bootstrap, fluentui,
ariakit, refine, headlessui, radix-ui, shadcn-ui, tailwindcss, Semantic-UI-React,
agnosticui, braid-design-system, carbon, grommet, evergreen, flyonui, react-spectrum,
react-ui-component-collections, 20-React-Libraries-Every-React-Developer-Should-Have

---

## Deliverables

Build all of the following. Do not skip any section.

---

### 1. Vite + React + TypeScript App Scaffold

**Location:** `/home/christopher/.openclaw/workspace/ui-libraries/explorer/`

```
explorer/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── scene/
│   │   ├── OrbScene.tsx          ← WebGL canvas, migrated from xai-component-library.html
│   │   ├── useWebGL.ts           ← WebGL init, shader compilation, render loop
│   │   ├── orbGeometry.ts        ← sphere + ring geometry builders
│   │   ├── shaders.ts            ← VS/FS source strings (orb, ring, star)
│   │   └── matMath.ts            ← mat4 helpers (mul, per, lkAt, rotY, etc.)
│   ├── components/
│   │   ├── ComponentPanel.tsx    ← right slide-in panel
│   │   ├── LivePreview.tsx       ← Sandpack iframe per component
│   │   ├── CodeViewer.tsx        ← syntax-highlighted source
│   │   ├── SearchBar.tsx         ← global search with keyboard shortcut
│   │   ├── AddRepoModal.tsx      ← paste GitHub URL → trigger add-repo script
│   │   └── HUD.tsx               ← wordmark, audio btn, nav hints
│   ├── hooks/
│   │   ├── useManifest.ts        ← loads + caches manifest.json
│   │   ├── useSearch.ts          ← fuzzy search across manifest
│   │   └── useAudio.ts           ← Web Audio API ambient engine
│   ├── api/
│   │   └── client.ts             ← typed fetch helpers for REST API
│   ├── types/
│   │   └── manifest.ts           ← TypeScript interfaces
│   └── styles/
│       └── tokens.css            ← CSS custom properties (design tokens above)
├── server/
│   └── api.ts                    ← Express API server (runs alongside Vite)
├── scripts/
│   ├── discover.ts               ← component auto-discovery
│   ├── build-manifest.ts         ← generates manifest.json
│   └── add-repo.ts               ← clone + discover + update manifest
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**package.json dependencies:**
```json
{
 "dependencies": {
 "react": "^18",
 "react-dom": "^18",
 "@codesandbox/sandpack-react": "^2",
 "@codesandbox/sandpack-client": "^2",
 "express": "^4",
 "fuse.js": "^7",
 "shiki": "^1",
 "syne": "*"
 },
 "devDependencies": {
 "typescript": "^5",
 "vite": "^5",
 "@types/react": "^18",
 "@types/express": "^4",
 "tsx": "^4",
 "glob": "^10",
 "@typescript-eslint/parser": "^7"
 },
 "scripts": {
 "dev": "concurrently \"vite\" \"tsx server/api.ts\"",
 "build": "vite build",
 "manifest": "tsx scripts/build-manifest.ts",
 "add-repo": "tsx scripts/add-repo.ts"
 }
}
```

---
### 2. Manifest Schema

**File:** `/home/christopher/.openclaw/workspace/ui-libraries/manifest.json`

This is the single source of truth for both the UI and the agent API. Every orb, component, and search query resolves to this file.

```typescript
// types/manifest.ts

export interface ComponentProp {
 name: string;
 type: string;
 required: boolean;
 default?: string;
 description?: string;
}

export interface Component {
 id: string; // "button", "modal", etc.
 name: string; // "Button"
 path: string; // relative path inside repo
 description: string; // from README/JSDoc or auto-generated
 props: ComponentProp[]; // parsed from TypeScript types or PropTypes
 sandpackExample?: string; // JSX string for live preview
 tags: string[]; // ["interactive","form","layout",...]
 source?: string; // raw source string (populated lazily)
}

export interface Repo {
 id: string; // "material-ui"
 name: string; // "MUI / Material UI"
 githubUrl: string; // "https://github.com/mui/material-ui"
 localPath: string; // "/home/christopher/.openclaw/workspace/ui-libraries/repos/material-ui"
 category: RepoCategory;
 description: string;
 version: string; // from package.json
 stars?: number;
 components: Component[];
 orbPosition: [number, number, number]; // [x, y, z] in 3D space
 orbSize: number; // 0.7 – 1.3
 sandpackConfig: SandpackConfig;
 lastDiscovered: string; // ISO timestamp
 addedAt: string; // ISO timestamp
}

export type RepoCategory =
 | "primitives" // Radix, Headless UI, Ariakit
 | "styled-system" // MUI, Chakra, Mantine
 | "enterprise" // Ant Design, Fluent UI, Carbon
 | "framework" // Refine, React itself
 | "utility" // Zustand, TailwindCSS
 | "collections" // grab-bags, lists
 | "other";

export interface SandpackConfig {
 dependencies: Record<string, string>; // npm packages needed in sandbox
 entry: string; // default component to show on open
 cssImports?: string[]; // CDN CSS links for fonts/icons
 customSetup?: object; // passed to Sandpack's customSetup
}

export interface Manifest {
 version: string; // "1.0.0"
 generatedAt: string; // ISO timestamp
 totalRepos: number;
 totalComponents: number;
 repos: Repo[];
 searchIndex: SearchEntry[]; // flattened for fast agent queries
}

export interface SearchEntry {
 repoId: string;
 repoName: string;
 componentId: string;
 componentName: string;
 description: string;
 tags: string[];
 category: RepoCategory;
}
```

---
### 3. Auto-Discovery Script

**File:** `scripts/discover.ts`

This script scans a repo directory and extracts component metadata. Run it on all repos to populate `manifest.json`.

**Discovery logic — implement in this exact order:**

1. Read `package.json` at repo root → extract `name`, `version`, `description`, `exports`, `main`
2. Find component entry points using this priority order:
 - Check `exports` field in package.json for named component exports
 - Check `src/index.ts` / `src/index.tsx`
 - Check `packages/*/src/index.tsx` (monorepo pattern)
 - Glob `src/**/*.tsx` excluding `*.test.*`, `*.stories.*`, `*.spec.*`
 - Glob `components/**/*.tsx` with same exclusions
3. For each component file found:
 - Extract the default export name or named exports
 - Parse TypeScript interface/type props using regex (no full AST required):
 - Match `interface {Name}Props { ... }` blocks
 - Match `type {Name}Props = { ... }` blocks
 - Extract prop names, types, and JSDoc `@param` / `@description` comments
 - Extract file-level JSDoc `/** ... */` as component description
 - If no JSDoc: use first sentence of any inline comment, or generate description as `"{Name} component from {repoName}"`
4. Generate a `sandpackExample` for each component:
 - Simple: `import { ComponentName } from 'package-name'; export default () => <ComponentName />;`
 - If props are required with no defaults: add sensible placeholder values
 - Wrap with `<div style={{ padding: 24, background: '#000', minHeight: 200 }}>` for dark-mode consistency
5. Assign `tags` based on component name and file path:
 - "form" if name contains: Input, Select, Checkbox, Radio, Form, Field, Textarea
 - "interactive" if name contains: Button, Modal, Dialog, Drawer, Popover, Tooltip, Menu
 - "layout" if name contains: Grid, Flex, Stack, Container, Box, Row, Col
 - "display" if name contains: Card, Badge, Avatar, Icon, Image, Text, Heading
 - "navigation" if name contains: Nav, Breadcrumb, Tab, Sidebar, Menu, Link
 - "feedback" if name contains: Alert, Toast, Spinner, Skeleton, Progress, Loading
6. Deduplicate: if the same component name appears in multiple files, keep the one closest to the repo root
7. Cap at 40 components per repo — sort by: named exports in package.json > src/index depth > alphabetical

**Output:** return a `Partial<Repo>` object with `components`, `version`, `description` populated.

---
### 4. Manifest Build Script

**File:** `scripts/build-manifest.ts`

```typescript
// Pseudo-code — implement fully

async function buildManifest() {
 const reposBase = '/home/christopher/.openclaw/workspace/ui-libraries/repos';
 const cloneList =