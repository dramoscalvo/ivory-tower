import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoveragePanel } from '../../../../../src/ui/components/CoveragePanel/CoveragePanel';
import type { UMLDiagram } from '../../../../../src/diagram/domain/models/UMLDiagram';
import type { CompletenessWarning } from '../../../../../src/diagram/domain/services/CompletenessValidator';

function makeDiagram(overrides: Partial<UMLDiagram> = {}): UMLDiagram {
  return {
    title: 'Test Diagram',
    entities: [],
    relationships: [],
    ...overrides,
  };
}

describe('CoveragePanel', () => {
  describe('empty state', () => {
    it('shows empty message when diagram is null', () => {
      render(<CoveragePanel diagram={null} warnings={[]} />);

      expect(screen.getByText('No entities to analyze')).toBeInTheDocument();
      expect(
        screen.getByText('Add entities to your diagram to see coverage analysis.'),
      ).toBeInTheDocument();
    });

    it('shows empty message when diagram has no entities', () => {
      const diagram = makeDiagram({ entities: [] });

      render(<CoveragePanel diagram={diagram} warnings={[]} />);

      expect(screen.getByText('No entities to analyze')).toBeInTheDocument();
    });
  });

  describe('summary display', () => {
    it('shows percentage and coverage counts', () => {
      const diagram = makeDiagram({
        entities: [
          { id: 'e1', name: 'User', type: 'class' },
          { id: 'e2', name: 'Order', type: 'class' },
          { id: 'e3', name: 'Product', type: 'class' },
        ],
        relationships: [
          { id: 'r1', type: 'association', sourceId: 'e1', targetId: 'e2' },
        ],
        useCases: [
          { id: 'uc1', name: 'Create Order', entityRef: 'e1', scenarios: [] },
        ],
        endpoints: [
          {
            id: 'ep1',
            method: 'POST',
            path: '/orders',
            requestBody: { entityRef: 'e1' },
          },
        ],
      });

      render(<CoveragePanel diagram={diagram} warnings={[]} />);

      // e1 (User) has useCases, endpoints, and relationships -> full
      // e2 (Order) has relationships only -> partial
      // e3 (Product) has nothing -> none
      expect(screen.getByText('33%')).toBeInTheDocument();
      expect(screen.getByText('fully covered')).toBeInTheDocument();
      expect(screen.getByText('1 full')).toBeInTheDocument();
      expect(screen.getByText('1 partial')).toBeInTheDocument();
      expect(screen.getByText('1 none')).toBeInTheDocument();
    });
  });

  describe('entity coverage table', () => {
    it('shows entity names and coverage counts', () => {
      const diagram = makeDiagram({
        entities: [
          { id: 'e1', name: 'Account', type: 'class' },
          { id: 'e2', name: 'Invoice', type: 'class' },
        ],
        relationships: [
          { id: 'r1', type: 'dependency', sourceId: 'e1', targetId: 'e2' },
        ],
        useCases: [
          { id: 'uc1', name: 'Open Account', entityRef: 'e1', scenarios: [] },
          { id: 'uc2', name: 'Close Account', entityRef: 'e1', scenarios: [] },
        ],
        endpoints: [
          {
            id: 'ep1',
            method: 'GET',
            path: '/invoices',
            response: { entityRef: 'e2' },
          },
        ],
        rules: [
          { id: 'ru1', entityRef: 'e1', type: 'validation', description: 'Name required' },
        ],
      });

      render(<CoveragePanel diagram={diagram} warnings={[]} />);

      // Table headers
      expect(screen.getByText('Entity')).toBeInTheDocument();
      expect(screen.getByText('Use Cases')).toBeInTheDocument();
      expect(screen.getByText('Endpoints')).toBeInTheDocument();
      expect(screen.getByText('Rules')).toBeInTheDocument();
      expect(screen.getByText('Relations')).toBeInTheDocument();

      // Entity names
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Invoice')).toBeInTheDocument();

      // Account: 2 use cases, 0 endpoints, 1 rule, has relationships
      // Invoice: 0 use cases, 1 endpoint, 0 rules, has relationships
      const rows = screen.getAllByRole('row');
      // header + 2 data rows
      expect(rows).toHaveLength(3);
    });
  });

  describe('full coverage', () => {
    it('marks entity with use cases, endpoints, and relationships as fully covered', () => {
      const diagram = makeDiagram({
        entities: [{ id: 'e1', name: 'Customer', type: 'class' }],
        relationships: [
          { id: 'r1', type: 'association', sourceId: 'e1', targetId: 'e1' },
        ],
        useCases: [
          { id: 'uc1', name: 'Register', entityRef: 'e1', scenarios: [] },
        ],
        endpoints: [
          {
            id: 'ep1',
            method: 'POST',
            path: '/customers',
            requestBody: { entityRef: 'e1' },
          },
        ],
      });

      render(<CoveragePanel diagram={diagram} warnings={[]} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('1 full')).toBeInTheDocument();
      expect(screen.getByText('0 partial')).toBeInTheDocument();
      expect(screen.getByText('0 none')).toBeInTheDocument();

      // Relationship column shows "Yes"
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });
  });

  describe('partial coverage', () => {
    it('marks entity with some but not all coverage checks as partial', () => {
      const diagram = makeDiagram({
        entities: [{ id: 'e1', name: 'Payment', type: 'class' }],
        relationships: [],
        useCases: [
          { id: 'uc1', name: 'Process Payment', entityRef: 'e1', scenarios: [] },
        ],
      });

      render(<CoveragePanel diagram={diagram} warnings={[]} />);

      // Has use case but no endpoints and no relationships -> partial
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 full')).toBeInTheDocument();
      expect(screen.getByText('1 partial')).toBeInTheDocument();
      expect(screen.getByText('0 none')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  describe('no coverage', () => {
    it('marks entity with no use cases, endpoints, or relationships as none', () => {
      const diagram = makeDiagram({
        entities: [{ id: 'e1', name: 'Orphan', type: 'class' }],
        relationships: [],
      });

      render(<CoveragePanel diagram={diagram} warnings={[]} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 full')).toBeInTheDocument();
      expect(screen.getByText('0 partial')).toBeInTheDocument();
      expect(screen.getByText('1 none')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  describe('warnings display', () => {
    it('shows warning badges and messages when warnings are provided', () => {
      const diagram = makeDiagram({
        entities: [{ id: 'e1', name: 'Widget', type: 'class' }],
        relationships: [],
      });

      const warnings: CompletenessWarning[] = [
        {
          category: 'uncovered-entity',
          entityId: 'e1',
          message: 'Entity "Widget" has no use cases',
        },
        {
          category: 'orphan-entity',
          entityId: 'e1',
          message: 'Entity "Widget" has no relationships',
        },
      ];

      render(<CoveragePanel diagram={diagram} warnings={warnings} />);

      expect(screen.getByText('Warnings (2)')).toBeInTheDocument();

      // Badge labels from CATEGORY_LABELS
      expect(screen.getByText('No Use Cases')).toBeInTheDocument();
      expect(screen.getByText('No Relationships')).toBeInTheDocument();

      // Warning messages
      expect(
        screen.getByText('Entity "Widget" has no use cases'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Entity "Widget" has no relationships'),
      ).toBeInTheDocument();
    });
  });

  describe('no warnings section', () => {
    it('does not render warnings section when warnings array is empty', () => {
      const diagram = makeDiagram({
        entities: [{ id: 'e1', name: 'Clean', type: 'class' }],
        relationships: [
          { id: 'r1', type: 'association', sourceId: 'e1', targetId: 'e1' },
        ],
        useCases: [
          { id: 'uc1', name: 'Do Thing', entityRef: 'e1', scenarios: [] },
        ],
        endpoints: [
          {
            id: 'ep1',
            method: 'GET',
            path: '/clean',
            response: { entityRef: 'e1' },
          },
        ],
      });

      render(<CoveragePanel diagram={diagram} warnings={[]} />);

      expect(screen.queryByText(/Warnings/)).not.toBeInTheDocument();
    });
  });
});
