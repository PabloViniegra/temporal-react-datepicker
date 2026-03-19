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

    // Second click — normalise order (disabled dates within the range are skipped by the consumer)
    const [rangeStart, rangeEnd] =
      Temporal.PlainDate.compare(date, value.start) >= 0
        ? [value.start, date]
        : [date, value.start]

    onChange({ start: rangeStart, end: rangeEnd })
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
    if (!hoverDate) {
      return {
        isRangeStart: Temporal.PlainDate.compare(date, value.start) === 0,
        isRangeEnd: false,
        inRange: false,
        isPreview: true,
      }
    }

    const [previewStart, previewEnd] =
      Temporal.PlainDate.compare(hoverDate, value.start) >= 0
        ? [value.start, hoverDate]
        : [hoverDate, value.start]

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
