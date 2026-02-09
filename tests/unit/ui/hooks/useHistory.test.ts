import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHistory } from '../../../../src/ui/hooks/useHistory'

describe('useHistory', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value as current value', () => {
    const { result } = renderHook(() => useHistory('initial'))
    expect(result.current.value).toBe('initial')
  })

  it('after setValue, returns new value', () => {
    const { result } = renderHook(() => useHistory('initial'))
    act(() => result.current.setValue('changed', true))
    expect(result.current.value).toBe('changed')
  })

  it('after setValue + undo, returns previous value', () => {
    const { result } = renderHook(() => useHistory('initial'))
    act(() => result.current.setValue('changed', true))
    act(() => result.current.undo())
    expect(result.current.value).toBe('initial')
  })

  it('after undo + redo, returns the value before undo', () => {
    const { result } = renderHook(() => useHistory('initial'))
    act(() => result.current.setValue('changed', true))
    act(() => result.current.undo())
    act(() => result.current.redo())
    expect(result.current.value).toBe('changed')
  })

  it('canUndo is false initially, true after a change', () => {
    const { result } = renderHook(() => useHistory('initial'))
    expect(result.current.canUndo).toBe(false)

    act(() => result.current.setValue('changed', true))
    expect(result.current.canUndo).toBe(true)
  })

  it('canRedo is false initially, true after undo, false after new change', () => {
    const { result } = renderHook(() => useHistory('initial'))
    expect(result.current.canRedo).toBe(false)

    act(() => result.current.setValue('changed', true))
    act(() => result.current.undo())
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.setValue('new value', true))
    expect(result.current.canRedo).toBe(false)
  })

  it('debounced: rapid setValue calls followed by undo reverts to value before the burst', () => {
    const { result } = renderHook(() => useHistory('initial', { debounceMs: 500 }))

    // Rapid changes without immediate flag
    act(() => result.current.setValue('a'))
    act(() => result.current.setValue('b'))
    act(() => result.current.setValue('c'))

    // Flush the debounce timer
    act(() => { vi.advanceTimersByTime(600) })

    expect(result.current.value).toBe('c')

    // Undo should go back to initial, not to 'a' or 'b'
    act(() => result.current.undo())
    expect(result.current.value).toBe('initial')
  })

  it('immediate mode: setValue(x, true) creates a snapshot immediately', () => {
    const { result } = renderHook(() => useHistory('initial'))

    act(() => result.current.setValue('first', true))
    act(() => result.current.setValue('second', true))

    act(() => result.current.undo())
    expect(result.current.value).toBe('first')

    act(() => result.current.undo())
    expect(result.current.value).toBe('initial')
  })

  it('history capped at maxSize — oldest entries discarded', () => {
    const { result } = renderHook(() => useHistory('initial', { maxSize: 3 }))

    act(() => result.current.setValue('a', true))
    act(() => result.current.setValue('b', true))
    act(() => result.current.setValue('c', true))
    act(() => result.current.setValue('d', true))

    // Should be able to undo 3 times (maxSize), not 4
    act(() => result.current.undo())
    expect(result.current.value).toBe('c')

    act(() => result.current.undo())
    expect(result.current.value).toBe('b')

    act(() => result.current.undo())
    expect(result.current.value).toBe('a')

    // Can't undo further (initial was dropped)
    act(() => result.current.undo())
    expect(result.current.value).toBe('a')
  })

  it('redo stack cleared when new edit happens after undo', () => {
    const { result } = renderHook(() => useHistory('initial'))

    act(() => result.current.setValue('first', true))
    act(() => result.current.undo())
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.setValue('branch', true))
    expect(result.current.canRedo).toBe(false)
  })
})
