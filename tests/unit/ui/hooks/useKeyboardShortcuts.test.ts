import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from '../../../../src/ui/hooks/useKeyboardShortcuts'

function createHandlers() {
  return {
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onPrettify: vi.fn(),
    onExport: vi.fn(),
    onFitToView: vi.fn(),
  }
}

function dispatch(key: string, opts: Partial<KeyboardEventInit> = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))
}

describe('useKeyboardShortcuts', () => {
  it('Ctrl+Z dispatched → onUndo called', () => {
    const handlers = createHandlers()
    renderHook(() => useKeyboardShortcuts(handlers))

    dispatch('z', { ctrlKey: true })
    expect(handlers.onUndo).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+Shift+Z dispatched → onRedo called', () => {
    const handlers = createHandlers()
    renderHook(() => useKeyboardShortcuts(handlers))

    dispatch('Z', { ctrlKey: true, shiftKey: true })
    expect(handlers.onRedo).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+Y dispatched → onRedo called', () => {
    const handlers = createHandlers()
    renderHook(() => useKeyboardShortcuts(handlers))

    dispatch('y', { ctrlKey: true })
    expect(handlers.onRedo).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+Shift+F dispatched → onPrettify called', () => {
    const handlers = createHandlers()
    renderHook(() => useKeyboardShortcuts(handlers))

    dispatch('F', { ctrlKey: true, shiftKey: true })
    expect(handlers.onPrettify).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+E dispatched → onExport called', () => {
    const handlers = createHandlers()
    renderHook(() => useKeyboardShortcuts(handlers))

    dispatch('e', { ctrlKey: true })
    expect(handlers.onExport).toHaveBeenCalledTimes(1)
  })

  it('Escape dispatched → onFitToView called', () => {
    const handlers = createHandlers()
    renderHook(() => useKeyboardShortcuts(handlers))

    dispatch('Escape')
    expect(handlers.onFitToView).toHaveBeenCalledTimes(1)
  })

  it('unrelated keys → no handler called', () => {
    const handlers = createHandlers()
    renderHook(() => useKeyboardShortcuts(handlers))

    dispatch('a')
    dispatch('Enter')
    dispatch('Tab')

    expect(handlers.onUndo).not.toHaveBeenCalled()
    expect(handlers.onRedo).not.toHaveBeenCalled()
    expect(handlers.onPrettify).not.toHaveBeenCalled()
    expect(handlers.onExport).not.toHaveBeenCalled()
    expect(handlers.onFitToView).not.toHaveBeenCalled()
  })

  it('Meta key works as Ctrl equivalent (macOS)', () => {
    const handlers = createHandlers()
    renderHook(() => useKeyboardShortcuts(handlers))

    dispatch('z', { metaKey: true })
    expect(handlers.onUndo).toHaveBeenCalledTimes(1)
  })
})
