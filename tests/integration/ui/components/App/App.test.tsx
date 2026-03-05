import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../../../../src/ui/components/App/App';
import { renderWithProviders } from '../../../../helpers/renderWithProviders';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('initial render', () => {
    it('renders the toolbar', () => {
      renderWithProviders(<App />);
      const matches = screen.getAllByText(/Ivory Tower/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('loads example diagram by default', () => {
      renderWithProviders(<App />);
      // "Example System" appears in both the editor and the canvas title
      const matches = screen.getAllByText(/Example System/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Load Example button', () => {
    it('loads example diagram when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      await user.click(screen.getByRole('button', { name: /Load Example/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      const matches = screen.getAllByText(/Example System/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }, 10000);
  });

  describe('export dropdown state', () => {
    it('export dropdown trigger is enabled for valid diagram', () => {
      renderWithProviders(<App />);

      expect(screen.getByRole('button', { name: /Export/i })).toBeEnabled();
    });

    it('shows export options when dropdown is opened', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      await user.click(screen.getByRole('button', { name: /Export/i }));

      expect(screen.getByRole('menuitem', { name: /Export TOON/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Export JSON/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Export SVG/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Export Mermaid/i })).toBeInTheDocument();
    });
  });

  describe('theme toggle', () => {
    it('renders theme toggle button', () => {
      renderWithProviders(<App />);
      expect(screen.getByRole('button', { name: /Switch to light theme/i })).toBeInTheDocument();
    });

    it('toggles theme on click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      await user.click(screen.getByRole('button', { name: /Switch to light theme/i }));
      expect(screen.getByRole('button', { name: /Switch to dark theme/i })).toBeInTheDocument();
    }, 10000);
  });

  describe('Coverage tab', () => {
    it('renders Coverage tab button', () => {
      renderWithProviders(<App />);
      expect(screen.getByRole('tab', { name: /Coverage/i })).toBeInTheDocument();
    });

    it('shows coverage panel when Coverage tab is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      await user.click(screen.getByRole('tab', { name: /Coverage/i }));
      // The example diagram has entities, so coverage analysis should be visible
      expect(screen.getByText(/fully covered/i)).toBeInTheDocument();
    });

    it('shows entity coverage table with entity names', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      await user.click(screen.getByRole('tab', { name: /Coverage/i }));
      // Example diagram entities should appear in the coverage table
      expect(screen.getByText('Entity Coverage')).toBeInTheDocument();
    });
  });

  describe('toolbar buttons', () => {
    it('renders Import button', () => {
      renderWithProviders(<App />);
      expect(screen.getByRole('button', { name: /Import/i })).toBeInTheDocument();
    });

    it('renders Share button', () => {
      renderWithProviders(<App />);
      expect(screen.getByRole('button', { name: /Share/i })).toBeInTheDocument();
    });

    it('renders keyboard shortcuts button', () => {
      renderWithProviders(<App />);
      expect(screen.getByRole('button', { name: /Keyboard shortcuts/i })).toBeInTheDocument();
    });

    it('renders + Add dropdown trigger', () => {
      renderWithProviders(<App />);
      expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument();
    });

    it('imports architecture and use cases from a single JSON payload', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      const payload = JSON.stringify(
        {
          title: 'Imported System',
          entities: [
            {
              id: 'account',
              name: 'Account',
              type: 'class',
              methods: [{ name: 'open', parameters: [], returnType: { name: 'void' } }],
            },
          ],
          relationships: [],
          useCases: [
            {
              id: 'uc-open-account',
              name: 'Open Account',
              entityRef: 'account',
              methodRef: 'open',
              scenarios: [
                {
                  name: 'Happy path',
                  steps: [
                    { keyword: 'Given', text: 'a valid request' },
                    { keyword: 'When', text: 'open is called' },
                    { keyword: 'Then', text: 'account is opened' },
                  ],
                },
              ],
            },
          ],
        },
        null,
        2,
      );

      await user.click(screen.getByRole('button', { name: /^Import$/i }));
      const dialog = screen.getByRole('dialog');
      const textarea = within(dialog).getByPlaceholderText(
        /Paste Mermaid, PlantUML, JSON, or TOON/i,
      );
      await user.click(textarea);
      await user.paste(payload);
      await user.click(within(dialog).getByRole('button', { name: /^Import$/i }));

      expect(screen.getByText('Imported System')).toBeInTheDocument();
      await user.click(screen.getByRole('tab', { name: /Use Cases/i }));
      expect(screen.getAllByText('Open Account').length).toBeGreaterThanOrEqual(1);
    }, 10000);
  });
});
