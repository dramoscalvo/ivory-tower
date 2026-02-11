import { formatAsToon } from '../domain/services/ToonFormatter';
import { formatAsMermaid } from '../domain/services/MermaidExporter';
import { downloadFile } from '../infrastructure/FileDownloader';
import type { UMLDiagram } from '../../diagram/domain/models/UMLDiagram';

export class ExportService {
  exportAsToon(diagram: UMLDiagram): void {
    const content = formatAsToon(diagram);
    const filename = `${diagram.title.toLowerCase().replace(/\s+/g, '-')}.toon`;
    downloadFile(content, filename, 'text/plain');
  }

  getAsToon(diagram: UMLDiagram): string {
    return formatAsToon(diagram);
  }

  exportAsJson(diagram: UMLDiagram): void {
    const content = JSON.stringify(diagram, null, 2);
    const filename = `${diagram.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    downloadFile(content, filename, 'application/json');
  }

  getAsJson(diagram: UMLDiagram): string {
    return JSON.stringify(diagram, null, 2);
  }

  exportAsMermaid(diagram: UMLDiagram): void {
    const content = formatAsMermaid(diagram);
    const filename = `${diagram.title.toLowerCase().replace(/\s+/g, '-')}.mmd`;
    downloadFile(content, filename, 'text/plain');
  }

  getAsMermaid(diagram: UMLDiagram): string {
    return formatAsMermaid(diagram);
  }
}
