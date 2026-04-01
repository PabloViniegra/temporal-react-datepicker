import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDatePickerPopover } from '../../../date-picker-input/hooks/useDatePickerPopover'

describe('useDatePickerPopover', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts closed', () => {
    const { result } = renderHook(() => useDatePickerPopover())
    expect(result.current.isOpen).toBe(false)
  })

  it('open() sets isOpen to true', () => {
    const { result } = renderHook(() => useDatePickerPopover())
    act(() => result.current.open())
    expect(result.current.isOpen).toBe(true)
  })

  it('close() sets isOpen to false', () => {
    const { result } = renderHook(() => useDatePickerPopover())
    act(() => result.current.open())
    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
  })

  it('close() returns focus to trigger button', () => {
    const { result } = renderHook(() => useDatePickerPopover())

    const mockFocus = vi.fn()
    const mockButton = { focus: mockFocus } as unknown as HTMLButtonElement
    ;(result.current.triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = mockButton

    act(() => result.current.open())
    act(() => result.current.close())
    expect(mockFocus).toHaveBeenCalled()
  })

  it('closes on mousedown outside popover and wrapper', () => {
    const { result } = renderHook(() => useDatePickerPopover())
    act(() => result.current.open())

    // Simulate click on external element (not inside popover or wrapper)
    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      document.dispatchEvent(event)
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('does not close on mousedown inside popover', () => {
    const { result } = renderHook(() => useDatePickerPopover())
    act(() => result.current.open())

    const popoverEl = document.createElement('div')
    const childEl = document.createElement('button')
    popoverEl.appendChild(childEl)
    ;(result.current.popoverRef as React.MutableRefObject<HTMLDivElement | null>).current = popoverEl

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      Object.defineProperty(event, 'target', { value: childEl })
      document.dispatchEvent(event)
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('does not close on mousedown inside input wrapper', () => {
    const { result } = renderHook(() => useDatePickerPopover())
    act(() => result.current.open())

    const wrapperEl = document.createElement('div')
    const childEl = document.createElement('span')
    wrapperEl.appendChild(childEl)
    ;(result.current.inputWrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = wrapperEl

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      Object.defineProperty(event, 'target', { value: childEl })
      document.dispatchEvent(event)
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('moves focus into popover when opened', () => {
    const { result } = renderHook(() => useDatePickerPopover())

    const mockFocus = vi.fn()
    const button = document.createElement('button')
    button.focus = mockFocus

    const popoverEl = document.createElement('div')
    popoverEl.appendChild(button)
    ;(result.current.popoverRef as React.MutableRefObject<HTMLDivElement | null>).current = popoverEl

    act(() => result.current.open())
    act(() => vi.runAllTimers())

    expect(mockFocus).toHaveBeenCalled()
  })

  it('does not add mousedown listener when closed', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const { result } = renderHook(() => useDatePickerPopover())
    // Initially closed — no listener added
    const listenersBefore = addSpy.mock.calls.filter(c => c[0] === 'mousedown').length

    // Close when already closed — no extra listener
    act(() => result.current.close())
    const listenersAfter = addSpy.mock.calls.filter(c => c[0] === 'mousedown').length
    expect(listenersAfter).toBe(listenersBefore)
  })

  it('exposes triggerRef, popoverRef, inputWrapperRef', () => {
    const { result } = renderHook(() => useDatePickerPopover())
    expect(result.current.triggerRef).toBeDefined()
    expect(result.current.popoverRef).toBeDefined()
    expect(result.current.inputWrapperRef).toBeDefined()
  })
})
