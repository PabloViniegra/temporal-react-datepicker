import { useState, useRef, useEffect } from 'react'
import { Temporal } from '@js-temporal/polyfill'

// ── Types ─────────────────────────────────────────────────────────────────────

const SEGMENT = {
  DAY: 'day',
  MONTH: 'month',
  YEAR: 'year',
} as const

type Segment = (typeof SEGMENT)[keyof typeof SEGMENT]

interface SegmentValues {
  day: number | null
  month: number | null
  year: number | null
}

interface SegmentHandlers {
  onKeyDown: (segment: Segment, e: React.KeyboardEvent) => void
  onFocus: (segment: Segment) => void
  onBlur: () => void
}

interface UseSegmentedDateReturn {
  segments: SegmentValues
  setSegments: (values: SegmentValues) => void
  segmentOrder: Segment[]
  separator: string
  focusedSegment: Segment | null
  segmentRefs: Record<Segment, React.RefObject<HTMLSpanElement | null>>
  handlers: SegmentHandlers
}

// ── Locale helpers ────────────────────────────────────────────────────────────

function getSegmentOrder(locale: string): Segment[] {
  // Use a fixed reference date only for Intl format detection — not for date logic
  const referenceDate = new Date(2026, 0, 15)
  const parts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(referenceDate)

  return parts
    .filter(p => (SEGMENT as Record<string, string>)[p.type.toUpperCase()] !== undefined)
    .map(p => p.type as Segment)
}

function getSegmentSeparator(locale: string): string {
  const referenceDate = new Date(2026, 0, 15)
  const parts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(referenceDate)

  const literal = parts.find(p => p.type === 'literal')
  /* v8 ignore next */
  return literal?.value.trim() ?? '/'
}

// ── Segment arithmetic ────────────────────────────────────────────────────────

const SEGMENT_MIN: Record<Segment, number> = { day: 1, month: 1, year: 1 }
const SEGMENT_MAX: Record<Segment, number> = { day: 31, month: 12, year: 9999 }

function clampSegment(segment: Segment, value: number): number {
  return Math.max(SEGMENT_MIN[segment], Math.min(SEGMENT_MAX[segment], value))
}

function wrapSegment(segment: Segment, value: number): number {
  if (segment === 'year') return clampSegment(segment, value)
  const min = SEGMENT_MIN[segment]
  const max = SEGMENT_MAX[segment]
  if (value > max) return min
  if (value < min) return max
  return value
}

// Auto-advance after 1 digit: when no 2-digit value starting with this digit can be valid
function shouldAutoAdvance(segment: Segment, digit: number): boolean {
  if (segment === 'day') return digit * 10 > SEGMENT_MAX.day   // 4-9 → advance
  if (segment === 'month') return digit * 10 > SEGMENT_MAX.month // 2-9 → advance
  return false // year: always wait for full 4 digits
}

// ── Hook ──────────────────────────────────────────────────────────────────────

function useSegmentedDate(
  value: Temporal.PlainDate | undefined,
  locale: string,
  onChange: ((date: Temporal.PlainDate) => void) | ((date: Temporal.PlainDate | undefined) => void),
  clearable: boolean,
): UseSegmentedDateReturn {
  const segmentOrder = getSegmentOrder(locale)
  const separator = getSegmentSeparator(locale)

  const [segments, setSegments] = useState<SegmentValues>(() =>
    value ? { day: value.day, month: value.month, year: value.year } : { day: null, month: null, year: null },
  )
  const [focusedSegment, setFocusedSegment] = useState<Segment | null>(null)

  // digit buffer: tracks partial numeric input within the current segment
  const bufferRef = useRef<string>('')

  // Refs for each segment span (for programmatic focus)
  const segmentRefs: Record<Segment, React.RefObject<HTMLSpanElement | null>> = {
    day: useRef<HTMLSpanElement | null>(null),
    month: useRef<HTMLSpanElement | null>(null),
    year: useRef<HTMLSpanElement | null>(null),
  }

  // Sync external value → segments
  useEffect(() => {
    if (value) {
      setSegments({ day: value.day, month: value.month, year: value.year })
    } else {
      setSegments({ day: null, month: null, year: null })
    }
  }, [value])

  function focusSegment(segment: Segment) {
    bufferRef.current = ''
    segmentRefs[segment].current?.focus()
  }

  function advanceToNext(current: Segment) {
    const idx = segmentOrder.indexOf(current)
    if (idx < segmentOrder.length - 1) {
      focusSegment(segmentOrder[idx + 1])
    }
  }

  function retreatToPrev(current: Segment) {
    const idx = segmentOrder.indexOf(current)
    if (idx > 0) {
      focusSegment(segmentOrder[idx - 1])
    }
  }

  function commitValue(next: SegmentValues) {
    setSegments(next)
    if (next.day !== null && next.month !== null && next.year !== null) {
      try {
        const date = Temporal.PlainDate.from({
          day: next.day,
          month: next.month,
          year: next.year,
        })
        ;(onChange as (d: Temporal.PlainDate) => void)(date)
      } catch {
        // Invalid date (e.g. day 31 in February) — keep segments but don't call onChange
      }
    }
    /* v8 ignore start */
    else if (clearable && next.day === null && next.month === null && next.year === null) {
      ;(onChange as (d: Temporal.PlainDate | undefined) => void)(undefined)
    }
    /* v8 ignore stop */
  }

  function onKeyDown(segment: Segment, e: React.KeyboardEvent) {
    const current = segments[segment]

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = current === null ? SEGMENT_MIN[segment] : wrapSegment(segment, current + 1)
      commitValue({ ...segments, [segment]: next })
      bufferRef.current = ''
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = current === null ? SEGMENT_MAX[segment] : wrapSegment(segment, current - 1)
      commitValue({ ...segments, [segment]: next })
      bufferRef.current = ''
      return
    }

    if (e.key === 'Backspace') {
      e.preventDefault()
      bufferRef.current = ''
      const next = { ...segments, [segment]: null }
      setSegments(next)
      if (clearable && next.day === null && next.month === null && next.year === null) {
        ;(onChange as (d: Temporal.PlainDate | undefined) => void)(undefined)
      }
      return
    }

    if (e.key === 'Tab') {
      bufferRef.current = ''
      if (e.shiftKey) {
        e.preventDefault()
        retreatToPrev(segment)
      }
      // Regular Tab: allow native focus movement to next segment/out of component
      return
    }

    if (/^\d$/.test(e.key)) {
      e.preventDefault()
      const digit = parseInt(e.key, 10)
      const maxDigits = segment === 'year' ? 4 : 2
      const buffer = bufferRef.current + e.key

      if (buffer.length === 1 && shouldAutoAdvance(segment, digit)) {
        // Single digit that makes any 2-digit value impossible — commit immediately
        const val = clampSegment(segment, digit)
        bufferRef.current = ''
        const next = { ...segments, [segment]: val }
        commitValue(next)
        advanceToNext(segment)
        return
      }

      if (buffer.length >= maxDigits) {
        const val = clampSegment(segment, parseInt(buffer.slice(-maxDigits), 10))
        bufferRef.current = ''
        const next = { ...segments, [segment]: val }
        commitValue(next)
        advanceToNext(segment)
        return
      }

      bufferRef.current = buffer
      const val = clampSegment(segment, parseInt(buffer, 10))
      const next = { ...segments, [segment]: val }
      setSegments(next)
    }
  }

  function onFocus(segment: Segment) {
    bufferRef.current = ''
    setFocusedSegment(segment)
  }

  function onBlur() {
    bufferRef.current = ''
    setFocusedSegment(null)
  }

  return {
    segments,
    setSegments,
    segmentOrder,
    separator,
    focusedSegment,
    segmentRefs,
    handlers: { onKeyDown, onFocus, onBlur },
  }
}

export { useSegmentedDate, SEGMENT }
export type { Segment, SegmentValues, UseSegmentedDateReturn }
