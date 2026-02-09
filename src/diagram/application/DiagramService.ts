import { parseJson } from '../infrastructure/JsonParser';
import { validateDiagram } from '../domain/services/DiagramValidator';
import { calculateHierarchicalLayout } from '../domain/services/HierarchicalLayoutCalculator';
import type { DiagramResult } from './types';
import type { UMLDiagram } from '../domain/models/UMLDiagram';

export class DiagramService {
  processDiagram(json: string): DiagramResult {
    const parseResult = parseJson(json);

    if (!parseResult.success) {
      return { success: false, parseError: parseResult.error };
    }

    const validationErrors = validateDiagram(parseResult.diagram);

    if (validationErrors.length > 0) {
      return { success: false, validationErrors };
    }

    const layout = calculateHierarchicalLayout(parseResult.diagram);

    return { success: true, layout };
  }

  getDiagram(json: string): UMLDiagram | null {
    const parseResult = parseJson(json);
    if (!parseResult.success) return null;

    const validationErrors = validateDiagram(parseResult.diagram);
    if (validationErrors.length > 0) return null;

    return parseResult.diagram;
  }
}
