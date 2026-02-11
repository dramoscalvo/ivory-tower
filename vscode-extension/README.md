# Ivory Tower - VS Code Extension

Visual UML diagram editor with use case support for VS Code.

## Features

- Open `.architecture.json` files in a visual editor
- Edit UML diagrams with a live preview
- Support for entities, relationships, use cases, and actors
- Automatic synchronization between JSON and visual view

## Usage

1. Open any file with the `.architecture.json` extension
2. The file will automatically open in the Ivory Tower editor
3. Edit the JSON or use the visual tools to modify your architecture
4. Changes are automatically saved back to the file

## Development

### Building the Extension

```bash
# Build the web app
pnpm build

# Copy dist to extension
cp -r dist vscode-extension/

# Compile the extension
cd vscode-extension && npm run compile

# Package the extension
cd vscode-extension && npx vsce package
```

### Running in Development

1. Open this folder in VS Code
2. Press F5 to launch the Extension Development Host
3. Open an `.architecture.json` file to test

## File Format

Ivory Tower uses a JSON format for architecture specifications:

```json
{
  "title": "My System",
  "entities": [...],
  "relationships": [...],
  "useCases": [...]
}
```

See the main README for full format documentation.
