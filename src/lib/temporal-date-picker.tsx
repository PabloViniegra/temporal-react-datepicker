import { useState, useRef } from 'react'
import type { ReactNode, KeyboardEvent } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import './temporal-date-picker.css'

import { MonthPanel } from './panels/MonthPanel'
import { YearPanel } from './panels/YearPanel'
import { useJumpNav } from './hooks/useJumpNav'
import { useDateRange } from './hooks/useDateRange'
import type { DateRange } from './hooks/useDateRange'

// ── Types ────────────────────────────────────────────────────────────────────

interface DayState {
  selected: boolean
  inRange: boolean
  isRangeStart: boolean
  isRangeEnd: boolean
}

interface Labels {
  // Calendar header
  prevMonth: string
  nextMonth: string
  clearSelection: string
  selectMonth: (monthName: string) => string
  selectYear: (year: number) => string
  // Week numbers
  weekNumberHeader: string
  weekNumber: (weekNum: number) => string
  // Range context (appended to day aria-label)
  rangeStart: string
  rangeEnd: string
  inRange: string
  // aria-live announcements on panel switch
  monthPanelAnnouncement: string
  yearPanelAnnouncement: string
  // Month panel
  prevYear: string
  nextYear: string
  monthPanelTitle: string
  // Year panel
  prevYearWindow: string
  nextYearWindow: string
  yearPanelTitle: string
}

const DEFAULT_LABELS: Labels = {
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  clearSelection: 'Clear selection',
  selectMonth: name => `Select month, currently ${name}`,
  selectYear: year => `Select year, currently ${year}`,
  weekNumberHeader: 'Week',
  weekNumber: n => `Week ${n}`,
  rangeStart: ', range start',
  rangeEnd: ', range end',
  inRange: ', in range',
  monthPanelAnnouncement: 'Month selector',
  yearPanelAnnouncement: 'Year selector',
  prevYear: 'Previous year',
  nextYear: 'Next year',
  monthPanelTitle: 'Select month',
  prevYearWindow: 'Previous window',
  nextYearWindow: 'Next window',
  yearPanelTitle: 'Select year',
}

interface SharedProps {
  isDateDisabled?: (date: Temporal.PlainDate) => boolean
  className?: string
  locale?: string
  labels?: Partial<Labels>
  renderDayContent?: (date: Temporal.PlainDate, state: DayState) => ReactNode
  showWeekNumbers?: boolean
}

// mode="single" without clearable — onChange is non-nullable (backwards compatible)
interface SinglePropsStrict extends SharedProps {
  mode?: 'single'
  clearable?: false
  value?: Temporal.PlainDate
  onChange: (date: Temporal.PlainDate) => void
}

// mode="single" with clearable — onChange accepts undefined
interface SinglePropsClearable extends SharedProps {
  mode?: 'single'
  clearable: true
  value?: Temporal.PlainDate
  onChange: (date: Temporal.PlainDate | undefined) => void
}

// mode="range" without clearable
interface RangePropsStrict extends SharedProps {
  mode: 'range'
  clearable?: false
  value?: DateRange
  onChange: (range: DateRange) => void
}

// mode="range" with clearable — onChange accepts undefined
interface RangePropsClearable extends SharedProps {
  mode: 'range'
  clearable: true
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
}

type Props = SinglePropsStrict | SinglePropsClearable | RangePropsStrict | RangePropsClearable

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDayLabels(locale: string): { short: string; long: string }[] {
  const labels: { short: string; long: string }[] = []
  // Reference week starting Monday (2024-01-01 is a Monday)
  for (let i = 1; i <= 7; i++) {
    const date = new Date(2024, 0, i)
    labels.push({
      short: date.toLocaleString(locale, { weekday: 'narrow' }),
      long: date.toLocaleString(locale, { weekday: 'long' }),
    })
  }
  return labels
}

function buildWeeks(viewDate: Temporal.PlainDate): (Temporal.PlainDate | null)[][] {
  const firstDay = viewDate.with({ day: 1 })
  const daysInMonth = viewDate.daysInMonth
  const startPad = firstDay.dayOfWeek - 1

  const cells: (Temporal.PlainDate | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => firstDay.add({ days: i })),
  ]

  const weeks: (Temporal.PlainDate | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7)
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

// ── Component ─────────────────────────────────────────────────────────────────

const TemporalDatePicker = (props: Props) => {
  const { className = '', locale, labels: labelOverrides, renderDayContent, showWeekNumbers, isDateDisabled } = props
  const l = { ...DEFAULT_LABELS, ...labelOverrides }

  const effectiveLocale = locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en')

  const [viewDate, setViewDate] = useState<Temporal.PlainDate>(() => {
    if (props.mode === 'range') return props.value?.start ?? Temporal.Now.plainDateISO()
    return props.value ?? Temporal.Now.plainDateISO()
  })

  const [focusedDate, setFocusedDate] = useState<Temporal.PlainDate | null>(null)
  const gridRef = useRef<HTMLTableElement>(null)

  const { view, setView } = useJumpNav()
  const { setHoverDate, handleRangeClick, getDayRangeState } = useDateRange(isDateDisabled)

  const today = Temporal.Now.plainDateISO()

  const isToday = (d: Temporal.PlainDate) => Temporal.PlainDate.compare(today, d) === 0

  const hasValue = props.value !== undefined

  function handleClear() {
    if (props.clearable) {
      // Safe: clearable:true always means onChange accepts undefined
      ;(props.onChange as (v: undefined) => void)(undefined)
    }
  }

  function handleDayClick(date: Temporal.PlainDate) {
    if (props.mode === 'range') {
      // Both RangePropsStrict and RangePropsClearable accept a DateRange argument
      handleRangeClick(date, props.value, props.onChange as (r: DateRange) => void)
    } else {
      props.onChange(date)
      setFocusedDate(date)
    }
  }

  const navigateToDate = (date: Temporal.PlainDate) => {
    setFocusedDate(date)
    if (date.year !== viewDate.year || date.month !== viewDate.month) {
      setViewDate(date)
    }
  }

  const handleGridKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    const singleValue = props.mode !== 'range' ? props.value : undefined
    const base = focusedDate ?? singleValue ?? today

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        navigateToDate(base.subtract({ days: 1 }))
        break
      case 'ArrowRight':
        e.preventDefault()
        navigateToDate(base.add({ days: 1 }))
        break
      case 'ArrowUp':
        e.preventDefault()
        navigateToDate(base.subtract({ weeks: 1 }))
        break
      case 'ArrowDown':
        e.preventDefault()
        navigateToDate(base.add({ weeks: 1 }))
        break
      case 'Home':
        e.preventDefault()
        navigateToDate(base.subtract({ days: base.dayOfWeek - 1 }))
        break
      case 'End':
        e.preventDefault()
        navigateToDate(base.add({ days: 7 - base.dayOfWeek }))
        break
      case 'PageUp':
        e.preventDefault()
        navigateToDate(base.subtract({ months: 1 }))
        break
      case 'PageDown':
        e.preventDefault()
        navigateToDate(base.add({ months: 1 }))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedDate) handleDayClick(focusedDate)
        break
      default:
        break
    }
  }

  const handlePrevMonth = () => {
    setViewDate(v => v.subtract({ months: 1 }))
    setFocusedDate(null)
  }

  const handleNextMonth = () => {
    setViewDate(v => v.add({ months: 1 }))
    setFocusedDate(null)
  }

  const monthLabel = viewDate.toLocaleString(effectiveLocale, { month: 'long', year: 'numeric' })
  const monthName = viewDate.toLocaleString(effectiveLocale, { month: 'long' })
  const dayLabels = getWeekDayLabels(effectiveLocale)
  const weeks = buildWeeks(viewDate)

  // Roving tabindex anchor
  const rangeActiveStart = props.mode === 'range' ? props.value?.start : undefined
  const activeDate = focusedDate ?? (props.mode !== 'range' ? props.value : rangeActiveStart) ?? today

  // aria-live text changes on panel switch
  const liveText =
    view === 'month' ? l.monthPanelAnnouncement : view === 'year' ? l.yearPanelAnnouncement : monthLabel

  function computeDayState(date: Temporal.PlainDate): DayState {
    if (props.mode === 'range') {
      const rs = getDayRangeState(date, props.value)
      return {
        selected: false,
        inRange: rs.inRange,
        isRangeStart: rs.isRangeStart,
        isRangeEnd: rs.isRangeEnd,
      }
    }
    return {
      selected: props.value !== undefined && Temporal.PlainDate.compare(props.value, date) === 0,
      inRange: false,
      isRangeStart: false,
      isRangeEnd: false,
    }
  }

  function getDayClass(date: Temporal.PlainDate, state: DayState): string {
    const classes = ['tdp-day']
    if (state.selected) classes.push('tdp-day--selected')
    if (isToday(date)) classes.push('tdp-day--today')
    if (state.isRangeStart) classes.push('tdp-day--range-start')
    if (state.isRangeEnd) classes.push('tdp-day--range-end')
    if (state.inRange && !state.isRangeStart && !state.isRangeEnd) classes.push('tdp-day--in-range')
    return classes.join(' ')
  }

  return (
    <div className={`temporal-datepicker ${className}`.trim()}>
      {/* Screen-reader live region for panel switches */}
      <div aria-live="polite" aria-atomic="true" className="tdp-sr-only">
        {liveText}
      </div>

      {view === 'calendar' && (
        <>
          {/* Header */}
          <div className="tdp-header">
            <button
              type="button"
              className="tdp-nav"
              onClick={handlePrevMonth}
              aria-label={l.prevMonth}
            >
              ‹
            </button>

            <div className="tdp-month-label">
              <button
                type="button"
                className="tdp-month-btn"
                onClick={() => setView('month')}
                aria-label={l.selectMonth(monthName)}
              >
                {monthName}
              </button>
              <button
                type="button"
                className="tdp-year-btn"
                onClick={() => setView('year')}
                aria-label={l.selectYear(viewDate.year)}
              >
                {viewDate.year}
              </button>
            </div>

            {props.clearable && hasValue && (
              <button
                type="button"
                className="tdp-nav tdp-clear"
                onClick={handleClear}
                aria-label={l.clearSelection}
              >
                ×
              </button>
            )}

            <button
              type="button"
              className="tdp-nav"
              onClick={handleNextMonth}
              aria-label={l.nextMonth}
            >
              ›
            </button>
          </div>

          {/* Calendar grid */}
          <table
            ref={gridRef}
            role="grid"
            aria-label={monthLabel}
            className="tdp-grid"
            onKeyDown={handleGridKeyDown}
          >
            <thead>
              <tr role="row">
                {showWeekNumbers && (
                  <th
                    role="columnheader"
                    scope="col"
                    className="tdp-weekday tdp-weeknum-header"
                    aria-label={l.weekNumberHeader}
                  />
                )}
                {dayLabels.map(({ short, long }) => (
                  <th key={long} role="columnheader" scope="col" className="tdp-weekday" abbr={long}>
                    {short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => {
                const firstDate = week.find(d => d !== null)
                const weekNum = firstDate?.weekOfYear
                return (
                  <tr key={wi} role="row">
                    {showWeekNumbers && (
                      <th
                        scope="row"
                        className="tdp-weeknum"
                        aria-label={weekNum != null ? l.weekNumber(weekNum) : l.weekNumberHeader}
                      >
                        {weekNum ?? ''}
                      </th>
                    )}
                    {week.map((date, di) => {
                      if (!date) {
                        return <td key={`empty-${di}`} role="gridcell" className="tdp-cell" />
                      }

                      const disabled = isDateDisabled?.(date) ?? false
                      const state = computeDayState(date)
                      const isCurrentDay = isToday(date)
                      const isActiveFocus = Temporal.PlainDate.compare(activeDate, date) === 0
                      const dayClass = getDayClass(date, state)

                      let ariaLabel = date.toLocaleString(effectiveLocale, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                      if (state.isRangeStart && !state.isRangeEnd) ariaLabel += l.rangeStart
                      if (state.isRangeEnd && !state.isRangeStart) ariaLabel += l.rangeEnd
                      if (state.inRange && !state.isRangeStart && !state.isRangeEnd)
                        ariaLabel += l.inRange

                      return (
                        <td
                          key={date.toString()}
                          role="gridcell"
                          aria-selected={state.selected || state.isRangeStart || state.isRangeEnd}
                          className="tdp-cell"
                        >
                          <button
                            type="button"
                            className={dayClass}
                            onClick={() => handleDayClick(date)}
                            onFocus={() => setFocusedDate(date)}
                            onMouseEnter={() => props.mode === 'range' && setHoverDate(date)}
                            onMouseLeave={() => props.mode === 'range' && setHoverDate(null)}
                            tabIndex={isActiveFocus ? 0 : -1}
                            disabled={disabled}
                            aria-label={ariaLabel}
                            aria-current={isCurrentDay ? 'date' : undefined}
                            aria-pressed={props.mode !== 'range' ? state.selected : undefined}
                          >
                            {renderDayContent ? renderDayContent(date, state) : date.day}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      {view === 'month' && (
        <MonthPanel
          viewDate={viewDate}
          locale={effectiveLocale}
          labels={l}
          onSelect={(year, month) => {
            setViewDate(viewDate.with({ year, month }))
            setView('calendar')
          }}
          onClose={() => setView('calendar')}
        />
      )}

      {view === 'year' && (
        <YearPanel
          viewDate={viewDate}
          labels={l}
          onSelect={year => {
            setViewDate(viewDate.with({ year }))
            setView('calendar')
          }}
          onClose={() => setView('calendar')}
        />
      )}
    </div>
  )
}

export type { DayState, DateRange, Labels }
export default TemporalDatePicker
