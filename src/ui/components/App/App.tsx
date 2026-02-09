import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { EditorLayout } from '../EditorLayout/EditorLayout';
import { JsonEditor } from '../JsonEditor/JsonEditor';
import { UmlCanvas } from '../UmlCanvas/UmlCanvas';
import { UseCasePanel } from '../UseCasePanel';
import { Toolbar } from '../Toolbar/Toolbar';
import { useServices } from '../../context/useServices';
import { useTheme } from '../../hooks/useTheme';
import { useHistory } from '../../hooks/useHistory';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useUrlSharing } from '../../hooks/useUrlSharing';
import { findEntityLine } from '../../../diagram/domain/services/jsonLineMapper';
import { buildPathLineMap } from '../../../diagram/domain/services/errorLineMapper';
import type { DiagramLayout } from '../../../diagram/domain/services/LayoutCalculator';
import type { ValidationError } from '../../../diagram/domain/services/DiagramValidator';
import type { FontSize, JsonEditorHandle } from '../JsonEditor/JsonEditor';
import type { UmlCanvasHandle } from '../UmlCanvas/UmlCanvas';
import styles from './App.module.css';

const EXAMPLE_ARCHITECTURE_JSON = `{
  "title": "Example System",
  "entities": [
    {
      "id": "user",
      "name": "User",
      "type": "class",
      "description": "Represents an authenticated user in the system. Handles user profile data and authentication state.",
      "attributes": [
        { "name": "id", "type": { "name": "string" }, "visibility": "private" },
        { "name": "email", "type": { "name": "string" }, "visibility": "public" }
      ],
      "methods": [
        { "name": "getName", "parameters": [], "returnType": { "name": "string" } },
        { "name": "updateEmail", "parameters": [{ "name": "newEmail", "type": { "name": "string" } }], "returnType": { "name": "void" } }
      ]
    },
    {
      "id": "utils",
      "name": "UserUtils",
      "type": "module",
      "description": "Utility functions for user validation and transformation. Pure functions with no side effects.",
      "functions": [
        { "name": "validate", "parameters": [{ "name": "u", "type": { "name": "User" } }], "returnType": { "name": "boolean" }, "isExported": true },
        { "name": "normalize", "parameters": [{ "name": "email", "type": { "name": "string" } }], "returnType": { "name": "string" }, "isExported": true }
      ]
    },
    {
      "id": "iauth",
      "name": "IAuthenticatable",
      "type": "interface",
      "description": "Interface for entities that can be authenticated.",
      "methods": [
        { "name": "authenticate", "parameters": [{ "name": "token", "type": { "name": "string" } }], "returnType": { "name": "boolean" } }
      ]
    }
  ],
  "relationships": [
    { "id": "r1", "type": "dependency", "sourceId": "user", "targetId": "utils", "label": "uses" },
    { "id": "r2", "type": "implementation", "sourceId": "user", "targetId": "iauth" }
  ]
}`;

const EXAMPLE_USECASES_JSON = `[
  {
    "id": "uc-email",
    "name": "Email Management",
    "entityRef": "user",
    "methodRef": "updateEmail",
    "scenarios": [
      {
        "name": "Update email successfully",
        "steps": [
          { "keyword": "Given", "text": "a user with email \\"old@example.com\\"" },
          { "keyword": "When", "text": "updateEmail is called with \\"new@example.com\\"" },
          { "keyword": "Then", "text": "the user email should be \\"new@example.com\\"" }
        ]
      },
      {
        "name": "Reject invalid email",
        "steps": [
          { "keyword": "Given", "text": "a user with email \\"old@example.com\\"" },
          { "keyword": "When", "text": "updateEmail is called with \\"invalid\\"" },
          { "keyword": "Then", "text": "a validation error should be thrown" },
          { "keyword": "And", "text": "the email should remain unchanged" }
        ]
      }
    ]
  },
  {
    "id": "uc-auth",
    "name": "User Authentication",
    "entityRef": "iauth",
    "methodRef": "authenticate",
    "description": "Tests for the user authentication flow",
    "scenarios": [
      {
        "name": "Authenticate with valid token",
        "steps": [
          { "keyword": "Given", "text": "a valid authentication token" },
          { "keyword": "When", "text": "authenticate is called with the token" },
          { "keyword": "Then", "text": "the method should return true" }
        ]
      },
      {
        "name": "Reject invalid token",
        "steps": [
          { "keyword": "Given", "text": "an invalid authentication token" },
          { "keyword": "When", "text": "authenticate is called with the token" },
          { "keyword": "Then", "text": "the method should return false" },
          { "keyword": "But", "text": "no exception should be thrown" }
        ]
      }
    ]
  }
]`;

const ARCH_STORAGE_KEY = 'uml-architecture-json';
const USECASES_STORAGE_KEY = 'uml-usecases-json';
const FONT_SIZE_KEY = 'editor-font-size';

const FONT_SIZES: FontSize[] = ['xs', 'sm', 'base', 'md', 'lg'];

function isValidFontSize(value: string | null): value is FontSize {
  return value !== null && FONT_SIZES.includes(value as FontSize);
}

export function App() {
  const { diagramService } = useServices();
  const { theme, toggleTheme } = useTheme();

  // Editor refs
  const archEditorRef = useRef<JsonEditorHandle>(null);
  const ucEditorRef = useRef<JsonEditorHandle>(null);
  const canvasRef = useRef<UmlCanvasHandle>(null);

  // History-backed JSON states
  const archHistory = useHistory(
    localStorage.getItem(ARCH_STORAGE_KEY) ?? EXAMPLE_ARCHITECTURE_JSON
  );
  const ucHistory = useHistory(
    localStorage.getItem(USECASES_STORAGE_KEY) ?? EXAMPLE_USECASES_JSON
  );

  const architectureJson = archHistory.value;
  const useCasesJson = ucHistory.value;

  // Font size state
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    return isValidFontSize(stored) ? stored : 'base';
  });

  const [activeTab, setActiveTab] = useState('architecture');

  // URL sharing
  const { share, shareStatus } = useUrlSharing();

  // Load from URL hash on mount (genuine side-effect: reading external URL state)
  const didLoadHashRef = useRef(false);
  useEffect(() => {
    if (didLoadHashRef.current) return;
    didLoadHashRef.current = true;

    const hash = window.location.hash.slice(1);
    if (hash) {
      import('../../../diagram/infrastructure/urlCodec').then(async ({ decodeFromUrl }) => {
        try {
          const decoded = await decodeFromUrl(hash);
          const data = JSON.parse(decoded);
          if (data.arch) {
            archHistory.setValue(data.arch, true);
            localStorage.setItem(ARCH_STORAGE_KEY, data.arch);
          }
          if (data.uc) {
            ucHistory.setValue(data.uc, true);
            localStorage.setItem(USECASES_STORAGE_KEY, data.uc);
          }
          window.history.replaceState(null, '', window.location.pathname);
        } catch {
          // Invalid hash, ignore
        }
      });
    }
  });

  // Derive parse errors from JSON strings
  const archParseError = useMemo(() => {
    try {
      JSON.parse(architectureJson);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Invalid JSON';
    }
  }, [architectureJson]);

  const useCasesParseError = useMemo(() => {
    try {
      JSON.parse(useCasesJson);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Invalid JSON';
    }
  }, [useCasesJson]);

  // Merge JSON and process diagram — all derived state
  const { layout, mergedJson, entities, useCases, archValidationErrors, useCasesValidationErrors } = useMemo(() => {
    const empty = {
      layout: null as DiagramLayout | null,
      mergedJson: null as string | null,
      entities: [] as DiagramLayout['diagram']['entities'],
      useCases: [] as NonNullable<DiagramLayout['diagram']['useCases']>,
      archValidationErrors: [] as ValidationError[],
      useCasesValidationErrors: [] as ValidationError[],
    };

    if (archParseError || useCasesParseError) return empty;

    let mergedJsonStr: string;
    try {
      const arch = JSON.parse(architectureJson);
      const uc = JSON.parse(useCasesJson);
      mergedJsonStr = JSON.stringify({ ...arch, useCases: uc }, null, 2);
    } catch {
      return empty;
    }

    const result = diagramService.processDiagram(mergedJsonStr);
    if (result.success) {
      return {
        layout: result.layout,
        mergedJson: mergedJsonStr,
        entities: result.layout.diagram.entities,
        useCases: result.layout.diagram.useCases ?? [],
        archValidationErrors: [],
        useCasesValidationErrors: [],
      };
    }

    const archErrors = (result.validationErrors ?? []).filter(
      e => !e.path.startsWith('useCases')
    );
    const ucErrors = (result.validationErrors ?? []).filter(
      e => e.path.startsWith('useCases')
    );

    return {
      ...empty,
      mergedJson: mergedJsonStr,
      archValidationErrors: archErrors,
      useCasesValidationErrors: ucErrors,
    };
  }, [architectureJson, useCasesJson, archParseError, useCasesParseError, diagramService]);

  const handleArchitectureJsonChange = useCallback((newJson: string, immediate?: boolean) => {
    archHistory.setValue(newJson, immediate);
    localStorage.setItem(ARCH_STORAGE_KEY, newJson);
  }, [archHistory]);

  const handleUseCasesJsonChange = useCallback((newJson: string, immediate?: boolean) => {
    ucHistory.setValue(newJson, immediate);
    localStorage.setItem(USECASES_STORAGE_KEY, newJson);
  }, [ucHistory]);

  const handleArchEditorChange = useCallback((newJson: string) => {
    handleArchitectureJsonChange(newJson);
  }, [handleArchitectureJsonChange]);

  const handleUcEditorChange = useCallback((newJson: string) => {
    handleUseCasesJsonChange(newJson);
  }, [handleUseCasesJsonChange]);

  const handleFontSizeChange = (newSize: FontSize) => {
    setFontSize(newSize);
    localStorage.setItem(FONT_SIZE_KEY, newSize);
  };

  const handleLoadExample = () => {
    handleArchitectureJsonChange(EXAMPLE_ARCHITECTURE_JSON, true);
    handleUseCasesJsonChange(EXAMPLE_USECASES_JSON, true);
  };

  // Import handler (from Mermaid/PlantUML)
  const handleImport = useCallback((json: string) => {
    handleArchitectureJsonChange(json, true);
  }, [handleArchitectureJsonChange]);

  // Entity click → scroll to line in editor
  const handleEntityClick = useCallback((entityId: string) => {
    const line = findEntityLine(architectureJson, entityId);
    if (line !== null) {
      setActiveTab('architecture');
      setTimeout(() => archEditorRef.current?.scrollToLine(line), 50);
    }
  }, [architectureJson]);

  // Error line highlighting
  const archHighlightedLines = useMemo(() => {
    if (archParseError) {
      // Try to extract line from parse error
      const match = archParseError.match(/position\s+(\d+)/i);
      if (match) {
        const offset = parseInt(match[1], 10);
        const lineNum = architectureJson.substring(0, offset).split('\n').length;
        return [lineNum];
      }
      return [1];
    }
    if (archValidationErrors.length > 0) {
      const pathLineMap = buildPathLineMap(architectureJson);
      const lines: number[] = [];
      for (const error of archValidationErrors) {
        const line = pathLineMap.get(error.path);
        if (line !== null && line !== undefined) {
          lines.push(line);
        }
      }
      return lines.length > 0 ? lines : undefined;
    }
    return undefined;
  }, [archParseError, archValidationErrors, architectureJson]);

  const ucHighlightedLines = useMemo(() => {
    if (useCasesParseError) {
      return [1];
    }
    if (useCasesValidationErrors.length > 0) {
      const pathLineMap = buildPathLineMap(useCasesJson);
      const lines: number[] = [];
      for (const error of useCasesValidationErrors) {
        // Strip 'useCases' prefix for the UC editor
        const path = error.path.replace(/^useCases\.?/, '');
        const line = pathLineMap.get(path);
        if (line !== null && line !== undefined) {
          lines.push(line);
        }
      }
      return lines.length > 0 ? lines : undefined;
    }
    return undefined;
  }, [useCasesParseError, useCasesValidationErrors, useCasesJson]);

  // Error click → scroll to error line
  const handleArchErrorClick = useCallback((line: number) => {
    if (line > 0) {
      archEditorRef.current?.scrollToLine(line);
    }
  }, []);

  const handleUcErrorClick = useCallback((line: number) => {
    if (line > 0) {
      ucEditorRef.current?.scrollToLine(line);
    }
  }, []);

  // Share handler
  const handleShare = useCallback(() => {
    share(architectureJson, useCasesJson);
  }, [share, architectureJson, useCasesJson]);

  // Undo/redo for active editor
  const handleUndo = useCallback(() => {
    if (activeTab === 'architecture') {
      archHistory.undo();
    } else {
      ucHistory.undo();
    }
  }, [activeTab, archHistory, ucHistory]);

  const handleRedo = useCallback(() => {
    if (activeTab === 'architecture') {
      archHistory.redo();
    } else {
      ucHistory.redo();
    }
  }, [activeTab, archHistory, ucHistory]);

  const handlePrettify = useCallback(() => {
    if (activeTab === 'architecture') {
      archEditorRef.current?.prettify();
    } else {
      ucEditorRef.current?.prettify();
    }
  }, [activeTab]);

  const handleExportShortcut = useCallback(() => {
    if (layout) {
      const { exportService } = diagramService as unknown as { exportService: never };
      // The export is handled by the toolbar's useExport hook
      // We can't easily trigger it from here, so we'll skip this shortcut for now
      void exportService;
    }
  }, [layout, diagramService]);

  const handleFitToView = useCallback(() => {
    canvasRef.current?.fitToView();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onPrettify: handlePrettify,
    onExport: handleExportShortcut,
    onFitToView: handleFitToView,
  });

  return (
    <div className={styles.app}>
      <EditorLayout
        toolbar={
          <Toolbar
            json={mergedJson ?? ''}
            hasValidDiagram={layout !== null}
            onLoadExample={handleLoadExample}
            theme={theme}
            onToggleTheme={toggleTheme}
            onShare={handleShare}
            shareStatus={shareStatus}
            onImport={handleImport}
          />
        }
        architectureEditor={
          <JsonEditor
            ref={archEditorRef}
            value={architectureJson}
            onChange={handleArchEditorChange}
            parseError={archParseError}
            validationErrors={archValidationErrors}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
            canUndo={archHistory.canUndo}
            canRedo={archHistory.canRedo}
            onUndo={archHistory.undo}
            onRedo={archHistory.redo}
            highlightedLines={archHighlightedLines}
            onErrorClick={handleArchErrorClick}
          />
        }
        useCasesEditor={
          <JsonEditor
            ref={ucEditorRef}
            value={useCasesJson}
            onChange={handleUcEditorChange}
            parseError={useCasesParseError}
            validationErrors={useCasesValidationErrors}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
            canUndo={ucHistory.canUndo}
            canRedo={ucHistory.canRedo}
            onUndo={ucHistory.undo}
            onRedo={ucHistory.redo}
            highlightedLines={ucHighlightedLines}
            onErrorClick={handleUcErrorClick}
          />
        }
        canvas={
          <UmlCanvas
            ref={canvasRef}
            layout={layout}
            onEntityClick={handleEntityClick}
          />
        }
        useCasePanel={<UseCasePanel useCases={useCases} entities={entities} />}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
