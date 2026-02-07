import type { DiagramLayout } from '../domain/services/LayoutCalculator';
import type { ValidationError } from '../domain/services/DiagramValidator';

export type DiagramResult =
  | {
      success: true;
      layout: DiagramLayout;
    }
  | {
      success: false;
      parseError?: string;
      validationErrors?: ValidationError[];
    };
