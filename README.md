# OpenClaw 3D Component Explorer

A 3D interactive component library browser built with Vite + React + TypeScript + WebGL.

Renders a WebGL space of floating orbs — one per React library repo. Click an orb to open a panel with live sandboxed previews, syntax-highlighted source, and prop tables. Agent-searchable via REST API and flat manifest JSON.

## Quick Start

```bash
cd explorer
npm install
npm run manifest    # build manifest from cloned repos
npm run dev         # starts Vite (3000) + API server (3001)
```

## Architecture

```
3dcomponentexplorer/
├── docs/                    # design specs, coding prompts, architecture
│   ├── CODING-PROMPT.md     # full build spec for coding agents
│   ├── DESIGN-SYSTEM.md     # xAI/Grok design tokens (non-negotiable)
│   ├── MANIFEST-SCHEMA.md   # manifest.json type definitions
│   └── API-SPEC.md          # REST API endpoint reference
├── explorer/                # Vite + React app (the actual product)
│   ├── src/
│   │   ├── scene/           # WebGL 3D orb renderer
│   │   ├── components/      # Panel, Search, HUD, AddRepo
│   │   ├── hooks/           # useManifest, useSearch, useAudio
│   │   ├── api/             # typed fetch client
│   │   ├── types/           # TypeScript interfaces
│   │   └── styles/          # CSS custom properties
│   ├── server/              # Express API server
│   └── scripts/             # discover, build-manifest, add-repo
├── repos/                   # symlink or path ref to cloned UI libs
└── manifest.json            # generated — single source of truth
```

## Design Language

Monochromatic black/white. xAI/Grok aesthetic. No gradients, no glow, no box-shadow. See `docs/DESIGN-SYSTEM.md`.

## Key Features

- **3D Orb Space** — fibonacci-distributed orbs, one per library
- **Live Previews** — Sandpack-powered component sandboxes
- **Source Viewer** — Shiki syntax highlighting
- **Props Inspector** — parsed from TypeScript types
- **Global Search** — Cmd+K fuzzy search across all libraries
- **Add Library** — paste a GitHub URL, auto-clone and discover
- **Agent API** — REST endpoints for LLM context injection
- **Auto-Discovery** — scans repos for components, props, tags

## Repo Data

Libraries are cloned to a sibling directory. See `docs/CODING-PROMPT.md` for the full list and clone workflow.

## License

Private — AgentChrisAI
