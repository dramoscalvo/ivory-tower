# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React 19 + TypeScript + Vite frontend application with the React Compiler enabled for automatic component optimization.

## Development Commands

```bash
pnpm dev       # Start dev server with HMR
pnpm build     # TypeScript compilation + Vite production build
pnpm lint      # Run ESLint
pnpm preview   # Preview production build
```

## Architecture

- **Entry point:** `src/main.tsx` renders `<App />` into `#root` in `index.html`
- **Build tool:** Vite with `@vitejs/plugin-react` and Babel React Compiler
- **Package manager:** pnpm
- **Node version:** ^24.13.0

## TypeScript Configuration

- Strict mode enabled
- ES2022 target with ESNext modules
- Three configs: `tsconfig.json` (references), `tsconfig.app.json` (src/), `tsconfig.node.json` (build tools)

## Linting

ESLint flat config (`eslint.config.js`) with:
- typescript-eslint recommended rules
- React Hooks rules
- React Refresh rules
- Targets `**/*.{ts,tsx}`, ignores `dist/`

## Component Patterns

### File Organization
- Components in `src/ui/components/` with feature-based directories
- Each component: `ComponentName/ComponentName.tsx` + `ComponentName.module.css`
- Sub-components in nested directories (e.g., `UmlCanvas/EntityBox/`)
- Custom hooks alongside components (e.g., `Toolbar/useExport.ts`)
- Barrel exports in `index.ts` files

### Component Structure
```typescript
// Named exports only (no default exports)
export function ComponentName() { ... }

// Props interface with Props suffix
interface ComponentNameProps {
  value: string;
  onChange: (value: string) => void;
}

// forwardRef for components needing ref access
export const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  function Modal({ onClose }, ref) { ... }
);
```

### Import Order
1. React imports
2. Component imports
3. Type imports (with `type` keyword)
4. CSS module import (last)

```typescript
import { useState, useRef } from 'react';
import { ChildComponent } from './ChildComponent';
import type { SomeType } from '../../../domain/types';
import styles from './ComponentName.module.css';
```

## CSS Patterns

### CSS Modules
- All styles use `.module.css` extension
- Import as: `import styles from './Component.module.css'`
- Access as: `className={styles.className}`
- camelCase class names: `.editorHeader`, `.prettifyButton`

### Units
- **Prefer relative units** (`rem`, `em`) over fixed pixels for accessibility
- `rem` scales with user font preferences (1rem = 16px default)
- Use `px` only for borders, shadows, or intentionally fixed sizes
- Common conversions: 4px = 0.25rem, 8px = 0.5rem, 16px = 1rem, 32px = 2rem

### CSS Variables (Two-Tier System)

**Always use CSS variables from `src/index.css` - never hardcode colors.**

**Tier 1 - Base Definitions:**
```css
/* Colors */
--midnight, --navy, --ocean, --abyss     /* Dark backgrounds */
--azure, --emerald, --violet, --amber    /* Accent colors */
--ivory, --smoke, --silver, --gray       /* Light/neutral */

/* Spacing */
--space-xs (4px), --space-sm (8px), --space-md (12px), --space-lg (16px)

/* Font sizes */
--font-xs through --font-xl

/* Other */
--transition-fast (0.15s)
```

**Tier 2 - Semantic Usage:**
```css
/* Backgrounds */
--bg-app, --bg-toolbar, --bg-canvas, --bg-input, --bg-button, --bg-button-hover

/* Text */
--text-primary, --text-secondary, --text-code, --text-error

/* Borders */
--border-primary, --border-error

/* Component spacing */
--toolbar-padding-y, --toolbar-padding-x, --toolbar-gap
--button-padding-y, --button-padding-x
```

### CSS Example
```css
.button {
  padding: var(--button-padding-y) var(--button-padding-x);
  background: var(--bg-button);
  color: var(--text-primary);
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.button:hover {
  background: var(--bg-button-hover);
}
```

## React Patterns

### Hooks
- `useState` with lazy initialization: `useState(() => expensiveComputation())`
- `useRef` for DOM elements: `useRef<HTMLDialogElement>(null)`
- `useCallback` for memoized handlers
- Custom hooks for shared logic: `useServices()`, `useExport()`

### Context
- Service injection via `ServiceContext`
- Access with `useServices()` hook
- Services instantiated in `main.tsx`

### Event Handling
- Inline handlers: `onClick={handleClick}`
- Backdrop click detection: `if (e.target === e.currentTarget)`
- Native dialog methods: `dialogRef.current?.showModal()`

### Modal/Dialog Pattern
```typescript
// Parent controls dialog via ref
const dialogRef = useRef<HTMLDialogElement>(null);
const open = () => dialogRef.current?.showModal();
const close = () => dialogRef.current?.close();

// Dialog component uses forwardRef
<dialog ref={ref} onClick={handleBackdropClick} onClose={onClose}>
```

## Conventions

### Constants
- SCREAMING_SNAKE_CASE: `const STORAGE_KEY = 'uml-diagram-json'`
- Defined at module level before component

### Accessibility
- `aria-label` on icon buttons
- `aria-hidden="true"` on decorative SVGs
- `type="button"` on non-submit buttons

### Error Handling
- Null-safe patterns: `value ?? fallback`
- Guard clauses for early returns
- Validation errors displayed in dedicated components

## Notes

- React Compiler is enabled via Babel plugin - components are automatically optimized
- No test framework configured yet
