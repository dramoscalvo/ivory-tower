import type { UMLDiagram } from '../domain/models/UMLDiagram';

export type ParseResult =
  | {
      success: true;
      diagram: UMLDiagram;
    }
  | {
      success: false;
      error: string;
    };

export function parseJson(json: string): ParseResult {
  if (!json.trim()) {
    return { success: false, error: 'Empty input' };
  }

  try {
    const parsed = JSON.parse(json) as UMLDiagram;
    return { success: true, diagram: parsed };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown parse error';
    return { success: false, error: message };
  }
}
