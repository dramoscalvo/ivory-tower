import { createContext } from 'react';
import type { DiagramService } from '../../diagram/application/DiagramService';
import type { ExportService } from '../../export/application/ExportService';

export interface Services {
  diagramService: DiagramService;
  exportService: ExportService;
}

export const ServiceContext = createContext<Services | null>(null);
