import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ValidationErrors } from '../../../../../src/ui/components/JsonEditor/ValidationErrors'

describe('ValidationErrors', () => {
  describe('when there are no errors', () => {
    it('renders nothing when parseError is null and validationErrors is empty', () => {
      const { container } = render(
        <ValidationErrors parseError={null} validationErrors={[]} />
      )

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('parse errors', () => {
    it('displays parse error message', () => {
      render(
        <ValidationErrors parseError="Unexpected token" validationErrors={[]} />
      )

      expect(screen.getByText(/Parse Error:/)).toBeInTheDocument()
      expect(screen.getByText(/Unexpected token/)).toBeInTheDocument()
    })
  })

  describe('validation errors', () => {
    it('displays single validation error', () => {
      const errors = [{ path: 'entities[0].id', message: 'Entity must have a string id' }]

      render(<ValidationErrors parseError={null} validationErrors={errors} />)

      expect(screen.getByText('entities[0].id')).toBeInTheDocument()
      expect(screen.getByText(/Entity must have a string id/)).toBeInTheDocument()
    })

    it('displays multiple validation errors', () => {
      const errors = [
        { path: 'entities[0].id', message: 'Missing id' },
        { path: 'entities[0].name', message: 'Missing name' },
        { path: 'relationships[0].type', message: 'Invalid type' },
      ]

      render(<ValidationErrors parseError={null} validationErrors={errors} />)

      expect(screen.getByText('entities[0].id')).toBeInTheDocument()
      expect(screen.getByText('entities[0].name')).toBeInTheDocument()
      expect(screen.getByText('relationships[0].type')).toBeInTheDocument()
    })

    it('displays "root" for errors with empty path', () => {
      const errors = [{ path: '', message: 'Diagram must be an object' }]

      render(<ValidationErrors parseError={null} validationErrors={errors} />)

      expect(screen.getByText('root')).toBeInTheDocument()
    })
  })

  describe('combined errors', () => {
    it('displays both parse error and validation errors', () => {
      const errors = [{ path: 'title', message: 'Missing title' }]

      render(
        <ValidationErrors parseError="Parse failed" validationErrors={errors} />
      )

      expect(screen.getByText(/Parse Error:/)).toBeInTheDocument()
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })
})
