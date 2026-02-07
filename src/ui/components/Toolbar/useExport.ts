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

  return { handleExport, canExport: hasValidDiagram };
}
