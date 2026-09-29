# Taleway

![Status](https://img.shields.io/badge/status-PoC-blueviolet)
![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/typescript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-4-06B6D4?logo=tailwindcss&logoColor=white)

**Taleway** is a proof of concept for a platform to create and read **interactive novels** — a node-based **studio** where authors design branching narratives, and a **reader** to experience them.

> ✅ **PoC scope — done:** the core concept works end-to-end: the visual studio (graph editor, variables, conditions, triggers) and the reader.
> 🔜 **Not yet included:** story customization and the library system (shelves, purchases, browsing).

## Tech Stack

| Domain       | Technology                                  |
| ------------ | ------------------------------------------- |
| Framework    | Next.js 16 (App Router, React 19)           |
| Language     | TypeScript 5                                |
| Styling      | Tailwind CSS 4 + Iconify                    |
| Graph editor | React Flow (`@xyflow/react`)                |
| Drag & drop  | `@dnd-kit/dom` + `@dnd-kit/react`           |
| Database     | SQLite (`better-sqlite3`) + Drizzle ORM     |
| Quality      | ESLint (eslint-config-next)                 |
| Deploy       | Vercel                                      |
| Package Mgr  | pnpm 11                                     |

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 11 (`corepack enable`)

## Installation

```bash
pnpm install
pnpm db:push   # create/update the local SQLite database (taleway.db)
pnpm dev
```

Then open http://localhost:3000 and head to `/studio` to create your first story.

## Scripts

| Command             | Description                                         |
| ------------------- | --------------------------------------------------- |
| `pnpm dev`          | Start the dev server (Next.js)                      |
| `pnpm build`        | Build the application for production                |
| `pnpm start`        | Start the production server                         |
| `pnpm preview`      | Deploy a preview to Vercel                          |
| `pnpm deploy`       | Deploy to production (Vercel)                       |
| `pnpm lint`         | Lint the codebase (ESLint)                          |
| `pnpm db:generate`  | Generate SQL migrations from the Drizzle schema     |
| `pnpm db:push`      | Push the schema directly to the SQLite database     |
| `pnpm db:studio`    | Open Drizzle Studio (database GUI)                  |

## Architecture

```
src/
├── app/                     # Next.js App Router
│   ├── page.tsx             # Landing page
│   ├── studio/              # Story dashboard (list & create)
│   │   └── [id]/            # Node-based graph editor
│   │       └── debug/        # Debug reader (playtest)
│   └── api/stories/         # REST endpoints (create, read, save)
├── components/
│   ├── nodes/               # React Flow node types: Start, Page, End
│   ├── ContentPanel.tsx     # Page content editor (paragraph, image, sound)
│   ├── ConditionsEditor.tsx # Condition groups editor
│   ├── TriggersPanel.tsx    # Triggers editor
│   ├── VariablePanel.tsx    # Story variables editor
│   └── SortableContentItem  # Drag & drop content reordering
├── composables/             # React hooks: flow, story data, reader, save
├── lib/
│   ├── db.ts                # better-sqlite3 + Drizzle (WAL mode)
│   └── schema.ts            # `stories` table (graph stored as JSON)
└── types/                   # Story domain types (nodes, edges, variables…)
```

### How It Works

- **Studio** — stories are authored as directed graphs with React Flow: `Start`, `Page` and `End` nodes. Edges represent the reader's choices.
- **Pages** — each page holds ordered content blocks: paragraphs, images and sounds (loop, autoplay on page entry).
- **Variables** — typed story variables (`number`, `boolean`, `text`), optionally visible to the reader.
- **Conditional choices** — edges carry condition groups (`==`, `!=`, `<`, `<=`, `>`, `>=`) evaluated at runtime, and assignments (`=`, `+=`, `-=`) applied when the reader picks them.
- **Triggers** — when condition groups are met, triggers redirect to another page or assign variables.
- **Reader** — the debug reader at `/studio/[id]/debug` evaluates conditions and walks the graph, allowing the author to playtest without leaving the studio.
- **Persistence** — the whole graph (nodes, edges, variables, triggers) is stored as JSON in a single SQLite table, with a REST API (`GET`/`PUT`) for loading and saving.

## Roadmap

- [ ] Debug reader improvements: variable editing, jump-to-page, end labels, inventory companion
- [ ] PoC validation
- [ ] Style migration & UI polish, landing page
- [ ] Story customization (themes, styling)
- [ ] Library system: shelves, purchases, browse page
- [ ] Authentication (Supabase) and user profiles
- [ ] Client-side reader & PWA
- [ ] Localization, first interactive novels (romance, horror, investigation)

Detailed task list in [TODO.md](./TODO.md) (in french)

## License

This project is licensed under the [MIT License](LICENSE).
