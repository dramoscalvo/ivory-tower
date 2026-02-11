# CLAUDE.md

## Product Vision

Ivory Tower produces a **comprehensive, machine-readable project specification** that lives in a repo and is consumed by AI tools (Claude Code, Cursor, etc.) to build entire projects. The visual diagram is a verification/navigation aid for the human author.

- **Editing format**: JSON (single document, collapsible sections in the editor)
- **AI-facing export**: Enhanced TOON (compact, self-documenting) + JSON (standard, for tooling)
- **Target user**: Someone designing a software project who may not be a UML expert

## Project Overview

React 19 + TypeScript + Vite frontend with the React Compiler (babel-plugin-react-compiler) enabled.

## Dependencies

- Always install exact versions (no `^` or `~` prefixes)
- Selection criteria (in priority order): fewest dependencies (preferably zero), most weekly downloads, most recent updates, smallest size
- Prefer a package that does few things greatly over a bigger one that does many things poorly

## Commands

```bash
pnpm dev             # Dev server with HMR
pnpm build           # TypeScript + Vite production build
pnpm lint            # ESLint
pnpm format          # Prettier (write)
pnpm format:check    # Prettier (check only)
pnpm test            # Vitest (unit + integration)
pnpm test:coverage   # Vitest with coverage
pnpm test:e2e        # Playwright end-to-end tests
```

## Architecture

Three bounded contexts, each following domain-driven structure (`domain/`, `application/`, `infrastructure/`):

- **`src/diagram/`** — UML diagram models, validation, layout, parsing
- **`src/usecase/`** — Use case models and validation
- **`src/export/`** — Diagram export (TOON formatting, JSON export, SVG export, Mermaid export, file download)

UI layer:

- **`src/ui/components/`** — Feature-based directories (App, EditorLayout, Toolbar, UmlCanvas, JsonEditor, UseCasePanel, CoveragePanel, etc.)
- **`src/ui/context/`** — Service injection via `ServiceContext`, accessed with `useServices()` hook
- **`src/ui/hooks/`** — Shared hooks: `useHistory`, `useTheme`, `useUrlSharing`, `useKeyboardShortcuts`

Entry point: `src/main.tsx` renders `<App />` into `#root`.

## JSON Schema

The specification document has these top-level keys:

| Key | Required | Description |
|---|---|---|
| `title` | Yes | Diagram title |
| `project` | No | Project metadata: `name`, `description`, `stack` (key-value), `conventions` (key-value) |
| `actors` | No | Array of `{ id, name, description? }` — who interacts with the system |
| `entities` | Yes | Array of entities: classes, interfaces, modules, types, abstract-classes, **enums** |
| `relationships` | Yes | Array of relationships between entities (inheritance, implementation, composition, etc.) |
| `endpoints` | No | Array of API endpoints: `{ id, method, path, summary?, requestBody?, response?, auth?, useCaseRef? }` |
| `rules` | No | Array of business rules: `{ id, entityRef, field?, type, description }` |
| `useCases` | No | Array of Gherkin-style use cases with `entityRef`, `methodRef?`, `actorRef?`, `preconditions?`, `postconditions?`, and `scenarios` |

### Entity types

`class`, `interface`, `module`, `type`, `abstract-class`, `enum`

- **Enum entities** have a `values: string[]` field instead of attributes/methods
- All other entity types support `attributes`, `methods`, `functions`, `types`

### Validation rules

- `project.name` required when `project` is present
- Actor ids must be unique; actors need `id` and `name`
- Entity ids must be unique; entities need `id`, `name`, `type`
- Enum entities must have non-empty `values` array with non-empty strings
- Relationship `sourceId`/`targetId` must reference existing entity ids; `sourceCardinality`/`targetCardinality` (if present) must be one of `1`, `0..1`, `1..*`, `*`, `0..*`
- Use case `entityRef` must reference an existing entity; `methodRef` must exist on that entity
- Use case `actorRef` (if present and actors are defined) must reference an existing actor id
- Preconditions/postconditions must be arrays of non-empty strings
- Endpoint `method` must be GET/POST/PUT/PATCH/DELETE; `auth` must be public/authenticated/admin
- Endpoint `requestBody`/`response` `entityRef` must reference existing entity; `fields` must exist on that entity
- Endpoint `useCaseRef` must reference an existing use case id
- Rule `type` must be unique/invariant/validation/constraint; `entityRef` must reference existing entity
- Rule `field` (if present) must exist on the referenced entity

### Completeness warnings (non-blocking)

`CompletenessValidator` produces warnings (not errors) for coverage gaps:

- **uncovered-entity**: Entity has no use cases referencing it
- **unreferenced-method**: Entity method not referenced by any use case `methodRef`
- **usecase-no-endpoint**: Use case has no endpoint referencing it via `useCaseRef`
- **endpoint-no-usecase**: Endpoint has no `useCaseRef`
- **orphan-entity**: Entity has no relationships (when >1 entity exists)

## Component Patterns

### File Organization

- Each component: `ComponentName/ComponentName.tsx` + `ComponentName.module.css`
- Sub-components in nested directories (e.g., `UmlCanvas/EntityBox/`)
- Custom hooks alongside components (e.g., `Toolbar/useExport.ts`)
- Quick-add form modals in `Toolbar/` (AddEntityModal, AddRelationshipModal, AddUseCaseModal, AddEndpointModal) — shared CSS in `QuickAddModal.module.css`
- No barrel exports. No default exports. Named exports only.

### Component Structure

```typescript
// Props interface with Props suffix
interface ComponentNameProps { ... }

// Named export
export function ComponentName({ value }: ComponentNameProps) { ... }

// forwardRef when exposing ref handle
export const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  function Modal({ onClose }, ref) { ... }
);
```

### Import Order

1. React imports
2. Component imports
3. Type imports (with `type` keyword)
4. CSS module import (last)

## CSS Patterns

- All styles use CSS Modules (`.module.css`), accessed as `className={styles.name}`
- camelCase class names
- **Always use CSS variables from `src/index.css`** — never hardcode colors
- Two-tier variable system: Tier 1 (base colors/spacing) and Tier 2 (semantic usage) — see `src/index.css`
- Light theme supported via `[data-theme="light"]` overrides in `src/index.css`
- Prefer `rem`/`em` over `px` for accessibility. Use `px` only for borders/shadows.

## React Rules

- **Never use `useEffect` unless strictly necessary** (genuine side-effects: URL sync, localStorage, DOM APIs). Prefer `useMemo` for derived state.
- React Compiler is enabled — do NOT manually add `useCallback`/`useMemo` for optimization. The compiler handles it. Only use `useMemo` for derived-state patterns replacing `useEffect` + `useState`.
- `useState` with lazy initialization: `useState(() => expensiveComputation())`
- `useRef` for DOM elements: `useRef<HTMLDialogElement>(null)`

## Conventions

- Constants: `SCREAMING_SNAKE_CASE` at module level
- Accessibility: `aria-label` on icon buttons, `aria-hidden="true"` on decorative SVGs, `type="button"` on non-submit buttons
- Null-safe: `value ?? fallback`, guard clauses for early returns

## Tests

- Prioritize unit tests over integration/e2e; test functionality, not implementation
- Always use the Object Mother pattern for creating test/mock data (see `tests/helpers/`)
- Mock dependencies to isolate the unit under test
- Prefer mocking over other isolation methods
- Test files mirror source structure: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- Integration tests use `renderWithProviders` from `tests/helpers/renderWithProviders.tsx`
- Mock services via `createMockServices` from `tests/helpers/mockServices.ts`

## TOON Format

TOON is a compact, self-documenting text format for AI consumption. Exported via `ToonFormatter`, parsed back via `ToonParser`. Structure:

```
# TOON — Terse Object-Oriented Notation (self-documenting header)
title: ...
project{name,description,stack,conventions}: ...
actors[N]{id,name,description}: ...
entities[N]{id,name,type,description}: ...
  values[N]: ...              (enum entities only)
  attributes[N]{...}: ...
  methods[N]{...}: ...
relationships[N]{id,type,sourceId,targetId,label,sourceCardinality,targetCardinality}: ...
endpoints[N]{id,method,path,summary,auth,useCaseRef}: ...
  requestBody{entityRef,fields}: ...
  response{entityRef,fields}: ...
rules[N]{id,entityRef,field,type,description}: ...
useCases[N]{id,name,entityRef,methodRef,description,actorRef}: ...
  preconditions[N]: ...
  postconditions[N]: ...
  scenarios[N]{name}: ...
```

Import supports: JSON, TOON, Mermaid, PlantUML (paste or file upload).

## Canvas Features

- **Entity search**: Search overlay (magnifying glass icon) filters entities by name, keyboard navigable (arrow keys + Enter), zooms/pans to selected entity with 2-second highlight pulse
- **Hover highlighting**: Hovering an entity dims all unrelated entities and relationships (0.2s opacity transition)
- **Cardinality labels**: Relationships display optional multiplicity labels (`1`, `0..1`, `1..*`, `*`, `0..*`) near their endpoints
- **SVG export**: `SvgExporter` clones the SVG DOM, inlines computed styles, and serializes for download
- **Mermaid export**: `MermaidExporter` generates Mermaid `classDiagram` syntax from the JSON model (entity stereotypes, relationship arrows, cardinality)

## Quick-Add Forms

Toolbar provides `+ Entity`, `+ Relationship`, `+ Use Case`, `+ Endpoint` buttons that open modal dialogs. Each form generates a JSON snippet that is appended to the appropriate array in the editor. JSON remains the source of truth — forms are convenience helpers.

- `+ Relationship` disabled when < 2 entities exist
- `+ Use Case` disabled when no entities exist
- All modals use `forwardRef<HTMLDialogElement>` + native `<dialog>` element
- Handlers in `App.tsx`: parse current JSON → append item → re-stringify
