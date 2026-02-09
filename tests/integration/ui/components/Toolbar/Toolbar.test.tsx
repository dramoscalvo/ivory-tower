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

const defaultProps = {
  json: '',
  hasValidDiagram: false,
  onLoadExample: () => {},
  theme: 'dark' as const,
  onToggleTheme: () => {},
  onShare: () => {},
  shareStatus: 'idle' as const,
  onImport: () => {},
}

describe('Toolbar', () => {
  describe('title', () => {
    it('displays the application title', () => {
      renderWithProviders(<Toolbar {...defaultProps} />)
      expect(screen.getByText('Ivory Tower')).toBeInTheDocument()
    })
  })

  describe('Load Example button', () => {
    it('renders Load Example button', () => {
      renderWithProviders(<Toolbar {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Load Example/i })).toBeInTheDocument()
    })

    it('calls onLoadExample when clicked', async () => {
      const user = userEvent.setup()
      const onLoadExample = vi.fn()

      renderWithProviders(
        <Toolbar {...defaultProps} onLoadExample={onLoadExample} />
      )

      await user.click(screen.getByRole('button', { name: /Load Example/i }))
      expect(onLoadExample).toHaveBeenCalledTimes(1)
    })
  })

  describe('Export TOON button', () => {
    it('renders Export TOON button', () => {
      renderWithProviders(<Toolbar {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Export TOON/i })).toBeInTheDocument()
    })

    it('is disabled when hasValidDiagram is false', () => {
      renderWithProviders(<Toolbar {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Export TOON/i })).toBeDisabled()
    })

    it('is enabled when hasValidDiagram is true', () => {
      renderWithProviders(
        <Toolbar {...defaultProps} json={VALID_JSON} hasValidDiagram={true} />
      )
      expect(screen.getByRole('button', { name: /Export TOON/i })).toBeEnabled()
    })
  })

  describe('theme toggle', () => {
    it('renders theme toggle button', () => {
      renderWithProviders(<Toolbar {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Switch to light theme/i })).toBeInTheDocument()
    })

    it('calls onToggleTheme when clicked', async () => {
      const user = userEvent.setup()
      const onToggleTheme = vi.fn()

      renderWithProviders(
        <Toolbar {...defaultProps} onToggleTheme={onToggleTheme} />
      )

      await user.click(screen.getByRole('button', { name: /Switch to light theme/i }))
      expect(onToggleTheme).toHaveBeenCalledTimes(1)
    })

    it('shows correct label for light theme', () => {
      renderWithProviders(<Toolbar {...defaultProps} theme="light" />)
      expect(screen.getByRole('button', { name: /Switch to dark theme/i })).toBeInTheDocument()
    })
  })

  describe('Import button', () => {
    it('renders Import button', () => {
      renderWithProviders(<Toolbar {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Import/i })).toBeInTheDocument()
    })
  })

  describe('Share button', () => {
    it('renders Share button', () => {
      renderWithProviders(<Toolbar {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Share/i })).toBeInTheDocument()
    })

    it('is disabled when hasValidDiagram is false', () => {
      renderWithProviders(<Toolbar {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Share/i })).toBeDisabled()
    })

    it('is enabled when hasValidDiagram is true', () => {
      renderWithProviders(
        <Toolbar {...defaultProps} hasValidDiagram={true} json={VALID_JSON} />
      )
      expect(screen.getByRole('button', { name: /Share/i })).toBeEnabled()
    })

    it('calls onShare when clicked', async () => {
      const user = userEvent.setup()
      const onShare = vi.fn()

      renderWithProviders(
        <Toolbar {...defaultProps} hasValidDiagram={true} json={VALID_JSON} onShare={onShare} />
      )

      await user.click(screen.getByRole('button', { name: /Share/i }))
      expect(onShare).toHaveBeenCalledTimes(1)
    })

    it('shows "Copied!" when shareStatus is copied', () => {
      renderWithProviders(
        <Toolbar {...defaultProps} hasValidDiagram={true} json={VALID_JSON} shareStatus="copied" />
      )
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })
  })

  describe('keyboard shortcuts button', () => {
    it('renders keyboard shortcuts button', () => {
      renderWithProviders(<Toolbar {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Keyboard shortcuts/i })).toBeInTheDocument()
    })
  })
})
