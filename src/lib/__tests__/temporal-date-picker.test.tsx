import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Temporal } from '@js-temporal/polyfill'
import TemporalDatePicker from '../temporal-date-picker'

// Fix "today" so tests don't depend on the real current date
const TODAY = Temporal.PlainDate.from('2024-03-15')

beforeEach(() => {
  vi.spyOn(Temporal.Now, 'plainDateISO').mockReturnValue(TODAY)
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Helpers ────────────────────────────────────────────────────────────────

const d = (s: string) => Temporal.PlainDate.from(s)

// ── Tests ─────────────────────────────────────────────────────────────────

describe('TemporalDatePicker', () => {
  describe('rendering', () => {
    it('renders a calendar grid', () => {
      render(<TemporalDatePicker onChange={vi.fn()} />)
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    it('shows the current month and year buttons in the header', () => {
      render(<TemporalDatePicker onChange={vi.fn()} locale="en" />)
      expect(screen.getByRole('button', { name: /select month.*march/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select year.*2024/i })).toBeInTheDocument()
    })

    it('renders 7 weekday column headers', () => {
      render(<TemporalDatePicker onChange={vi.fn()} locale="en" />)
      const headers = screen.getAllByRole('columnheader')
      expect(headers).toHaveLength(7)
    })

    it('marks today with aria-current="date"', () => {
      render(<TemporalDatePicker onChange={vi.fn()} locale="en" />)
      const todayBtn = screen.getByRole('button', { name: /march 15/i })
      expect(todayBtn).toHaveAttribute('aria-current', 'date')
    })
  })

  describe('single mode', () => {
    it('calls onChange with the clicked date', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<TemporalDatePicker onChange={onChange} locale="en" />)

      await user.click(screen.getByRole('button', { name: /march 15/i }))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ year: 2024, month: 3, day: 15 }),
      )
    })

    it('selected day has aria-selected=true on its cell', () => {
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={vi.fn()} locale="en" />)
      const btn = screen.getByRole('button', { name: /march 15/i })
      const cell = btn.closest('[role="gridcell"]')
      expect(cell).toHaveAttribute('aria-selected', 'true')
    })

    it('unselected days have aria-selected=false on their cell', () => {
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={vi.fn()} locale="en" />)
      const btn = screen.getByRole('button', { name: /march 10/i })
      const cell = btn.closest('[role="gridcell"]')
      expect(cell).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('clearable', () => {
    it('clear button is hidden when no value', () => {
      render(<TemporalDatePicker clearable onChange={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
    })

    it('clear button is visible when a value is set', () => {
      render(<TemporalDatePicker clearable value={d('2024-03-10')} onChange={vi.fn()} />)
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('clicking clear calls onChange with undefined', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<TemporalDatePicker clearable value={d('2024-03-10')} onChange={onChange} />)
      await user.click(screen.getByRole('button', { name: /clear/i }))
      expect(onChange).toHaveBeenCalledWith(undefined)
    })
  })

  describe('month navigation', () => {
    it('prev month button navigates to previous month', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /previous month/i }))
      expect(screen.getByRole('button', { name: /select month.*february/i })).toBeInTheDocument()
    })

    it('next month button navigates to next month', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /next month/i }))
      expect(screen.getByRole('button', { name: /select month.*april/i })).toBeInTheDocument()
    })

    it('clicking month button opens the month panel', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /select month/i }))
      expect(screen.getByRole('grid', { name: /select month/i })).toBeInTheDocument()
    })

    it('clicking year button opens the year panel', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /select year/i }))
      expect(screen.getByRole('grid', { name: /select year/i })).toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('ArrowLeft moves focus to the previous day', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={vi.fn()} locale="en" />)

      // Click day 15 to give it focus, then press ArrowLeft
      await user.click(screen.getByRole('button', { name: /march 15/i }))
      await user.keyboard('{ArrowLeft}')

      expect(screen.getByRole('button', { name: /march 14/i })).toHaveAttribute('tabIndex', '0')
    })

    it('ArrowRight moves focus to the next day', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={vi.fn()} locale="en" />)

      await user.click(screen.getByRole('button', { name: /march 15/i }))
      await user.keyboard('{ArrowRight}')

      expect(screen.getByRole('button', { name: /march 16/i })).toHaveAttribute('tabIndex', '0')
    })

    it('PageUp navigates to the previous month', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={vi.fn()} locale="en" />)

      await user.click(screen.getByRole('button', { name: /march 15/i }))
      await user.keyboard('{PageUp}')

      // View shifts to February — the month button label changes
      expect(screen.getByRole('button', { name: /select month.*february/i })).toBeInTheDocument()
    })

    it('PageDown navigates to the next month', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={vi.fn()} locale="en" />)

      await user.click(screen.getByRole('button', { name: /march 15/i }))
      await user.keyboard('{PageDown}')

      expect(screen.getByRole('button', { name: /select month.*april/i })).toBeInTheDocument()
    })

    it('Enter key selects the focused date', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={onChange} locale="en" />)

      await user.click(screen.getByRole('button', { name: /march 15/i }))
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{Enter}')

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ year: 2024, month: 3, day: 16 }),
      )
    })
  })

  describe('week numbers', () => {
    it('shows a week number column header when showWeekNumbers=true', () => {
      render(<TemporalDatePicker onChange={vi.fn()} showWeekNumbers />)
      expect(screen.getByRole('columnheader', { name: 'Week' })).toBeInTheDocument()
    })

    it('renders 8 column headers (week + 7 weekdays) with showWeekNumbers', () => {
      render(<TemporalDatePicker onChange={vi.fn()} showWeekNumbers />)
      expect(screen.getAllByRole('columnheader')).toHaveLength(8)
    })

    it('does not show week column header without showWeekNumbers', () => {
      render(<TemporalDatePicker onChange={vi.fn()} />)
      expect(screen.queryByRole('columnheader', { name: 'Week' })).not.toBeInTheDocument()
    })
  })

  describe('disabled dates', () => {
    it('disabled days have the disabled attribute', () => {
      const isDateDisabled = (dt: Temporal.PlainDate) => dt.day === 10
      render(
        <TemporalDatePicker onChange={vi.fn()} isDateDisabled={isDateDisabled} locale="en" />,
      )
      expect(screen.getByRole('button', { name: /march 10/i })).toBeDisabled()
    })

    it('non-disabled days are not disabled', () => {
      const isDateDisabled = (dt: Temporal.PlainDate) => dt.day === 10
      render(
        <TemporalDatePicker onChange={vi.fn()} isDateDisabled={isDateDisabled} locale="en" />,
      )
      expect(screen.getByRole('button', { name: /march 15/i })).not.toBeDisabled()
    })
  })

  describe('range mode', () => {
    it('first click sets the range start with end=null', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<TemporalDatePicker mode="range" onChange={onChange} locale="en" />)

      await user.click(screen.getByRole('button', { name: /march 10/i }))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expect.objectContaining({ day: 10 }),
          end: null,
        }),
      )
    })

    it('two clicks complete a range', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const { rerender } = render(
        <TemporalDatePicker mode="range" onChange={onChange} locale="en" />,
      )

      // First click
      await user.click(screen.getByRole('button', { name: /march 10/i }))
      const partial = onChange.mock.calls[0][0] as { start: Temporal.PlainDate; end: null }

      // Rerender with partial value to simulate controlled component
      rerender(
        <TemporalDatePicker mode="range" value={partial} onChange={onChange} locale="en" />,
      )

      // Second click
      await user.click(screen.getByRole('button', { name: /march 20/i }))
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          start: expect.objectContaining({ day: 10 }),
          end: expect.objectContaining({ day: 20 }),
        }),
      )
    })
  })

  describe('remaining keyboard navigation', () => {
    it('ArrowUp moves focus one week back', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /march 15/i }))
      await user.keyboard('{ArrowUp}')
      // 2024-03-15 - 1 week = 2024-03-08
      expect(screen.getByRole('button', { name: /march 8/i })).toHaveAttribute('tabIndex', '0')
    })

    it('ArrowDown moves focus one week forward', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /march 15/i }))
      await user.keyboard('{ArrowDown}')
      // 2024-03-15 + 1 week = 2024-03-22
      expect(screen.getByRole('button', { name: /march 22/i })).toHaveAttribute('tabIndex', '0')
    })

    it('Home moves focus to the start of the week (Monday)', async () => {
      const user = userEvent.setup()
      // 2024-03-15 is Friday (dayOfWeek=5), Home → 2024-03-11 (Monday)
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /march 15/i }))
      await user.keyboard('{Home}')
      expect(screen.getByRole('button', { name: /march 11/i })).toHaveAttribute('tabIndex', '0')
    })

    it('End moves focus to the end of the week (Sunday)', async () => {
      const user = userEvent.setup()
      // 2024-03-15 is Friday (dayOfWeek=5), End → 2024-03-17 (Sunday, dayOfWeek=7)
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /march 15/i }))
      await user.keyboard('{End}')
      expect(screen.getByRole('button', { name: /march 17/i })).toHaveAttribute('tabIndex', '0')
    })

    it('Space key selects the focused date', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<TemporalDatePicker value={d('2024-03-15')} onChange={onChange} locale="en" />)
      await user.click(screen.getByRole('button', { name: /march 15/i }))
      await user.keyboard('{ArrowRight}')
      await user.keyboard(' ')
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ year: 2024, month: 3, day: 16 }),
      )
    })

    it('ArrowLeft in range mode moves focus using today as base when no value', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker mode="range" onChange={vi.fn()} locale="en" />)
      const grid = screen.getByRole('grid')
      fireEvent.keyDown(grid, { key: 'ArrowLeft' })
      // today is 2024-03-15 → base = today → navigates to 2024-03-14
      expect(screen.getByRole('button', { name: /march 14/i })).toHaveAttribute('tabIndex', '0')
      await user.keyboard('{ArrowRight}')
    })

    it('unhandled key on the grid does nothing (default case)', () => {
      render(<TemporalDatePicker onChange={vi.fn()} />)
      const grid = screen.getByRole('grid')
      // firing a non-handled key should not throw
      fireEvent.keyDown(grid, { key: 'Tab' })
      expect(grid).toBeInTheDocument()
    })

    it('Enter without a focused date does nothing', () => {
      const onChange = vi.fn()
      render(<TemporalDatePicker onChange={onChange} />)
      const grid = screen.getByRole('grid')
      // focusedDate is null — Enter should be a no-op
      fireEvent.keyDown(grid, { key: 'Enter' })
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('MonthPanel integration', () => {
    it('selecting a month from MonthPanel updates view and returns to calendar', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /select month/i }))
      await user.click(screen.getByRole('gridcell', { name: /^jan$/i }))
      // Back to calendar showing January
      expect(screen.getByRole('grid')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select month.*january/i })).toBeInTheDocument()
    })

    it('closing MonthPanel via Escape returns to calendar', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /select month/i }))
      const mar = screen.getByRole('gridcell', { name: /^mar$/i })
      mar.focus()
      await user.keyboard('{Escape}')
      expect(screen.getByRole('grid', { name: /march/i })).toBeInTheDocument()
    })
  })

  describe('YearPanel integration', () => {
    it('selecting a year from YearPanel updates view and returns to calendar', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /select year/i }))
      await user.click(screen.getByRole('gridcell', { name: '2025' }))
      // Back to calendar showing 2025
      expect(screen.getByRole('grid')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select year.*2025/i })).toBeInTheDocument()
    })

    it('closing YearPanel via Escape returns to calendar', async () => {
      const user = userEvent.setup()
      render(<TemporalDatePicker onChange={vi.fn()} locale="en" />)
      await user.click(screen.getByRole('button', { name: /select year/i }))
      const year2024 = screen.getByRole('gridcell', { name: '2024' })
      year2024.focus()
      await user.keyboard('{Escape}')
      expect(screen.getByRole('grid', { name: /march/i })).toBeInTheDocument()
    })
  })

  describe('renderDayContent', () => {
    it('uses renderDayContent when provided', () => {
      const renderDayContent = vi.fn((date: Temporal.PlainDate) => (
        <span data-testid={`custom-${date.day}`}>{date.day}</span>
      ))
      render(
        <TemporalDatePicker
          value={d('2024-03-15')}
          onChange={vi.fn()}
          locale="en"
          renderDayContent={renderDayContent}
        />,
      )
      expect(renderDayContent).toHaveBeenCalled()
      expect(screen.getByTestId('custom-15')).toBeInTheDocument()
    })
  })

  describe('custom labels', () => {
    it('applies label overrides for navigation buttons', () => {
      render(
        <TemporalDatePicker
          onChange={vi.fn()}
          labels={{ prevMonth: 'Anterior', nextMonth: 'Siguiente' }}
        />,
      )
      expect(screen.getByRole('button', { name: 'Anterior' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
    })
  })
})
