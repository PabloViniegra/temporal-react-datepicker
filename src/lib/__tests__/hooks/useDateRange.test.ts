import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Temporal } from '@js-temporal/polyfill'
import { useDateRange } from '../../hooks/useDateRange'

const d = (s: string) => Temporal.PlainDate.from(s)
const expectDate = (year: number, month: number, day: number) =>
  expect.objectContaining({ year, month, day })

describe('useDateRange', () => {
  describe('handleRangeClick', () => {
    it('first click starts a new range with end=null', () => {
      const { result } = renderHook(() => useDateRange())
      const onChange = vi.fn()
      act(() => {
        result.current.handleRangeClick(d('2024-03-15'), undefined, onChange)
      })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ start: expectDate(2024, 3, 15), end: null }),
      )
    })

    it('second click completes the range in forward order', () => {
      const { result } = renderHook(() => useDateRange())
      const onChange = vi.fn()
      act(() => {
        result.current.handleRangeClick(
          d('2024-03-20'),
          { start: d('2024-03-10'), end: null },
          onChange,
        )
      })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expectDate(2024, 3, 10),
          end: expectDate(2024, 3, 20),
        }),
      )
    })

    it('second click before start swaps to correct chronological order', () => {
      const { result } = renderHook(() => useDateRange())
      const onChange = vi.fn()
      act(() => {
        result.current.handleRangeClick(
          d('2024-03-05'),
          { start: d('2024-03-15'), end: null },
          onChange,
        )
      })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expectDate(2024, 3, 5),
          end: expectDate(2024, 3, 15),
        }),
      )
    })

    it('clicking a disabled date does nothing', () => {
      const isDisabled = (date: Temporal.PlainDate) =>
        Temporal.PlainDate.compare(date, d('2024-03-15')) === 0
      const { result } = renderHook(() => useDateRange(isDisabled))
      const onChange = vi.fn()
      act(() => {
        result.current.handleRangeClick(d('2024-03-15'), undefined, onChange)
      })
      expect(onChange).not.toHaveBeenCalled()
    })

    it('rejects range that spans a disabled date', () => {
      const isDisabled = (date: Temporal.PlainDate) =>
        Temporal.PlainDate.compare(date, d('2024-03-15')) === 0
      const { result } = renderHook(() => useDateRange(isDisabled))
      const onChange = vi.fn()
      act(() => {
        result.current.handleRangeClick(
          d('2024-03-20'),
          { start: d('2024-03-10'), end: null },
          onChange,
        )
      })
      expect(onChange).not.toHaveBeenCalled()
    })

    it('clicking when range is complete starts a new range', () => {
      const { result } = renderHook(() => useDateRange())
      const onChange = vi.fn()
      act(() => {
        result.current.handleRangeClick(
          d('2024-03-25'),
          { start: d('2024-03-10'), end: d('2024-03-20') },
          onChange,
        )
      })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ start: expectDate(2024, 3, 25), end: null }),
      )
    })

    it('clicking the same date as start completes a zero-length range (hits [b,a] branch)', () => {
      const isDisabled = (date: Temporal.PlainDate) => date.day === 25
      const { result } = renderHook(() => useDateRange(isDisabled))
      const onChange = vi.fn()
      act(() => {
        result.current.handleRangeClick(
          d('2024-03-15'),
          { start: d('2024-03-15'), end: null },
          onChange,
        )
      })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expectDate(2024, 3, 15),
          end: expectDate(2024, 3, 15),
        }),
      )
    })

    it('completes range when disabled date is outside the span (hasDisabledBetween returns false)', () => {
      const isDisabled = (date: Temporal.PlainDate) => date.day === 25
      const { result } = renderHook(() => useDateRange(isDisabled))
      const onChange = vi.fn()
      act(() => {
        result.current.handleRangeClick(
          d('2024-03-20'),
          { start: d('2024-03-10'), end: null },
          onChange,
        )
      })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expectDate(2024, 3, 10),
          end: expectDate(2024, 3, 20),
        }),
      )
    })
  })

  describe('getDayRangeState', () => {
    it('returns all false when value is undefined', () => {
      const { result } = renderHook(() => useDateRange())
      const state = result.current.getDayRangeState(d('2024-03-15'), undefined)
      expect(state).toEqual({
        isRangeStart: false,
        isRangeEnd: false,
        inRange: false,
        isPreview: false,
      })
    })

    it('correctly identifies start, end, in-range, and outside for a complete range', () => {
      const { result } = renderHook(() => useDateRange())
      const value = { start: d('2024-03-10'), end: d('2024-03-20') }

      expect(result.current.getDayRangeState(d('2024-03-10'), value).isRangeStart).toBe(true)
      expect(result.current.getDayRangeState(d('2024-03-20'), value).isRangeEnd).toBe(true)
      expect(result.current.getDayRangeState(d('2024-03-15'), value).inRange).toBe(true)
      expect(result.current.getDayRangeState(d('2024-03-09'), value).inRange).toBe(false)
      expect(result.current.getDayRangeState(d('2024-03-21'), value).inRange).toBe(false)
    })

    it('hover preview without isDateDisabled shows in-range days (getEffectiveHover returns hoverDate directly)', () => {
      const { result } = renderHook(() => useDateRange())
      act(() => result.current.setHoverDate(d('2024-03-20')))

      const value = { start: d('2024-03-15'), end: null }
      const state = result.current.getDayRangeState(d('2024-03-18'), value)
      expect(state.inRange).toBe(true)
      expect(state.isPreview).toBe(true)
    })

    it('clipHoverToDisabled: clips hover to last non-disabled date (forward)', () => {
      // disabled on day 18 — hover at 20 should be clipped to 17
      const isDisabled = (date: Temporal.PlainDate) => date.day === 18
      const { result } = renderHook(() => useDateRange(isDisabled))
      act(() => result.current.setHoverDate(d('2024-03-20')))

      const value = { start: d('2024-03-15'), end: null }
      expect(result.current.getDayRangeState(d('2024-03-17'), value).isRangeEnd).toBe(true)
      expect(result.current.getDayRangeState(d('2024-03-19'), value).inRange).toBe(false)
    })

    it('clipHoverToDisabled: clips hover backward when hovering before start', () => {
      // disabled on day 12 — hover at 05 should be clipped to 13
      const isDisabled = (date: Temporal.PlainDate) => date.day === 12
      const { result } = renderHook(() => useDateRange(isDisabled))
      act(() => result.current.setHoverDate(d('2024-03-05')))

      const value = { start: d('2024-03-15'), end: null }
      // effectiveHover=13 → previewStart=13, previewEnd=15
      expect(result.current.getDayRangeState(d('2024-03-13'), value).isRangeStart).toBe(true)
      expect(result.current.getDayRangeState(d('2024-03-12'), value).inRange).toBe(false)
    })

    it('clipHoverToDisabled: reaches hover exactly when no disabled date blocks the path', () => {
      // disabled far away — hover at 20 should reach 20
      const isDisabled = (date: Temporal.PlainDate) => date.day === 28
      const { result } = renderHook(() => useDateRange(isDisabled))
      act(() => result.current.setHoverDate(d('2024-03-20')))

      const value = { start: d('2024-03-15'), end: null }
      expect(result.current.getDayRangeState(d('2024-03-20'), value).isRangeEnd).toBe(true)
    })

    it('partial range: marks start only, no in-range without hover', () => {
      const { result } = renderHook(() => useDateRange())
      const value = { start: d('2024-03-15'), end: null }

      const startState = result.current.getDayRangeState(d('2024-03-15'), value)
      expect(startState.isRangeStart).toBe(true)
      expect(startState.inRange).toBe(false)

      const otherState = result.current.getDayRangeState(d('2024-03-20'), value)
      expect(otherState.isRangeStart).toBe(false)
      expect(otherState.inRange).toBe(false)
    })
  })
})
