import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from '../../../../../src/ui/components/Toolbar/Toolbar';
import { renderWithProviders } from '../../../../helpers/renderWithProviders';

const VALID_JSON = JSON.stringify({
  title: 'Test',
  entities: [{ id: 'a', name: 'A', type: 'class' }],
  relationships: [],
});

const defaultProps = {
  json: '',
  hasValidDiagram: false,
  onLoadExample: () => {},
  onShare: () => {},
  shareStatus: 'idle' as const,
  onImport: () => {},
  onExportSvg: () => {},
  entities: [] as { id: string; name: string; methods?: { name: string }[] }[],
  actors: [] as { id: string; name: string }[],
  useCases: [] as { id: string; name: string }[],
  onAddEntity: () => {},
  onAddRelationship: () => {},
  onAddUseCase: () => {},
  onAddEndpoint: () => {},
};

describe('Toolbar', () => {
  describe('title', () => {
    it('displays the application title', () => {
      renderWithProviders(<Toolbar {...defaultProps} />);
      expect(screen.getByText('Ivory Tower')).toBeInTheDocument();
    });
  });

  describe('Load Example button', () => {
    it('renders Load Example button', () => {
      renderWithProviders(<Toolbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Load Example/i })).toBeInTheDocument();
    });

    it('calls onLoadExample when clicked', async () => {
      const user = userEvent.setup();
      const onLoadExample = vi.fn();

      renderWithProviders(<Toolbar {...defaultProps} onLoadExample={onLoadExample} />);

      await user.click(screen.getByRole('button', { name: /Load Example/i }));
      expect(onLoadExample).toHaveBeenCalledTimes(1);
    });
  });

  describe('Export dropdown', () => {
    it('renders Export dropdown trigger', () => {
      renderWithProviders(<Toolbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    });

    it('Export trigger is disabled when hasValidDiagram is false', () => {
      renderWithProviders(<Toolbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Export/i })).toBeDisabled();
    });

    it('Export trigger is enabled when hasValidDiagram is true', () => {
      renderWithProviders(<Toolbar {...defaultProps} json={VALID_JSON} hasValidDiagram={true} />);
      expect(screen.getByRole('button', { name: /Export/i })).toBeEnabled();
    });

    it('shows export options when dropdown is opened', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Toolbar {...defaultProps} json={VALID_JSON} hasValidDiagram={true} />);

      await user.click(screen.getByRole('button', { name: /Export/i }));

      expect(screen.getByRole('menuitem', { name: /Export TOON/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Export JSON/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Export SVG/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Export Mermaid/i })).toBeInTheDocument();
    });

    it('closes dropdown after selecting an export option', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Toolbar {...defaultProps} json={VALID_JSON} hasValidDiagram={true} />);

      await user.click(screen.getByRole('button', { name: /Export/i }));
      await user.click(screen.getByRole('menuitem', { name: /Export JSON/i }));

      expect(screen.queryByRole('menuitem', { name: /Export JSON/i })).not.toBeInTheDocument();
    });
  });

  describe('Import button', () => {
    it('renders Import button', () => {
      renderWithProviders(<Toolbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Import/i })).toBeInTheDocument();
    });
  });

  describe('Share button', () => {
    it('renders Share button', () => {
      renderWithProviders(<Toolbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Share/i })).toBeInTheDocument();
    });

    it('is disabled when hasValidDiagram is false', () => {
      renderWithProviders(<Toolbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Share/i })).toBeDisabled();
    });

    it('is enabled when hasValidDiagram is true', () => {
      renderWithProviders(<Toolbar {...defaultProps} hasValidDiagram={true} json={VALID_JSON} />);
      expect(screen.getByRole('button', { name: /Share/i })).toBeEnabled();
    });

    it('calls onShare when clicked', async () => {
      const user = userEvent.setup();
      const onShare = vi.fn();

      renderWithProviders(
        <Toolbar {...defaultProps} hasValidDiagram={true} json={VALID_JSON} onShare={onShare} />,
      );

      await user.click(screen.getByRole('button', { name: /Share/i }));
      expect(onShare).toHaveBeenCalledTimes(1);
    });

    it('shows "Copied!" when shareStatus is copied', () => {
      renderWithProviders(
        <Toolbar {...defaultProps} hasValidDiagram={true} json={VALID_JSON} shareStatus="copied" />,
      );
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  describe('Add dropdown', () => {
    it('renders + Add dropdown trigger', () => {
      renderWithProviders(<Toolbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument();
    });

    it('shows add options when dropdown is opened', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Toolbar {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Add/i }));

      expect(screen.getByRole('menuitem', { name: /\+ Entity/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /\+ Relationship/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /\+ Use Case/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /\+ Endpoint/i })).toBeInTheDocument();
    });

    it('+ Relationship is disabled when fewer than 2 entities', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Toolbar {...defaultProps} entities={[]} />);

      await user.click(screen.getByRole('button', { name: /Add/i }));
      expect(screen.getByRole('menuitem', { name: /\+ Relationship/i })).toBeDisabled();
    });

    it('+ Relationship is enabled when 2 or more entities', async () => {
      const user = userEvent.setup();
      const entities = [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ];
      renderWithProviders(<Toolbar {...defaultProps} entities={entities} />);

      await user.click(screen.getByRole('button', { name: /Add/i }));
      expect(screen.getByRole('menuitem', { name: /\+ Relationship/i })).toBeEnabled();
    });

    it('+ Use Case is disabled when no entities', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Toolbar {...defaultProps} entities={[]} />);

      await user.click(screen.getByRole('button', { name: /Add/i }));
      expect(screen.getByRole('menuitem', { name: /\+ Use Case/i })).toBeDisabled();
    });

    it('closes dropdown after selecting an item', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Toolbar {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Add/i }));
      await user.click(screen.getByRole('menuitem', { name: /\+ Entity/i }));

      expect(screen.queryByRole('menuitem', { name: /\+ Entity/i })).not.toBeInTheDocument();
    });
  });
});
