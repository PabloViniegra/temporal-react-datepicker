import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJumpNav } from '../../hooks/useJumpNav'

describe('useJumpNav', () => {
  it('starts on calendar view', () => {
    const { result } = renderHook(() => useJumpNav())
    expect(result.current.view).toBe('calendar')
  })

  it('switches to month view', () => {
    const { result } = renderHook(() => useJumpNav())
    act(() => result.current.setView('month'))
    expect(result.current.view).toBe('month')
  })

  it('switches to year view', () => {
    const { result } = renderHook(() => useJumpNav())
    act(() => result.current.setView('year'))
    expect(result.current.view).toBe('year')
  })

  it('returns to calendar from year view', () => {
    const { result } = renderHook(() => useJumpNav())
    act(() => result.current.setView('year'))
    act(() => result.current.setView('calendar'))
    expect(result.current.view).toBe('calendar')
  })
})
