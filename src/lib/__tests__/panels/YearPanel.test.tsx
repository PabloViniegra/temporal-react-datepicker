import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Temporal } from '@js-temporal/polyfill'
import { YearPanel } from '../../panels/YearPanel'
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

// viewDate.year = 2024 → windowStart = 2024 - 5 = 2019, shows 2019–2030
const VIEW_DATE = Temporal.PlainDate.from('2024-03-15')

describe('YearPanel', () => {
  it('renders 12 year buttons', () => {
    render(
      <YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    const grid = screen.getByRole('grid', { name: /select year/i })
    const cells = grid.querySelectorAll('[role="gridcell"]')
    expect(cells).toHaveLength(12)
  })

  it('marks the current year as selected', () => {
    render(
      <YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    const year2024 = screen.getByRole('gridcell', { name: '2024' })
    expect(year2024).toHaveAttribute('aria-selected', 'true')
  })

  it('other years are not selected', () => {
    render(
      <YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByRole('gridcell', { name: '2023' })).toHaveAttribute('aria-selected', 'false')
  })

  it('clicking a year calls onSelect with that year', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={onSelect} onClose={vi.fn()} />)

    await user.click(screen.getByRole('gridcell', { name: '2025' }))
    expect(onSelect).toHaveBeenCalledWith(2025)
  })

  it('previous window button shows the prior 12-year range', async () => {
    const user = userEvent.setup()
    render(
      <YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: /previous window/i }))
    // windowStart shifts to 2019 - 12 = 2007
    expect(screen.getByRole('gridcell', { name: '2007' })).toBeInTheDocument()
  })

  it('next window button shows the next 12-year range', async () => {
    const user = userEvent.setup()
    render(
      <YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: /next window/i }))
    // windowStart shifts to 2019 + 12 = 2031
    expect(screen.getByRole('gridcell', { name: '2031' })).toBeInTheDocument()
  })

  it('Escape key calls onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={vi.fn()} onClose={onClose} />)

    const year2024 = screen.getByRole('gridcell', { name: '2024' })
    year2024.focus()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('Enter key calls onSelect with the focused year', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={onSelect} onClose={vi.fn()} />)

    const year2026 = screen.getByRole('gridcell', { name: '2026' })
    year2026.focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(2026)
  })

  it('ArrowRight moves keyboard focus to the next year', async () => {
    const user = userEvent.setup()
    render(
      <YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    const year2019 = screen.getByRole('gridcell', { name: '2019' })
    year2019.focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('gridcell', { name: '2020' })).toHaveAttribute('tabIndex', '0')
  })

  it('ArrowLeft moves keyboard focus to the previous year', async () => {
    const user = userEvent.setup()
    render(
      <YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    const year2020 = screen.getByRole('gridcell', { name: '2020' })
    year2020.focus()
    await user.keyboard('{ArrowLeft}')

    expect(screen.getByRole('gridcell', { name: '2019' })).toHaveAttribute('tabIndex', '0')
  })

  it('ArrowDown moves keyboard focus down one row (3 years forward)', async () => {
    const user = userEvent.setup()
    render(
      <YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    const year2019 = screen.getByRole('gridcell', { name: '2019' })
    year2019.focus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('gridcell', { name: '2022' })).toHaveAttribute('tabIndex', '0')
  })

  it('ArrowUp moves keyboard focus up one row (3 years back)', async () => {
    const user = userEvent.setup()
    render(
      <YearPanel viewDate={VIEW_DATE} labels={LABELS} onSelect={vi.fn()} onClose={vi.fn()} />,
    )
    const year2022 = screen.getByRole('gridcell', { name: '2022' })
    year2022.focus()
    await user.keyboard('{ArrowUp}')

    expect(screen.getByRole('gridcell', { name: '2019' })).toHaveAttribute('tabIndex', '0')
  })
})
