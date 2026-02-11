import { useState, useEffect, useRef } from 'react';
import { EditorLayout } from '../EditorLayout/EditorLayout';
import { JsonEditor } from '../JsonEditor/JsonEditor';
import { UmlCanvas } from '../UmlCanvas/UmlCanvas';
import { UseCasePanel } from '../UseCasePanel';
import { CoveragePanel } from '../CoveragePanel/CoveragePanel';
import { Toolbar } from '../Toolbar/Toolbar';
import { useServices } from '../../context/useServices';
import { useTheme } from '../../hooks/useTheme';
import { useHistory } from '../../hooks/useHistory';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useUrlSharing } from '../../hooks/useUrlSharing';
import { exportSvgFromElement, getSvgFilename } from '../../../export/domain/services/SvgExporter';
import { downloadFile } from '../../../export/infrastructure/FileDownloader';
import { findEntityLine } from '../../../diagram/domain/services/jsonLineMapper';
import { buildPathLineMap } from '../../../diagram/domain/services/errorLineMapper';
import { validateCompleteness } from '../../../diagram/domain/services/CompletenessValidator';
import type { DiagramLayout } from '../../../diagram/domain/services/LayoutCalculator';
import type { ValidationError } from '../../../diagram/domain/services/DiagramValidator';
import type { CompletenessWarning } from '../../../diagram/domain/services/CompletenessValidator';
import type { Actor } from '../../../diagram/domain/models/Actor';
import type { FontSize, JsonEditorHandle } from '../JsonEditor/JsonEditor';
import type { UmlCanvasHandle } from '../UmlCanvas/UmlCanvas';
import styles from './App.module.css';

const EXAMPLE_ARCHITECTURE_JSON = `{
  "title": "Example System",
  "project": {
    "name": "Task Manager",
    "description": "A collaborative task management system for teams",
    "stack": {
      "language": "TypeScript",
      "framework": "Express",
      "database": "PostgreSQL",
      "testing": "Vitest"
    },
    "conventions": {
      "architecture": "hexagonal",
      "api": "REST"
    }
  },
  "actors": [
    { "id": "end-user", "name": "End User", "description": "Registered user of the platform" },
    { "id": "admin", "name": "Admin", "description": "System administrator" }
  ],
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
      "id": "user-role",
      "name": "UserRole",
      "type": "enum",
      "description": "Available roles for users in the system.",
      "values": ["ADMIN", "MEMBER", "VIEWER", "GUEST"]
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
    { "id": "r2", "type": "implementation", "sourceId": "user", "targetId": "iauth" },
    { "id": "r3", "type": "association", "sourceId": "user", "targetId": "user-role", "label": "has" }
  ]
}`;

const EXAMPLE_USECASES_JSON = `[
  {
    "id": "uc-email",
    "name": "Email Management",
    "entityRef": "user",
    "methodRef": "updateEmail",
    "actorRef": "end-user",
    "preconditions": ["User is authenticated", "User has verified their current email"],
    "postconditions": ["Email is updated in the database", "Confirmation email is sent"],
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
    "actorRef": "end-user",
    "description": "Tests for the user authentication flow",
    "preconditions": ["User has a registered account"],
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
const VIM_MODE_KEY = 'editor-vim-mode';

const FONT_SIZES: FontSize[] = ['xs', 'sm', 'base', 'md', 'lg'];

function isValidFontSize(value: string | null): value is FontSize {
  return value !== null && FONT_SIZES.includes(value as FontSize);
}

export function App() {
  const { diagramService, exportService } = useServices();
  const { theme, toggleTheme } = useTheme();

  // Editor refs
  const archEditorRef = useRef<JsonEditorHandle>(null);
  const ucEditorRef = useRef<JsonEditorHandle>(null);
  const canvasRef = useRef<UmlCanvasHandle>(null);

  // History-backed JSON states
  const archHistory = useHistory(
    localStorage.getItem(ARCH_STORAGE_KEY) ?? EXAMPLE_ARCHITECTURE_JSON,
  );
  const ucHistory = useHistory(localStorage.getItem(USECASES_STORAGE_KEY) ?? EXAMPLE_USECASES_JSON);

  const architectureJson = archHistory.value;
  const useCasesJson = ucHistory.value;

  // Font size state
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    return isValidFontSize(stored) ? stored : 'base';
  });

  // Vim mode state
  const [vimMode, setVimMode] = useState(() =>
    localStorage.getItem(VIM_MODE_KEY) === 'true',
  );

  const handleVimModeChange = (enabled: boolean) => {
    setVimMode(enabled);
    localStorage.setItem(VIM_MODE_KEY, String(enabled));
  };

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

  // Derive parse errors
  let archParseError: string | null = null;
  try {
    JSON.parse(architectureJson);
  } catch (e) {
    archParseError = e instanceof Error ? e.message : 'Invalid JSON';
  }

  let useCasesParseError: string | null = null;
  try {
    JSON.parse(useCasesJson);
  } catch (e) {
    useCasesParseError = e instanceof Error ? e.message : 'Invalid JSON';
  }

  // Merge JSON and process diagram — all derived state
  let layout: DiagramLayout | null = null;
  let mergedJson: string | null = null;
  let entities: DiagramLayout['diagram']['entities'] = [];
  let useCases: NonNullable<DiagramLayout['diagram']['useCases']> = [];
  let actors: Actor[] = [];
  let archValidationErrors: ValidationError[] = [];
  let useCasesValidationErrors: ValidationError[] = [];
  let completenessWarnings: CompletenessWarning[] = [];

  if (!archParseError && !useCasesParseError) {
    try {
      const arch = JSON.parse(architectureJson);
      const uc = JSON.parse(useCasesJson);
      const mergedJsonStr = JSON.stringify({ ...arch, useCases: uc }, null, 2);

      const result = diagramService.processDiagram(mergedJsonStr);
      if (result.success) {
        layout = result.layout;
        mergedJson = mergedJsonStr;
        entities = result.layout.diagram.entities;
        useCases = result.layout.diagram.useCases ?? [];
        actors = result.layout.diagram.actors ?? [];
        completenessWarnings = validateCompleteness(result.layout.diagram);
      } else {
        mergedJson = mergedJsonStr;
        archValidationErrors = (result.validationErrors ?? []).filter(
          e => !e.path.startsWith('useCases'),
        );
        useCasesValidationErrors = (result.validationErrors ?? []).filter(e =>
          e.path.startsWith('useCases'),
        );
      }
    } catch {
      // merge failed — leave defaults
    }
  }

  const handleArchitectureJsonChange = (newJson: string, immediate?: boolean) => {
    archHistory.setValue(newJson, immediate);
    localStorage.setItem(ARCH_STORAGE_KEY, newJson);
  };

  const handleUseCasesJsonChange = (newJson: string, immediate?: boolean) => {
    ucHistory.setValue(newJson, immediate);
    localStorage.setItem(USECASES_STORAGE_KEY, newJson);
  };

  const handleFontSizeChange = (newSize: FontSize) => {
    setFontSize(newSize);
    localStorage.setItem(FONT_SIZE_KEY, newSize);
  };

  const handleLoadExample = () => {
    handleArchitectureJsonChange(EXAMPLE_ARCHITECTURE_JSON, true);
    handleUseCasesJsonChange(EXAMPLE_USECASES_JSON, true);
  };

  const handleImport = (json: string) => {
    handleArchitectureJsonChange(json, true);
  };

  const handleAddEntity = (entityJson: string) => {
    try {
      const arch = JSON.parse(architectureJson);
      const entity = JSON.parse(entityJson);
      arch.entities = [...(arch.entities ?? []), entity];
      handleArchitectureJsonChange(JSON.stringify(arch, null, 2), true);
    } catch {
      // parse failed
    }
  };

  const handleAddRelationship = (relJson: string) => {
    try {
      const arch = JSON.parse(architectureJson);
      const rel = JSON.parse(relJson);
      arch.relationships = [...(arch.relationships ?? []), rel];
      handleArchitectureJsonChange(JSON.stringify(arch, null, 2), true);
    } catch {
      // parse failed
    }
  };

  const handleAddUseCase = (ucJson: string) => {
    try {
      const ucArray = JSON.parse(useCasesJson);
      const uc = JSON.parse(ucJson);
      if (Array.isArray(ucArray)) {
        ucArray.push(uc);
        handleUseCasesJsonChange(JSON.stringify(ucArray, null, 2), true);
      }
    } catch {
      // parse failed
    }
  };

  const handleAddEndpoint = (epJson: string) => {
    try {
      const arch = JSON.parse(architectureJson);
      const ep = JSON.parse(epJson);
      arch.endpoints = [...(arch.endpoints ?? []), ep];
      handleArchitectureJsonChange(JSON.stringify(arch, null, 2), true);
    } catch {
      // parse failed
    }
  };

  const handleEntityClick = (entityId: string) => {
    const line = findEntityLine(architectureJson, entityId);
    if (line !== null) {
      setActiveTab('architecture');
      setTimeout(() => archEditorRef.current?.scrollToLine(line), 50);
    }
  };

  // Error line highlighting
  let archHighlightedLines: number[] | undefined;
  if (archParseError) {
    const match = archParseError.match(/position\s+(\d+)/i);
    if (match) {
      const offset = parseInt(match[1], 10);
      archHighlightedLines = [architectureJson.substring(0, offset).split('\n').length];
    } else {
      archHighlightedLines = [1];
    }
  } else if (archValidationErrors.length > 0) {
    const pathLineMap = buildPathLineMap(architectureJson);
    const lines: number[] = [];
    for (const error of archValidationErrors) {
      const line = pathLineMap.get(error.path);
      if (line !== null && line !== undefined) lines.push(line);
    }
    if (lines.length > 0) archHighlightedLines = lines;
  }

  let ucHighlightedLines: number[] | undefined;
  if (useCasesParseError) {
    ucHighlightedLines = [1];
  } else if (useCasesValidationErrors.length > 0) {
    const pathLineMap = buildPathLineMap(useCasesJson);
    const lines: number[] = [];
    for (const error of useCasesValidationErrors) {
      const path = error.path.replace(/^useCases\.?/, '');
      const line = pathLineMap.get(path);
      if (line !== null && line !== undefined) lines.push(line);
    }
    if (lines.length > 0) ucHighlightedLines = lines;
  }

  const handleArchErrorClick = (line: number) => {
    if (line > 0) archEditorRef.current?.scrollToLine(line);
  };

  const handleUcErrorClick = (line: number) => {
    if (line > 0) ucEditorRef.current?.scrollToLine(line);
  };

  const handleShare = () => {
    share(architectureJson, useCasesJson);
  };

  const handleUndo = () => {
    if (activeTab === 'architecture') {
      archHistory.undo();
    } else {
      ucHistory.undo();
    }
  };

  const handleRedo = () => {
    if (activeTab === 'architecture') {
      archHistory.redo();
    } else {
      ucHistory.redo();
    }
  };

  const handlePrettify = () => {
    if (activeTab === 'architecture') {
      archEditorRef.current?.prettify();
    } else {
      ucEditorRef.current?.prettify();
    }
  };

  const handleExportSvg = () => {
    const svgEl = canvasRef.current?.getSvgElement();
    if (!svgEl || !layout) return;
    const svgString = exportSvgFromElement(svgEl);
    downloadFile(svgString, getSvgFilename(layout.diagram.title), 'image/svg+xml');
  };

  const handleExportToon = () => {
    if (!mergedJson || !layout) return;
    const diagram = diagramService.getDiagram(mergedJson);
    if (diagram) {
      exportService.exportAsToon(diagram);
    }
  };

  const handleFitToView = () => {
    canvasRef.current?.fitToView();
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onPrettify: handlePrettify,
    onExport: handleExportToon,
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
            onExportSvg={handleExportSvg}
            entities={entities}
            actors={actors}
            useCases={useCases}
            onAddEntity={handleAddEntity}
            onAddRelationship={handleAddRelationship}
            onAddUseCase={handleAddUseCase}
            onAddEndpoint={handleAddEndpoint}
          />
        }
        architectureEditor={
          <JsonEditor
            ref={archEditorRef}
            value={architectureJson}
            onChange={handleArchitectureJsonChange}
            parseError={archParseError}
            validationErrors={archValidationErrors}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
            vimMode={vimMode}
            onVimModeChange={handleVimModeChange}
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
            onChange={handleUseCasesJsonChange}
            parseError={useCasesParseError}
            validationErrors={useCasesValidationErrors}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
            vimMode={vimMode}
            onVimModeChange={handleVimModeChange}
            canUndo={ucHistory.canUndo}
            canRedo={ucHistory.canRedo}
            onUndo={ucHistory.undo}
            onRedo={ucHistory.redo}
            highlightedLines={ucHighlightedLines}
            onErrorClick={handleUcErrorClick}
          />
        }
        canvas={<UmlCanvas ref={canvasRef} layout={layout} onEntityClick={handleEntityClick} />}
        useCasePanel={<UseCasePanel useCases={useCases} entities={entities} actors={actors} />}
        coveragePanel={<CoveragePanel diagram={layout?.diagram ?? null} warnings={completenessWarnings} />}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
