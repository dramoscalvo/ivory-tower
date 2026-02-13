import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Footer } from '../../../../../src/ui/components/Footer/Footer';
import { i18n } from '../../../../../src/ui/i18n/i18n';

describe('Footer', () => {
  beforeEach(async () => {
    localStorage.setItem('locale', 'en');
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  afterEach(async () => {
    localStorage.setItem('locale', 'en');
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('toggles language between EN and ES', async () => {
    const user = userEvent.setup();
    render(<Footer theme="dark" onToggleTheme={() => {}} />);

    expect(screen.getByRole('button', { name: /Switch language to ES/i })).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Switch language to ES/i }));
    });

    expect(screen.getByText('ES')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cambiar idioma a EN/i })).toBeInTheDocument();
  });
});
