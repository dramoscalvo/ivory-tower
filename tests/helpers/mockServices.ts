import { vi } from 'vitest'
import { DiagramService } from '../../src/diagram/application/DiagramService'
import { ExportService } from '../../src/export/application/ExportService'
import type { Services } from '../../src/ui/context/services'

export function createMockServices(overrides?: Partial<Services>): Services {
  return {
    diagramService: new DiagramService(),
    exportService: new ExportService(),
    ...overrides,
  }
}

export function createMockDiagramService() {
  return {
    processDiagram: vi.fn(),
    getDiagram: vi.fn(),
  }
}

export function createMockExportService() {
  return {
    exportAsToon: vi.fn(),
    getAsToon: vi.fn(),
  }
}
