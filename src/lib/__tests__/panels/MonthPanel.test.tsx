import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Temporal } from '@js-temporal/polyfill'
import { MonthPanel } from '../../panels/MonthPanel'
import type { Labels } from '../../temporal-date-picker'

const LABELS: Labels = {
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

const VIEW_DATE = Temporal.PlainDate.from('2024-03-15')

describe('MonthPanel', () => {
  it('renders 12 month buttons', () => {
    render(
      <MonthPanel
        viewDate={VIEW_DATE}
        locale="en"
        labels={LABELS}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    const grid = screen.getByRole('grid', { name: /select month/i })
    const cells = grid.querySelectorAll('[role="gridcell"]')
    expect(cells).toHaveLength(12)
  })

  it('marks the current month as selected', () => {
    render(
      <MonthPanel
        viewDate={VIEW_DATE}
        locale="en"
        labels={LABELS}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    // March is month index 2 (0-based), with short locale "en" it should be "Mar"
    const marButton = screen.getByRole('gridcell', { name: /^mar$/i })
    expect(marButton).toHaveAttribute('aria-selected', 'true')
  })

  it('calls onSelect with year and month index when a month is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <MonthPanel
        viewDate={VIEW_DATE}
        locale="en"
        labels={LABELS}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    )
    // Jan is the first month button
    const jan = screen.getByRole('gridcell', { name: /^jan$/i })
    await user.click(jan)
    expect(onSelect).toHaveBeenCalledWith(2024, 1)
  })

  it('previous year button decrements the displayed year', async () => {
    const user = userEvent.setup()
    render(
      <MonthPanel
        viewDate={VIEW_DATE}
        locale="en"
        labels={LABELS}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /previous year/i }))
    expect(screen.getByText('2023')).toBeInTheDocument()
  })

  it('next year button increments the displayed year', async () => {
    const user = userEvent.setup()
    render(
      <MonthPanel
        viewDate={VIEW_DATE}
        locale="en"
        labels={LABELS}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /next year/i }))
    expect(screen.getByText('2025')).toBeInTheDocument()
  })

  it('Escape key calls onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <MonthPanel
        viewDate={VIEW_DATE}
        locale="en"
        labels={LABELS}
        onSelect={vi.fn()}
        onClose={onClose}
      />,
    )
    // Focus any month button and press Escape
    const jan = screen.getByRole('gridcell', { name: /^jan$/i })
    jan.focus()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('ArrowLeft moves keyboard focus to the previous month', async () => {
    const user = userEvent.setup()
    render(
      <MonthPanel
        viewDate={VIEW_DATE}
        locale="en"
        labels={LABELS}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    // Feb has index 1; ArrowLeft should move to Jan (index 0)
    const feb = screen.getByRole('gridcell', { name: /^feb$/i })
    feb.focus()
    await user.keyboard('{ArrowLeft}')

    const jan = screen.getByRole('gridcell', { name: /^jan$/i })
    expect(jan).toHaveAttribute('tabIndex', '0')
  })

  it('ArrowUp moves keyboard focus up one row (3 months back)', async () => {
    const user = userEvent.setup()
    render(
      <MonthPanel
        viewDate={VIEW_DATE}
        locale="en"
        labels={LABELS}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    // Apr has index 3; ArrowUp should move to Jan (index 0)
    const apr = screen.getByRole('gridcell', { name: /^apr$/i })
    apr.focus()
    await user.keyboard('{ArrowUp}')

    const jan = screen.getByRole('gridcell', { name: /^jan$/i })
    expect(jan).toHaveAttribute('tabIndex', '0')
  })

  it('ArrowDown moves keyboard focus down one row (3 months forward)', async () => {
    const user = userEvent.setup()
    render(
      <MonthPanel
        viewDate={VIEW_DATE}
        locale="en"
        labels={LABELS}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    // Jan has index 0; ArrowDown should move to Apr (index 3)
    const jan = screen.getByRole('gridcell', { name: /^jan$/i })
    jan.focus()
    await user.keyboard('{ArrowDown}')

    const apr = screen.getByRole('gridcell', { name: /^apr$/i })
    expect(apr).toHaveAttribute('tabIndex', '0')
  })

  it('Enter key calls onSelect with the focused month', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <MonthPanel
        viewDate={VIEW_DATE}
        locale="en"
        labels={LABELS}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    )
    const feb = screen.getByRole('gridcell', { name: /^feb$/i })
    feb.focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(2024, 2)
  })

  it('ArrowRight moves keyboard focus to the next month', async () => {
    const user = userEvent.setup()
    render(
      <MonthPanel
        viewDate={VIEW_DATE}
        locale="en"
        labels={LABELS}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    // Jan has index 0; ArrowRight should move to Feb (index 1)
    const jan = screen.getByRole('gridcell', { name: /^jan$/i })
    jan.focus()
    await user.keyboard('{ArrowRight}')

    const feb = screen.getByRole('gridcell', { name: /^feb$/i })
    expect(feb).toHaveAttribute('tabIndex', '0')
  })
})
