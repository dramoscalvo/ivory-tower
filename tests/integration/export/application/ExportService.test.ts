import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExportService } from '../../../../src/export/application/ExportService'
import type { UMLDiagram } from '../../../../src/diagram/domain/models/UMLDiagram'

// Mock the file downloader to prevent actual file downloads
vi.mock('../../../../src/export/infrastructure/FileDownloader', () => ({
  downloadFile: vi.fn(),
}))

import { downloadFile } from '../../../../src/export/infrastructure/FileDownloader'

const mockDownloadFile = vi.mocked(downloadFile)

function createTestDiagram(): UMLDiagram {
  return {
    title: 'Test System',
    entities: [
      {
        id: 'user',
        name: 'User',
        type: 'class',
        description: 'A user entity',
        attributes: [
          { name: 'id', type: { name: 'string' }, visibility: 'private' },
        ],
        methods: [
          { name: 'getName', parameters: [], returnType: { name: 'string' } },
        ],
      },
    ],
    relationships: [],
  }
}

describe('ExportService', () => {
  const service = new ExportService()

  beforeEach(() => {
    mockDownloadFile.mockClear()
  })

  describe('getAsToon', () => {
    it('returns TOON formatted string', () => {
      const diagram = createTestDiagram()
      const result = service.getAsToon(diagram)

      expect(result).toContain('title: Test System')
      expect(result).toContain('entities[1]')
      expect(result).toContain('user,User,class')
    })

    it('includes all entity details', () => {
      const diagram = createTestDiagram()
      const result = service.getAsToon(diagram)

      expect(result).toContain('attributes[1]')
      expect(result).toContain('id,string,private')
      expect(result).toContain('methods[1]')
      expect(result).toContain('getName')
    })

    it('handles empty diagram', () => {
      const diagram: UMLDiagram = {
        title: 'Empty',
        entities: [],
        relationships: [],
      }
      const result = service.getAsToon(diagram)

      expect(result).toContain('title: Empty')
      expect(result).not.toContain('entities[')
    })
  })

  describe('exportAsToon', () => {
    it('calls downloadFile with correct content', () => {
      const diagram = createTestDiagram()
      service.exportAsToon(diagram)

      expect(mockDownloadFile).toHaveBeenCalledTimes(1)
      const [content] = mockDownloadFile.mock.calls[0]
      expect(content).toContain('title: Test System')
    })

    it('generates filename from diagram title', () => {
      const diagram = createTestDiagram()
      service.exportAsToon(diagram)

      const [, filename] = mockDownloadFile.mock.calls[0]
      expect(filename).toBe('test-system.toon')
    })

    it('converts spaces to hyphens in filename', () => {
      const diagram: UMLDiagram = {
        title: 'My Complex System Name',
        entities: [],
        relationships: [],
      }
      service.exportAsToon(diagram)

      const [, filename] = mockDownloadFile.mock.calls[0]
      expect(filename).toBe('my-complex-system-name.toon')
    })

    it('uses text/plain mime type', () => {
      const diagram = createTestDiagram()
      service.exportAsToon(diagram)

      const [, , mimeType] = mockDownloadFile.mock.calls[0]
      expect(mimeType).toBe('text/plain')
    })
  })
})
