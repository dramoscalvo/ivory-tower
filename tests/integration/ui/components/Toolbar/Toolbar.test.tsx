import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toolbar } from '../../../../../src/ui/components/Toolbar/Toolbar'
import { renderWithProviders } from '../../../../helpers/renderWithProviders'

const VALID_JSON = JSON.stringify({
  title: 'Test',
  entities: [{ id: 'a', name: 'A', type: 'class' }],
  relationships: [],
})

describe('Toolbar', () => {
  describe('title', () => {
    it('displays the application title', () => {
      renderWithProviders(
        <Toolbar json="" hasValidDiagram={false} onLoadExample={() => {}} />
      )

      expect(screen.getByText('UML Diagram Editor')).toBeInTheDocument()
    })
  })

  describe('Load Example button', () => {
    it('renders Load Example button', () => {
      renderWithProviders(
        <Toolbar json="" hasValidDiagram={false} onLoadExample={() => {}} />
      )

      expect(screen.getByRole('button', { name: /Load Example/i })).toBeInTheDocument()
    })

    it('calls onLoadExample when clicked', async () => {
      const user = userEvent.setup()
      const onLoadExample = vi.fn()

      renderWithProviders(
        <Toolbar json="" hasValidDiagram={false} onLoadExample={onLoadExample} />
      )

      await user.click(screen.getByRole('button', { name: /Load Example/i }))

      expect(onLoadExample).toHaveBeenCalledTimes(1)
    })
  })

  describe('Export TOON button', () => {
    it('renders Export TOON button', () => {
      renderWithProviders(
        <Toolbar json="" hasValidDiagram={false} onLoadExample={() => {}} />
      )

      expect(screen.getByRole('button', { name: /Export TOON/i })).toBeInTheDocument()
    })

    it('is disabled when hasValidDiagram is false', () => {
      renderWithProviders(
        <Toolbar json="" hasValidDiagram={false} onLoadExample={() => {}} />
      )

      expect(screen.getByRole('button', { name: /Export TOON/i })).toBeDisabled()
    })

    it('is enabled when hasValidDiagram is true', () => {
      renderWithProviders(
        <Toolbar json={VALID_JSON} hasValidDiagram={true} onLoadExample={() => {}} />
      )

      expect(screen.getByRole('button', { name: /Export TOON/i })).toBeEnabled()
    })
  })
})
