import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../../../../src/ui/components/App/App'
import { renderWithProviders } from '../../../../helpers/renderWithProviders'

const STORAGE_KEY = 'uml-diagram-json'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('initial render', () => {
    it('renders the toolbar', () => {
      renderWithProviders(<App />)

      expect(screen.getByText('UML Diagram Editor')).toBeInTheDocument()
    })

    it('renders the JSON editor', () => {
      renderWithProviders(<App />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('loads example diagram by default', () => {
      renderWithProviders(<App />)

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).toContain('Example System')
    })
  })

  describe('localStorage persistence', () => {
    it('loads diagram from localStorage if present', () => {
      const savedDiagram = JSON.stringify({
        title: 'Saved Diagram',
        entities: [],
        relationships: [],
      })
      localStorage.setItem(STORAGE_KEY, savedDiagram)

      renderWithProviders(<App />)

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).toContain('Saved Diagram')
    })

    it('saves diagram to localStorage on change', async () => {
      renderWithProviders(<App />)

      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: '{"title": "New"}' } })

      await waitFor(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        expect(saved).toContain('New')
      })
    })
  })

  describe('Load Example button', () => {
    it('loads example diagram when clicked', async () => {
      const user = userEvent.setup()

      // Start with custom content in localStorage
      localStorage.setItem(STORAGE_KEY, '{"title": "Custom"}')
      renderWithProviders(<App />)

      await user.click(screen.getByRole('button', { name: /Load Example/i }))

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).toContain('Example System')
    })
  })

  describe('error handling', () => {
    it('shows error for invalid JSON', async () => {
      renderWithProviders(<App />)

      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: '{ invalid json' } })

      await waitFor(() => {
        expect(screen.getByText(/Parse Error:/i)).toBeInTheDocument()
      })
    })

    it('shows validation error for valid JSON with invalid structure', async () => {
      renderWithProviders(<App />)

      const invalidStructure = JSON.stringify({
        title: 'Test',
        entities: [{ name: 'Missing ID' }],
        relationships: [],
      })

      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: invalidStructure } })

      await waitFor(() => {
        // Should show validation error about missing id or type
        const errorElements = screen.getAllByText(/entities\[0\]/i)
        expect(errorElements.length).toBeGreaterThan(0)
      })
    })

    it('clears errors when valid JSON is entered', async () => {
      renderWithProviders(<App />)

      const textarea = screen.getByRole('textbox')

      // First enter invalid JSON
      fireEvent.change(textarea, { target: { value: '{ invalid' } })

      await waitFor(() => {
        expect(screen.getByText(/Parse Error:/i)).toBeInTheDocument()
      })

      // Then enter valid JSON
      const validJson = JSON.stringify({
        title: 'Valid',
        entities: [],
        relationships: [],
      })
      fireEvent.change(textarea, { target: { value: validJson } })

      await waitFor(() => {
        expect(screen.queryByText(/Parse Error:/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('export button state', () => {
    it('export button is enabled for valid diagram', async () => {
      renderWithProviders(<App />)

      // Default example diagram should be valid
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export TOON/i })).toBeEnabled()
      })
    })

    it('export button is disabled for invalid diagram', async () => {
      renderWithProviders(<App />)

      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: '{ invalid' } })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export TOON/i })).toBeDisabled()
      })
    })
  })
})
