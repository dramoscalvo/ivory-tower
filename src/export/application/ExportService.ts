import { formatAsToon } from '../domain/services/ToonFormatter';
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
}
