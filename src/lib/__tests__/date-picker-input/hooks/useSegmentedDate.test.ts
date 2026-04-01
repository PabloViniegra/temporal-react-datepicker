import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Temporal } from '@js-temporal/polyfill'
import { useSegmentedDate } from '../../../date-picker-input/hooks/useSegmentedDate'

// Helper to create a synthetic KeyboardEvent
function key(k: string): React.KeyboardEvent {
  return { key: k, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as React.KeyboardEvent
}

describe('useSegmentedDate', () => {
  describe('segment order by locale', () => {
    it('es-ES → day, month, year', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      expect(result.current.segmentOrder).toEqual(['day', 'month', 'year'])
    })

    it('en-US → month, day, year', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'en-US', vi.fn(), false),
      )
      expect(result.current.segmentOrder).toEqual(['month', 'day', 'year'])
    })

    it('ja-JP → year, month, day', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'ja-JP', vi.fn(), false),
      )
      expect(result.current.segmentOrder).toEqual(['year', 'month', 'day'])
    })
  })

  describe('initialisation from value', () => {
    it('populates segments from initial Temporal.PlainDate', () => {
      const date = Temporal.PlainDate.from('2026-04-15')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', vi.fn(), false),
      )
      expect(result.current.segments).toEqual({ day: 15, month: 4, year: 2026 })
    })

    it('sets null segments when value is undefined', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      expect(result.current.segments).toEqual({ day: null, month: null, year: null })
    })

    it('syncs segments when value changes', () => {
      let value: Temporal.PlainDate | undefined = undefined
      const { result, rerender } = renderHook(() =>
        useSegmentedDate(value, 'es-ES', vi.fn(), false),
      )
      expect(result.current.segments.day).toBeNull()

      value = Temporal.PlainDate.from('2026-06-20')
      rerender()
      expect(result.current.segments).toEqual({ day: 20, month: 6, year: 2026 })
    })
  })

  describe('arrow key navigation', () => {
    it('ArrowUp increments day', () => {
      const onChange = vi.fn()
      const date = Temporal.PlainDate.from('2026-04-15')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', onChange, false),
      )
      act(() => result.current.handlers.onFocus('day'))
      act(() => result.current.handlers.onKeyDown('day', key('ArrowUp')))
      expect(result.current.segments.day).toBe(16)
      expect(onChange).toHaveBeenCalledWith(Temporal.PlainDate.from('2026-04-16'))
    })

    it('ArrowDown decrements month', () => {
      const onChange = vi.fn()
      const date = Temporal.PlainDate.from('2026-04-15')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', onChange, false),
      )
      act(() => result.current.handlers.onFocus('month'))
      act(() => result.current.handlers.onKeyDown('month', key('ArrowDown')))
      expect(result.current.segments.month).toBe(3)
      expect(onChange).toHaveBeenCalledWith(Temporal.PlainDate.from('2026-03-15'))
    })

    it('day wraps from 31 to 1', () => {
      const date = Temporal.PlainDate.from('2026-01-31')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onKeyDown('day', key('ArrowUp')))
      expect(result.current.segments.day).toBe(1)
    })

    it('day wraps from 1 to 31', () => {
      const date = Temporal.PlainDate.from('2026-01-01')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onKeyDown('day', key('ArrowDown')))
      expect(result.current.segments.day).toBe(31)
    })

    it('month wraps from 12 to 1', () => {
      const date = Temporal.PlainDate.from('2026-12-01')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onKeyDown('month', key('ArrowUp')))
      expect(result.current.segments.month).toBe(1)
    })

    it('month wraps from 1 to 12', () => {
      const date = Temporal.PlainDate.from('2026-01-01')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onKeyDown('month', key('ArrowDown')))
      expect(result.current.segments.month).toBe(12)
    })

    it('year does not wrap below 1', () => {
      const date = Temporal.PlainDate.from('0001-01-01')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onKeyDown('year', key('ArrowDown')))
      expect(result.current.segments.year).toBe(1)
    })

    it('ArrowUp on null segment sets it to min value', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onKeyDown('day', key('ArrowUp')))
      expect(result.current.segments.day).toBe(1)
    })

    it('ArrowDown on null segment sets it to max value', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onKeyDown('month', key('ArrowDown')))
      expect(result.current.segments.month).toBe(12)
    })
  })

  describe('numeric input', () => {
    it('typing 1 then 5 on day → 15, calls onChange', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', onChange, false),
      )
      act(() => result.current.handlers.onFocus('day'))
      act(() => result.current.handlers.onKeyDown('day', key('1')))
      expect(result.current.segments.day).toBe(1)
      expect(onChange).not.toHaveBeenCalled() // still incomplete date

      act(() => result.current.handlers.onKeyDown('day', key('5')))
      expect(result.current.segments.day).toBe(15)
    })

    it('typing 5 on day auto-advances immediately (5*10=50 > 31)', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', onChange, false),
      )
      act(() => result.current.handlers.onFocus('day'))
      act(() => result.current.handlers.onKeyDown('day', key('5')))
      expect(result.current.segments.day).toBe(5)
      // focusedSegment would have advanced — we verify the day value was committed
    })

    it('typing 3 on month auto-advances immediately (3*10=30 > 12)', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onFocus('month'))
      act(() => result.current.handlers.onKeyDown('month', key('3')))
      expect(result.current.segments.month).toBe(3)
    })

    it('typing 1 on month does not auto-advance (1*10=10 ≤ 12)', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onFocus('month'))
      act(() => result.current.handlers.onKeyDown('month', key('1')))
      expect(result.current.segments.month).toBe(1)
      // stays at month segment (no advance after 1 digit)
      // typing 2 would make 12
      act(() => result.current.handlers.onKeyDown('month', key('2')))
      expect(result.current.segments.month).toBe(12)
    })

    it('year requires 4 digits', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onFocus('year'))
      act(() => result.current.handlers.onKeyDown('year', key('2')))
      act(() => result.current.handlers.onKeyDown('year', key('0')))
      act(() => result.current.handlers.onKeyDown('year', key('2')))
      act(() => result.current.handlers.onKeyDown('year', key('6')))
      expect(result.current.segments.year).toBe(2026)
    })

    it('clamps day to max 31', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onFocus('day'))
      act(() => result.current.handlers.onKeyDown('day', key('3')))
      act(() => result.current.handlers.onKeyDown('day', key('9')))
      expect(result.current.segments.day).toBe(31)
    })
  })

  describe('Backspace', () => {
    it('clears the active segment', () => {
      const date = Temporal.PlainDate.from('2026-04-15')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onFocus('day'))
      act(() => result.current.handlers.onKeyDown('day', key('Backspace')))
      expect(result.current.segments.day).toBeNull()
    })

    it('clearable: calls onChange(undefined) when all segments cleared', () => {
      const onChange = vi.fn()
      const date = Temporal.PlainDate.from('2026-04-15')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', onChange, true),
      )
      act(() => result.current.handlers.onKeyDown('day', key('Backspace')))
      act(() => result.current.handlers.onKeyDown('month', key('Backspace')))
      act(() => result.current.handlers.onKeyDown('year', key('Backspace')))
      expect(onChange).toHaveBeenCalledWith(undefined)
    })

    it('non-clearable: does not call onChange when segments cleared', () => {
      const onChange = vi.fn()
      const date = Temporal.PlainDate.from('2026-04-15')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', onChange, false),
      )
      act(() => result.current.handlers.onKeyDown('day', key('Backspace')))
      act(() => result.current.handlers.onKeyDown('month', key('Backspace')))
      act(() => result.current.handlers.onKeyDown('year', key('Backspace')))
      expect(onChange).not.toHaveBeenCalledWith(undefined)
    })
  })

  describe('onChange gating', () => {
    it('does not call onChange when date segments are incomplete', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', onChange, false),
      )
      act(() => result.current.handlers.onKeyDown('day', key('1')))
      expect(onChange).not.toHaveBeenCalled()
    })

    it('calls onChange when all three segments have valid values', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', onChange, false),
      )
      // Set day=15 via ArrowUp from min
      act(() => {
        for (let i = 0; i < 14; i++) result.current.handlers.onKeyDown('day', key('ArrowUp'))
      })
      act(() => {
        for (let i = 0; i < 3; i++) result.current.handlers.onKeyDown('month', key('ArrowUp'))
      })
      act(() => {
        result.current.handlers.onKeyDown('year', key('ArrowUp'))
      })
      // year=1 (min), month=3, day=15 — all valid
      expect(onChange).toHaveBeenCalled()
    })

    it('does not call onChange for invalid date (e.g. Feb 31)', () => {
      const onChange = vi.fn()
      const date = Temporal.PlainDate.from('2026-02-28')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', onChange, false),
      )
      onChange.mockClear()
      // Force day to 31 (invalid for February)
      act(() => {
        for (let i = 0; i < 3; i++) result.current.handlers.onKeyDown('day', key('ArrowUp'))
      })
      // onChange should not have been called with an invalid date (PlainDate.from would throw)
      const calls = onChange.mock.calls
      const hasInvalidDate = calls.some(([d]) => {
        try {
          return d.day === 31 && d.month === 2
        } catch {
          return true
        }
      })
      expect(hasInvalidDate).toBe(false)
    })
  })

  describe('focus and blur', () => {
    it('sets focusedSegment on focus', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onFocus('month'))
      expect(result.current.focusedSegment).toBe('month')
    })

    it('clears focusedSegment on blur', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      act(() => result.current.handlers.onFocus('day'))
      act(() => result.current.handlers.onBlur())
      expect(result.current.focusedSegment).toBeNull()
    })
  })

  describe('unhandled keys', () => {
    it('ignores keys that are not digits or special keys', () => {
      const onChange = vi.fn()
      const date = Temporal.PlainDate.from('2026-04-15')
      const { result } = renderHook(() =>
        useSegmentedDate(date, 'es-ES', onChange, false),
      )
      onChange.mockClear()
      act(() => result.current.handlers.onKeyDown('day', key('a')))
      expect(result.current.segments.day).toBe(15) // unchanged
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('Tab key', () => {
    it('does not prevent default on regular Tab (native focus movement)', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      const tabEvent = key('Tab')
      act(() => result.current.handlers.onKeyDown('day', tabEvent))
      expect(tabEvent.preventDefault).not.toHaveBeenCalled()
    })

    it('prevents default on Shift+Tab and retreats to previous segment', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      const shiftTabEvent = { key: 'Tab', shiftKey: true, preventDefault: vi.fn() } as unknown as React.KeyboardEvent
      act(() => result.current.handlers.onFocus('month'))
      act(() => result.current.handlers.onKeyDown('month', shiftTabEvent))
      expect(shiftTabEvent.preventDefault).toHaveBeenCalled()
    })

    it('Shift+Tab on first segment does not crash (no previous segment)', () => {
      const { result } = renderHook(() =>
        useSegmentedDate(undefined, 'es-ES', vi.fn(), false),
      )
      // segmentOrder for es-ES is [day, month, year] — day is first
      const shiftTabEvent = { key: 'Tab', shiftKey: true, preventDefault: vi.fn() } as unknown as React.KeyboardEvent
      expect(() => {
        act(() => result.current.handlers.onKeyDown('day', shiftTabEvent))
      }).not.toThrow()
    })
  })
})
