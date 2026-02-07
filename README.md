# Ivory Tower

A browser-based UML diagram generator that transforms JSON definitions into visual class diagrams. Write your architecture in a declarative format and instantly see it rendered as a navigable, exportable diagram.

## Motivation

Traditional UML tools often feel heavy and cumbersome for quick architectural sketches. Diagram-as-code solutions exist, but many use custom DSLs that require learning new syntax. Ivory Tower takes a different approach: describe your system architecture in plain JSON and get a clean UML diagram in return.

JSON is universal. Developers already know it. It's easy to version control, diff, and generate programmatically. By using JSON as the source format, Ivory Tower integrates naturally into existing workflows - generate diagrams from code analysis tools, store them alongside your codebase, or build them by hand with full editor support.

## Features

- **Live Preview** - See your diagram update as you type
- **JSON Schema Validation** - Catch errors before they become rendering issues
- **Multiple Entity Types** - Classes, interfaces, abstract classes, modules, and type aliases
- **Relationship Support** - Inheritance, implementation, composition, aggregation, dependency, and association
- **Pan & Zoom** - Navigate large diagrams with mouse drag and scroll
- **SVG Export** - Download publication-ready vector graphics
- **Local Persistence** - Your work is saved automatically in browser storage

## Usage

1. Open the application in your browser
2. Edit the JSON in the left panel to define your entities and relationships
3. The diagram renders automatically in the right panel
4. Use mouse drag to pan and scroll to zoom
5. Click the export button to download as SVG

### JSON Structure

```json
{
  "title": "My System",
  "entities": [
    {
      "id": "user",
      "name": "User",
      "type": "class",
      "attributes": [
        { "name": "id", "type": { "name": "string" }, "visibility": "private" },
        { "name": "email", "type": { "name": "string" }, "visibility": "public" }
      ],
      "methods": [
        { "name": "getName", "parameters": [], "returnType": { "name": "string" } }
      ]
    }
  ],
  "relationships": [
    { "id": "r1", "type": "dependency", "sourceId": "user", "targetId": "other", "label": "uses" }
  ]
}
```

### Entity Types

| Type | Description |
|------|-------------|
| `class` | Standard class with attributes and methods |
| `abstract-class` | Abstract class (italic name, can have abstract methods) |
| `interface` | Interface definition |
| `module` | Module with exported functions and types |
| `type` | Type alias definition |

### Relationship Types

| Type | Description | Arrow Style |
|------|-------------|-------------|
| `inheritance` | Class extends another class | Hollow triangle |
| `implementation` | Class implements interface | Hollow triangle, dashed line |
| `composition` | Strong ownership (part dies with whole) | Filled diamond |
| `aggregation` | Weak ownership (part can exist independently) | Hollow diamond |
| `dependency` | Uses temporarily | Open arrow, dashed line |
| `association` | General relationship | Open arrow |

### Visibility Modifiers

- `public` - Shown as `+`
- `private` - Shown as `-`
- `protected` - Shown as `#`

## Use Cases

**Architecture Documentation**
Keep your system architecture documented as code. Store the JSON file in your repository and regenerate diagrams as the system evolves.

**Design Reviews**
Quickly sketch out proposed changes during design discussions. The live preview makes it easy to iterate on ideas.

**Onboarding**
Help new team members understand system structure with clear visual diagrams generated from a single source of truth.

**Code Generation Input**
Use the JSON format as input for code generators. The structured format makes it easy to parse and transform.

**API Documentation**
Document your API's domain model with type-safe definitions that can be validated and rendered.

## Development

### Prerequisites

- Node.js ^24.13.0
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Preview production build
pnpm preview
```

### Tech Stack

- React 19 with React Compiler
- TypeScript (strict mode)
- Vite
- CSS Modules

## Contributing

Contributions are welcome. Here's how to get started:

1. **Fork the repository** and clone it locally

2. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Read CLAUDE.md** for coding conventions and patterns used in this project

4. **Make your changes** following the established patterns:
   - Components go in `src/ui/components/ComponentName/`
   - Use CSS Modules with the two-tier variable system
   - Use named exports, not default exports
   - Add TypeScript types for all props and data

5. **Test your changes**:
   ```bash
   pnpm build && pnpm lint
   ```

6. **Submit a pull request** with a clear description of what you changed and why

### Areas for Contribution

- Additional export formats (PNG, PlantUML, Mermaid)
- Diagram layout algorithms
- Keyboard shortcuts
- Undo/redo support
- JSON schema autocomplete in editor
- Dark/light theme toggle
- Touch device support

## License

MIT
