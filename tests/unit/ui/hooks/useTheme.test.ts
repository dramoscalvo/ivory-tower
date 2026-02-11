import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../../../../src/ui/hooks/useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('returns dark as default when no preference stored', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('returns stored preference from localStorage', () => {
    localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('toggleTheme switches from dark to light and back', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('after toggle, document has correct data-theme attribute', () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    act(() => result.current.toggleTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('after toggle, localStorage is updated', () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
