import { useServices } from '../../context/useServices';

export function useExport(json: string, hasValidDiagram: boolean) {
  const { diagramService, exportService } = useServices();

  const handleExport = () => {
    if (!hasValidDiagram) return;

    const diagram = diagramService.getDiagram(json);
    if (diagram) {
      exportService.exportAsToon(diagram);
    }
  };

  const handleExportJson = () => {
    if (!hasValidDiagram) return;

    const diagram = diagramService.getDiagram(json);
    if (diagram) {
      exportService.exportAsJson(diagram);
    }
  };

  const handleExportMermaid = () => {
    if (!hasValidDiagram) return;

    const diagram = diagramService.getDiagram(json);
    if (diagram) {
      exportService.exportAsMermaid(diagram);
    }
  };

  return { handleExport, handleExportJson, handleExportMermaid, canExport: hasValidDiagram };
}
