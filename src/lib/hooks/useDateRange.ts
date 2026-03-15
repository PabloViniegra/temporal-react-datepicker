import { useState } from 'react'
import { Temporal } from '@js-temporal/polyfill'

interface DateRange {
  start: Temporal.PlainDate
  end: Temporal.PlainDate | null
}

interface RangeDayState {
  isRangeStart: boolean
  isRangeEnd: boolean
  inRange: boolean
  isPreview: boolean
}

function hasDisabledBetween(
  a: Temporal.PlainDate,
  b: Temporal.PlainDate,
  isDateDisabled: (date: Temporal.PlainDate) => boolean,
): boolean {
  const forward = Temporal.PlainDate.compare(a, b) < 0
  const [start, end] = forward ? [a, b] : [b, a]
  let d = start.add({ days: 1 })
  while (Temporal.PlainDate.compare(d, end) < 0) {
    if (isDateDisabled(d)) return true
    d = d.add({ days: 1 })
  }
  return false
}

function clipHoverToDisabled(
  start: Temporal.PlainDate,
  hover: Temporal.PlainDate,
  isDateDisabled: (date: Temporal.PlainDate) => boolean,
): Temporal.PlainDate {
  const forward = Temporal.PlainDate.compare(hover, start) > 0
  let prev = start
  for (let i = 1; ; i++) {
    const d = start.add({ days: forward ? i : -i })
    if (isDateDisabled(d)) return prev
    if (Temporal.PlainDate.compare(d, hover) === 0) return hover
    prev = d
  }
}

function useDateRange(isDateDisabled?: (date: Temporal.PlainDate) => boolean) {
  const [hoverDate, setHoverDate] = useState<Temporal.PlainDate | null>(null)

  function handleRangeClick(
    date: Temporal.PlainDate,
    value: DateRange | undefined,
    onChange: (range: DateRange) => void,
  ): void {
    if (isDateDisabled?.(date)) return

    // First click, or range already complete → start a new range
    if (!value || value.end !== null) {
      onChange({ start: date, end: null })
      return
    }

    // Second click — normalise order and check for disabled dates crossing the range
    const [rangeStart, rangeEnd] =
      Temporal.PlainDate.compare(date, value.start) >= 0
        ? [value.start, date]
        : [date, value.start]

    if (isDateDisabled && hasDisabledBetween(rangeStart, rangeEnd, isDateDisabled)) return

    onChange({ start: rangeStart, end: rangeEnd })
  }

  function getEffectiveHover(start: Temporal.PlainDate): Temporal.PlainDate | null {
    if (!hoverDate) return null
    if (!isDateDisabled) return hoverDate
    return clipHoverToDisabled(start, hoverDate, isDateDisabled)
  }

  function getDayRangeState(date: Temporal.PlainDate, value: DateRange | undefined): RangeDayState {
    if (!value) return { isRangeStart: false, isRangeEnd: false, inRange: false, isPreview: false }

    // Confirmed range (both endpoints set)
    if (value.end !== null) {
      const isRangeStart = Temporal.PlainDate.compare(date, value.start) === 0
      const isRangeEnd = Temporal.PlainDate.compare(date, value.end) === 0
      const inRange =
        Temporal.PlainDate.compare(date, value.start) > 0 &&
        Temporal.PlainDate.compare(date, value.end) < 0
      return { isRangeStart, isRangeEnd, inRange, isPreview: false }
    }

    // Partial range (only start) — show hover preview
    const effectiveHover = getEffectiveHover(value.start)
    if (!effectiveHover) {
      return {
        isRangeStart: Temporal.PlainDate.compare(date, value.start) === 0,
        isRangeEnd: false,
        inRange: false,
        isPreview: true,
      }
    }

    const [previewStart, previewEnd] =
      Temporal.PlainDate.compare(effectiveHover, value.start) >= 0
        ? [value.start, effectiveHover]
        : [effectiveHover, value.start]

    const isRangeStart = Temporal.PlainDate.compare(date, previewStart) === 0
    const isRangeEnd = Temporal.PlainDate.compare(date, previewEnd) === 0
    const inRange =
      Temporal.PlainDate.compare(date, previewStart) >= 0 &&
      Temporal.PlainDate.compare(date, previewEnd) <= 0

    return { isRangeStart, isRangeEnd, inRange, isPreview: true }
  }

  return { setHoverDate, handleRangeClick, getDayRangeState }
}

export { useDateRange }
export type { DateRange, RangeDayState }
