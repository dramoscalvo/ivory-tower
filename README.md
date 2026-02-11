# Ivory Tower

A visual specification builder that produces comprehensive, machine-readable project definitions for AI coding tools. Describe your system architecture in JSON — get a live UML diagram, traceability coverage, and exportable specs that AI agents (Claude Code, Cursor, etc.) can consume to build entire projects.

## Quick Start (Docker)

```bash
docker run --rm -p 8080:80 ghcr.io/dramoscalvo/ivory-tower:master
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## What is Ivory Tower?

Traditional UML tools produce diagrams for humans to read. Ivory Tower produces **project specifications** for machines to read. The visual diagram is a verification aid — the real output is a structured document containing your entities, relationships, API endpoints, business rules, and use cases in a format that AI coding assistants can consume directly.

Write your architecture in JSON, see it rendered as an interactive UML diagram, then export as TOON (a compact notation optimized for AI token budgets) or JSON for your AI tools to use as a blueprint.

## Features

**Specification**
- 6 entity types: class, interface, abstract-class, module, type, enum (with values)
- 6 relationship types with optional cardinality (1, 0..1, 1.\*, \*, 0..\*)
- Project metadata (name, description, tech stack, conventions)
- Actors (who interacts with the system)
- Gherkin-style use cases with actor refs, preconditions, and postconditions
- API endpoints (method, path, auth level, request/response bodies with entity refs)
- Business rules (unique, invariant, validation, constraint) tied to entities

**Editing**
- Live preview — diagram updates as you type
- JSON schema validation with inline error messages
- Quick-add forms: + Entity, + Relationship, + Use Case, + Endpoint
- Undo/redo (Ctrl+Z / Ctrl+Shift+Z)
- Prettify JSON (Ctrl+Shift+F)
- Local persistence (auto-saved to browser storage)
- URL sharing (diagram encoded in URL)

**Visualization**
- Interactive canvas with pan and zoom
- Entity search with keyboard navigation (arrow keys + Enter)
- Hover highlighting — dims unrelated entities and relationships
- Fit-to-view (Escape)
- Dark and light themes

**Import / Export**
- Import: JSON, TOON, Mermaid, PlantUML (paste or file upload)
- Export: TOON, JSON, SVG, Mermaid

**Traceability**
- Coverage panel showing entity coverage across use cases, endpoints, rules, and relationships
- Completeness warnings for uncovered entities, unreferenced methods, unlinked endpoints, and orphan entities

## JSON Schema

The specification document has these top-level keys:

| Key | Required | Description |
|---|---|---|
| `title` | Yes | Diagram title |
| `project` | No | Project metadata: name, description, stack, conventions |
| `actors` | No | Who interacts with the system |
| `entities` | Yes | Classes, interfaces, modules, types, abstract-classes, enums |
| `relationships` | Yes | How entities relate to each other |
| `endpoints` | No | API endpoints with method, path, auth, request/response bodies |
| `rules` | No | Business rules tied to entities and fields |
| `useCases` | No | Gherkin-style use cases with scenarios |

### Example

```json
{
  "title": "Task Manager API",
  "project": {
    "name": "task-manager",
    "description": "A REST API for managing tasks and projects",
    "stack": {
      "runtime": "Node.js 24",
      "framework": "Express",
      "database": "PostgreSQL"
    },
    "conventions": {
      "naming": "camelCase for variables, PascalCase for types",
      "errors": "Return { error: string, code: number }"
    }
  },
  "actors": [
    { "id": "user", "name": "User", "description": "Authenticated application user" },
    { "id": "admin", "name": "Admin", "description": "System administrator" }
  ],
  "entities": [
    {
      "id": "task",
      "name": "Task",
      "type": "class",
      "attributes": [
        { "name": "id", "type": { "name": "string" }, "visibility": "private" },
        { "name": "title", "type": { "name": "string" }, "visibility": "public" },
        { "name": "status", "type": { "name": "TaskStatus" }, "visibility": "public" }
      ],
      "methods": [
        { "name": "complete", "parameters": [], "returnType": { "name": "void" } }
      ]
    },
    {
      "id": "task-status",
      "name": "TaskStatus",
      "type": "enum",
      "values": ["PENDING", "IN_PROGRESS", "DONE"]
    },
    {
      "id": "project",
      "name": "Project",
      "type": "class",
      "attributes": [
        { "name": "id", "type": { "name": "string" }, "visibility": "private" },
        { "name": "name", "type": { "name": "string" }, "visibility": "public" }
      ],
      "methods": [
        { "name": "addTask", "parameters": [{ "name": "task", "type": { "name": "Task" } }], "returnType": { "name": "void" } }
      ]
    }
  ],
  "relationships": [
    { "id": "r1", "type": "composition", "sourceId": "project", "targetId": "task", "label": "contains", "sourceCardinality": "1", "targetCardinality": "1..*" },
    { "id": "r2", "type": "dependency", "sourceId": "task", "targetId": "task-status", "label": "uses" }
  ],
  "endpoints": [
    {
      "id": "ep1",
      "method": "POST",
      "path": "/tasks",
      "summary": "Create a new task",
      "auth": "authenticated",
      "requestBody": { "entityRef": "task", "fields": ["title"] },
      "response": { "entityRef": "task", "fields": ["id", "title", "status"] },
      "useCaseRef": "uc1"
    }
  ],
  "rules": [
    { "id": "rule1", "entityRef": "task", "field": "title", "type": "validation", "description": "Title must be 1-200 characters" }
  ],
  "useCases": [
    {
      "id": "uc1",
      "name": "Create Task",
      "entityRef": "task",
      "methodRef": "complete",
      "actorRef": "user",
      "description": "User creates a new task in a project",
      "preconditions": ["User is authenticated", "Project exists"],
      "postconditions": ["Task is created with PENDING status"],
      "scenarios": [
        {
          "name": "Successful creation",
          "steps": [
            { "keyword": "Given", "text": "a user is logged in" },
            { "keyword": "When", "text": "they submit a task title" },
            { "keyword": "Then", "text": "a new task is created with PENDING status" }
          ]
        }
      ]
    }
  ]
}
```

### Entity Types

| Type | Description |
|---|---|
| `class` | Standard class with attributes and methods |
| `abstract-class` | Abstract class (italic name, can have abstract methods) |
| `interface` | Interface definition |
| `module` | Module with exported functions and types |
| `type` | Type alias definition |
| `enum` | Enumeration with a `values: string[]` array |

### Relationship Types

| Type | Arrow Style | Description |
|---|---|---|
| `inheritance` | Hollow triangle | Class extends another class |
| `implementation` | Hollow triangle, dashed line | Class implements interface |
| `composition` | Filled diamond | Strong ownership (part dies with whole) |
| `aggregation` | Hollow diamond | Weak ownership (part can exist independently) |
| `dependency` | Open arrow, dashed line | Uses temporarily |
| `association` | Open arrow | General relationship |

### Visibility Modifiers

- `public` — Shown as `+`
- `private` — Shown as `-`
- `protected` — Shown as `#`

## TOON Format

TOON (Terse Object-Oriented Notation) is a compact, self-documenting text format designed for AI consumption. It minimizes token usage while remaining human-readable. Export your specification as TOON to include in AI prompts, CLAUDE.md files, or agent instructions.

```
# TOON — Terse Object-Oriented Notation
# Compact, self-documenting format for AI-consumable project specs
title: Task Manager API
project{name,description,stack,conventions}: task-manager,"A REST API...",runtime:Node.js 24|framework:Express,naming:camelCase...
entities[3]{id,name,type,description}:
  task,Task,class,""
    attributes[3]{name,type,visibility}: id,string,private | title,string,public | status,TaskStatus,public
    methods[1]{name,params,returnType}: complete,,void
  task-status,TaskStatus,enum,""
    values[3]: PENDING,IN_PROGRESS,DONE
  ...
relationships[2]{id,type,sourceId,targetId,label,sourceCardinality,targetCardinality}:
  r1,composition,project,task,contains,1,1..*
  r2,dependency,task,task-status,uses,,
```

## Running with Docker

### From GitHub Container Registry

```bash
# Latest from master
docker run --rm -p 8080:80 ghcr.io/dramoscalvo/ivory-tower:master

# Specific version
docker run --rm -p 8080:80 ghcr.io/dramoscalvo/ivory-tower:v1.0.0
```

### Build Locally

```bash
# Build the image
pnpm docker:build

# Run it
pnpm docker:run
```

Or with plain Docker commands:

```bash
docker build -t ivory-tower .
docker run --rm -p 8080:80 ivory-tower
```

Then open [http://localhost:8080](http://localhost:8080).

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z / Ctrl+Y | Redo |
| Ctrl+Shift+F | Prettify JSON |
| Ctrl+E | Export diagram |
| Escape | Fit diagram to view |

## Development

### Prerequisites

- Node.js ^24.13.0
- pnpm

### Setup

```bash
pnpm install
pnpm dev        # Dev server with HMR
```

### Commands

```bash
pnpm build           # TypeScript + Vite production build
pnpm lint            # ESLint
pnpm format          # Prettier (write)
pnpm format:check    # Prettier (check only)
pnpm test            # Vitest (unit + integration)
pnpm test:coverage   # Vitest with coverage
pnpm test:e2e        # Playwright end-to-end tests
```

### Tech Stack

- React 19 with React Compiler
- TypeScript (strict mode)
- Vite
- CSS Modules
- Vitest + Playwright

### Architecture

Three bounded contexts with domain-driven structure:

- **`src/diagram/`** — UML diagram models, validation, layout, parsing
- **`src/usecase/`** — Use case models and validation
- **`src/export/`** — TOON formatting, JSON export, SVG export, Mermaid export

UI layer in `src/ui/` with feature-based component directories.

## Contributing

Contributions are welcome.

1. Fork the repository and clone it locally
2. Create a branch for your feature or fix
3. Read `CLAUDE.md` for coding conventions
4. Make your changes following established patterns
5. Run `pnpm build && pnpm lint && pnpm test` to verify
6. Submit a pull request with a clear description

### Areas for Contribution

- PlantUML export (import already supported)
- PNG export
- Diagram layout algorithm improvements
- JSON schema autocomplete in editor
- Touch device support
- Collapsible editor sections (code folding)
- Entity package/namespace grouping

## License

MIT
