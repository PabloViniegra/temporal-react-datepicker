import { type ReactNode, useRef } from 'react'
import { Temporal } from '@js-temporal/polyfill'

import TemporalDatePicker from '../temporal-date-picker'
import type { Labels } from '../temporal-date-picker'
import type { DateRange } from '../hooks/useDateRange'
import { useSegmentedDate } from './hooks/useSegmentedDate'
import { useDatePickerPopover } from './hooks/useDatePickerPopover'
import CalendarIcon from './CalendarIcon'
import './date-picker-input.css'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SharedDatePickerInputProps {
  locale?: string
  placeholder?: string
  disabled?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  isDateDisabled?: (date: Temporal.PlainDate) => boolean
  labels?: Partial<Labels>
  className?: string
}

interface SinglePropsStrict extends SharedDatePickerInputProps {
  mode?: 'single'
  clearable?: false
  value?: Temporal.PlainDate
  onChange: (date: Temporal.PlainDate) => void
}

interface SinglePropsClearable extends SharedDatePickerInputProps {
  mode?: 'single'
  clearable: true
  value?: Temporal.PlainDate
  onChange: (date: Temporal.PlainDate | undefined) => void
}

interface RangePropsStrict extends SharedDatePickerInputProps {
  mode: 'range'
  clearable?: false
  value?: DateRange
  onChange: (range: DateRange) => void
}

interface RangePropsClearable extends SharedDatePickerInputProps {
  mode: 'range'
  clearable: true
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
}

// mode is optional on single variants (defaults to 'single');
// TypeScript narrows reliably via the required 'range' literal on range variants.
type SingleProps = SinglePropsStrict | SinglePropsClearable
type RangeProps = RangePropsStrict | RangePropsClearable
type DatePickerInputProps = SingleProps | RangeProps

// ── Segment group sub-component ───────────────────────────────────────────────

interface SegmentGroupProps {
  segments: { day: number | null; month: number | null; year: number | null }
  segmentOrder: ('day' | 'month' | 'year')[]
  separator: string
  focusedSegment: 'day' | 'month' | 'year' | null
  segmentRefs: Record<'day' | 'month' | 'year', React.RefObject<HTMLSpanElement | null>>
  handlers: {
    onKeyDown: (segment: 'day' | 'month' | 'year', e: React.KeyboardEvent) => void
    onFocus: (segment: 'day' | 'month' | 'year') => void
    onBlur: () => void
  }
  disabled?: boolean
  placeholder?: { day: string; month: string; year: string }
  id?: string
}

const PLACEHOLDER_LABELS: Record<'day' | 'month' | 'year', { short: string; long: string }> = {
  day: { short: 'dd', long: 'Day' },
  month: { short: 'mm', long: 'Month' },
  year: { short: 'yyyy', long: 'Year' },
}

function SegmentGroup({
  segments,
  segmentOrder,
  separator,
  focusedSegment,
  segmentRefs,
  handlers,
  disabled,
  id,
}: SegmentGroupProps) {
  return (
    <span className="tdp-input__segments" id={id}>
      {segmentOrder.map((seg, idx) => {
        const value = segments[seg]
        const isFocused = focusedSegment === seg
        const isEmpty = value === null

        let displayValue: string
        if (!isEmpty) {
          displayValue = seg === 'year' ? String(value).padStart(4, '0') : String(value).padStart(2, '0')
        } else {
          displayValue = PLACEHOLDER_LABELS[seg].short
        }

        const classes = [
          'tdp-input__segment',
          seg === 'year' ? 'tdp-input__segment--year' : '',
          isEmpty && !isFocused ? 'tdp-input__segment--empty' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <span key={seg}>
            <span
              ref={segmentRefs[seg]}
              role="spinbutton"
              aria-label={PLACEHOLDER_LABELS[seg].long}
              aria-valuenow={value ?? undefined}
              aria-valuemin={seg === 'year' ? 1 : seg === 'month' ? 1 : 1}
              aria-valuemax={seg === 'year' ? 9999 : seg === 'month' ? 12 : 31}
              aria-disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              className={classes}
              onKeyDown={e => handlers.onKeyDown(seg, e)}
              onFocus={() => handlers.onFocus(seg)}
              onBlur={handlers.onBlur}
            >
              {displayValue}
            </span>
            {idx < segmentOrder.length - 1 && (
              <span className="tdp-input__separator" aria-hidden="true">
                {separator}
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function DatePickerInput(props: DatePickerInputProps) {
  const {
    locale = navigator.language,
    disabled = false,
    icon,
    iconPosition = 'right',
    isDateDisabled,
    labels,
    className,
    clearable,
  } = props

  const { isOpen, open, close, triggerRef, popoverRef, inputWrapperRef } = useDatePickerPopover()

  // ── Single mode ───────────────────────────────────────────────────────────

  const isSingleMode = props.mode !== 'range'

  const singleValue = isSingleMode ? (props as SingleProps).value : undefined
  /* v8 ignore start */
  const singleOnChange = isSingleMode
    ? (props as SingleProps).onChange
    : (_d: Temporal.PlainDate | undefined) => {}
  /* v8 ignore stop */

  const single = useSegmentedDate(
    singleValue,
    locale,
    (date: Temporal.PlainDate | undefined) => {
      if (date === undefined) {
        ;(singleOnChange as (d: Temporal.PlainDate | undefined) => void)(undefined)
      } else {
        ;(singleOnChange as (d: Temporal.PlainDate) => void)(date)
      }
    },
    clearable ?? false,
  )

  // ── Range mode ────────────────────────────────────────────────────────────

  const isRangeMode = props.mode === 'range'

  const rangeValue = isRangeMode ? (props as RangeProps).value : undefined
  const rangeStartValue = rangeValue?.start
  const rangeEndValue = rangeValue?.end ?? undefined

  /* v8 ignore start */
  const rangeStart = useSegmentedDate(rangeStartValue, locale, (_d: Temporal.PlainDate | undefined) => {}, false)
  const rangeEnd = useSegmentedDate(rangeEndValue, locale, (_d: Temporal.PlainDate | undefined) => {}, false)
  /* v8 ignore stop */

  // ── Popover calendar handlers ─────────────────────────────────────────────

  // Used to keep TemporalDatePicker value in sync inside the popover (single mode)
  const internalSingleRef = useRef<Temporal.PlainDate | undefined>(singleValue)
  internalSingleRef.current = singleValue

  function handleSinglePickerChange(date: Temporal.PlainDate) {
    ;(singleOnChange as (d: Temporal.PlainDate) => void)(date)
    close()
  }

  function handleRangePickerChange(range: DateRange) {
    if (range.end !== null) {
      // Complete range — call parent and close
      const completeRange = { start: range.start, end: range.end }
      rangeStart.setSegments({ day: range.start.day, month: range.start.month, year: range.start.year })
      rangeEnd.setSegments({ day: range.end.day, month: range.end.month, year: range.end.year })
      ;(props as RangeProps).onChange(completeRange as DateRange & { end: Temporal.PlainDate })
      close()
    } else {
      // Partial range — update start segments only, keep popover open
      rangeStart.setSegments({ day: range.start.day, month: range.start.month, year: range.start.year })
      rangeEnd.setSegments({ day: null, month: null, year: null })
    }
  }

  // ── Clear ─────────────────────────────────────────────────────────────────

  function handleClear() {
    if (isSingleMode) {
      ;(props as SinglePropsClearable).onChange(undefined)
    } else {
      ;(props as RangePropsClearable).onChange(undefined)
      rangeStart.setSegments({ day: null, month: null, year: null })
      rangeEnd.setSegments({ day: null, month: null, year: null })
    }
  }

  // ── Keyboard on wrapper ───────────────────────────────────────────────────

  function handleWrapperKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation()
      close()
    }
  }

  // ── Icon ──────────────────────────────────────────────────────────────────

  const iconNode = (
    <button
      ref={triggerRef}
      type="button"
      className="tdp-input__icon-btn"
      aria-label="Open calendar"
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      disabled={disabled}
      onClick={open}
      tabIndex={disabled ? -1 : 0}
    >
      {icon ?? <CalendarIcon />}
    </button>
  )

  // ── Clear button ──────────────────────────────────────────────────────────

  const hasClearableValue = clearable
    ? isSingleMode
      ? singleValue !== undefined
      : rangeValue !== undefined
    : false

  const clearButton = clearable && hasClearableValue ? (
    <button
      type="button"
      className="tdp-input__clear"
      aria-label="Clear date"
      disabled={disabled}
      onClick={handleClear}
      tabIndex={disabled ? -1 : 0}
    >
      ×
    </button>
  ) : null

  // ── Render ────────────────────────────────────────────────────────────────

  const wrapperClass = [
    'tdp-input__wrapper',
    disabled ? 'tdp-input__wrapper--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const rootClass = ['tdp-input', className].filter(Boolean).join(' ')

  // Internal value for the popover calendar (range partial state)
  const internalRangeValue: DateRange | undefined = isRangeMode
    ? rangeValue ??
      (rangeStart.segments.day !== null
        ? { start: buildDate(rangeStart.segments), end: null }
        : undefined)
    : undefined

  return (
    <div className={rootClass} onKeyDown={handleWrapperKeyDown}>
      <div ref={inputWrapperRef} className={wrapperClass} role="group" aria-label="Date input">
        {iconPosition === 'left' && iconNode}
        {isSingleMode ? (
          <SegmentGroup
            segments={single.segments}
            segmentOrder={single.segmentOrder}
            separator={single.separator}
            focusedSegment={single.focusedSegment}
            segmentRefs={single.segmentRefs}
            handlers={single.handlers}
            disabled={disabled}
          />
        ) : (
          <>
            <SegmentGroup
              segments={rangeStart.segments}
              segmentOrder={rangeStart.segmentOrder}
              separator={rangeStart.separator}
              focusedSegment={rangeStart.focusedSegment}
              segmentRefs={rangeStart.segmentRefs}
              handlers={rangeStart.handlers}
              disabled={disabled}
              id="tdp-range-start"
            />
            <span className="tdp-input__range-arrow" aria-hidden="true">→</span>
            <SegmentGroup
              segments={rangeEnd.segments}
              segmentOrder={rangeEnd.segmentOrder}
              separator={rangeEnd.separator}
              focusedSegment={rangeEnd.focusedSegment}
              segmentRefs={rangeEnd.segmentRefs}
              handlers={rangeEnd.handlers}
              disabled={disabled}
              id="tdp-range-end"
            />
          </>
        )}
        {clearButton}
        {iconPosition === 'right' && <><span className="tdp-input__spacer" />{iconNode}</>}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className="tdp-input__popover"
          role="dialog"
          aria-modal="true"
          aria-label="Date picker"
        >
          {isSingleMode ? (
            <TemporalDatePicker
              value={singleValue}
              onChange={handleSinglePickerChange}
              isDateDisabled={isDateDisabled}
              labels={labels}
              locale={locale}
            />
          ) : (
            <TemporalDatePicker
              mode="range"
              value={internalRangeValue}
              onChange={handleRangePickerChange}
              isDateDisabled={isDateDisabled}
              labels={labels}
              locale={locale}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDate(segments: { day: number | null; month: number | null; year: number | null }): Temporal.PlainDate {
  /* v8 ignore start */
  return Temporal.PlainDate.from({
    day: segments.day ?? 1,
    month: segments.month ?? 1,
    year: segments.year ?? 2000,
  })
  /* v8 ignore stop */
}

export default DatePickerInput
export type { DatePickerInputProps }
