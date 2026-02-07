import { useState, useEffect, useMemo } from 'react';
import { EditorLayout } from '../EditorLayout/EditorLayout';
import { JsonEditor } from '../JsonEditor/JsonEditor';
import { UmlCanvas } from '../UmlCanvas/UmlCanvas';
import { UseCasePanel } from '../UseCasePanel';
import { Toolbar } from '../Toolbar/Toolbar';
import { useServices } from '../../context/useServices';
import type { DiagramLayout } from '../../../diagram/domain/services/LayoutCalculator';
import type { ValidationError } from '../../../diagram/domain/services/DiagramValidator';
import type { UseCase } from '../../../usecase/domain/models/UseCase';
import type { Entity } from '../../../diagram/domain/models/Entity';
import type { FontSize } from '../JsonEditor/JsonEditor';
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
    "entityRef": "user",
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

  // Split JSON states
  const [architectureJson, setArchitectureJson] = useState(() =>
    localStorage.getItem(ARCH_STORAGE_KEY) ?? EXAMPLE_ARCHITECTURE_JSON
  );
  const [useCasesJson, setUseCasesJson] = useState(() =>
    localStorage.getItem(USECASES_STORAGE_KEY) ?? EXAMPLE_USECASES_JSON
  );

  // Font size state
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    return isValidFontSize(stored) ? stored : 'base';
  });

  const [layout, setLayout] = useState<DiagramLayout | null>(null);
  const [archParseError, setArchParseError] = useState<string | null>(null);
  const [archValidationErrors, setArchValidationErrors] = useState<ValidationError[]>([]);
  const [useCasesParseError, setUseCasesParseError] = useState<string | null>(null);
  const [useCasesValidationErrors, setUseCasesValidationErrors] = useState<ValidationError[]>([]);
  const [activeTab, setActiveTab] = useState('architecture');
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);

  // Merge JSON for processing and export
  const mergedJson = useMemo(() => {
    try {
      const arch = JSON.parse(architectureJson);
      const uc = JSON.parse(useCasesJson);
      return JSON.stringify({ ...arch, useCases: uc }, null, 2);
    } catch {
      return null;
    }
  }, [architectureJson, useCasesJson]);

  // Process merged diagram
  const processMergedDiagram = (archJson: string, ucJson: string) => {
    let mergedJsonStr: string;
    try {
      const arch = JSON.parse(archJson);
      const uc = JSON.parse(ucJson);
      mergedJsonStr = JSON.stringify({ ...arch, useCases: uc }, null, 2);
    } catch {
      // Parse errors are handled individually
      return;
    }

    const result = diagramService.processDiagram(mergedJsonStr);

    if (result.success) {
      setLayout(result.layout);
      setEntities(result.layout.diagram.entities);
      setUseCases(result.layout.diagram.useCases ?? []);
    } else {
      setLayout(null);
      setUseCases([]);
      setEntities([]);
      if (result.validationErrors) {
        // Distribute validation errors to appropriate editors
        const archErrors = result.validationErrors.filter(
          e => !e.path.startsWith('useCases')
        );
        const ucErrors = result.validationErrors.filter(
          e => e.path.startsWith('useCases')
        );
        setArchValidationErrors(archErrors);
        setUseCasesValidationErrors(ucErrors);
      }
    }
  };

  // Process initial diagram on mount
  useEffect(() => {
    // Validate architecture JSON
    try {
      JSON.parse(architectureJson);
      setArchParseError(null);
    } catch (e) {
      setArchParseError(e instanceof Error ? e.message : 'Invalid JSON');
    }

    // Validate use cases JSON
    try {
      JSON.parse(useCasesJson);
      setUseCasesParseError(null);
    } catch (e) {
      setUseCasesParseError(e instanceof Error ? e.message : 'Invalid JSON');
    }

    processMergedDiagram(architectureJson, useCasesJson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleArchitectureJsonChange = (newJson: string) => {
    setArchitectureJson(newJson);
    localStorage.setItem(ARCH_STORAGE_KEY, newJson);

    try {
      JSON.parse(newJson);
      setArchParseError(null);
      setArchValidationErrors([]);
      processMergedDiagram(newJson, useCasesJson);
    } catch (e) {
      setArchParseError(e instanceof Error ? e.message : 'Invalid JSON');
      setArchValidationErrors([]);
      setLayout(null);
      setEntities([]);
    }
  };

  const handleUseCasesJsonChange = (newJson: string) => {
    setUseCasesJson(newJson);
    localStorage.setItem(USECASES_STORAGE_KEY, newJson);

    try {
      JSON.parse(newJson);
      setUseCasesParseError(null);
      setUseCasesValidationErrors([]);
      processMergedDiagram(architectureJson, newJson);
    } catch (e) {
      setUseCasesParseError(e instanceof Error ? e.message : 'Invalid JSON');
      setUseCasesValidationErrors([]);
      setUseCases([]);
    }
  };

  const handleFontSizeChange = (newSize: FontSize) => {
    setFontSize(newSize);
    localStorage.setItem(FONT_SIZE_KEY, newSize);
  };

  const handleLoadExample = () => {
    handleArchitectureJsonChange(EXAMPLE_ARCHITECTURE_JSON);
    handleUseCasesJsonChange(EXAMPLE_USECASES_JSON);
  };

  return (
    <div className={styles.app}>
      <EditorLayout
        toolbar={
          <Toolbar
            json={mergedJson ?? ''}
            hasValidDiagram={layout !== null}
            onLoadExample={handleLoadExample}
          />
        }
        architectureEditor={
          <JsonEditor
            value={architectureJson}
            onChange={handleArchitectureJsonChange}
            parseError={archParseError}
            validationErrors={archValidationErrors}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
          />
        }
        useCasesEditor={
          <JsonEditor
            value={useCasesJson}
            onChange={handleUseCasesJsonChange}
            parseError={useCasesParseError}
            validationErrors={useCasesValidationErrors}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
          />
        }
        canvas={<UmlCanvas layout={layout} />}
        useCasePanel={<UseCasePanel useCases={useCases} entities={entities} />}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
