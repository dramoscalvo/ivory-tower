import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../../../../src/ui/components/App/App'
import { renderWithProviders } from '../../../../helpers/renderWithProviders'


describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('initial render', () => {
    it('renders the toolbar', () => {
      renderWithProviders(<App />)
      expect(screen.getByText('Ivory Tower')).toBeInTheDocument()
    })

    it('loads example diagram by default', () => {
      renderWithProviders(<App />)
      // "Example System" appears in both the editor and the canvas title
      const matches = screen.getAllByText(/Example System/)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Load Example button', () => {
    it('loads example diagram when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<App />)

      await user.click(screen.getByRole('button', { name: /Load Example/i }))

      const matches = screen.getAllByText(/Example System/)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('export button state', () => {
    it('export button is enabled for valid diagram', () => {
      renderWithProviders(<App />)

      expect(screen.getByRole('button', { name: /Export TOON/i })).toBeEnabled()
    })
  })

  describe('theme toggle', () => {
    it('renders theme toggle button', () => {
      renderWithProviders(<App />)
      expect(screen.getByRole('button', { name: /Switch to light theme/i })).toBeInTheDocument()
    })

    it('toggles theme on click', async () => {
      const user = userEvent.setup()
      renderWithProviders(<App />)

      await user.click(screen.getByRole('button', { name: /Switch to light theme/i }))
      expect(screen.getByRole('button', { name: /Switch to dark theme/i })).toBeInTheDocument()
    })
  })

  describe('toolbar buttons', () => {
    it('renders Import button', () => {
      renderWithProviders(<App />)
      expect(screen.getByRole('button', { name: /Import/i })).toBeInTheDocument()
    })

    it('renders Share button', () => {
      renderWithProviders(<App />)
      expect(screen.getByRole('button', { name: /Share/i })).toBeInTheDocument()
    })

    it('renders keyboard shortcuts button', () => {
      renderWithProviders(<App />)
      expect(screen.getByRole('button', { name: /Keyboard shortcuts/i })).toBeInTheDocument()
    })
  })
})
