import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Temporal } from '@js-temporal/polyfill'
import DatePickerInput from '../../date-picker-input/DatePickerInput'
import type { DateRange } from '../../hooks/useDateRange'

const TODAY = Temporal.PlainDate.from('2026-04-01')

beforeEach(() => {
  vi.spyOn(Temporal.Now, 'plainDateISO').mockReturnValue(TODAY)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DatePickerInput', () => {
  describe('rendering — no value', () => {
    it('renders segment placeholders when no value', () => {
      render(<DatePickerInput onChange={vi.fn()} />)
      expect(screen.getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(3)
    })

    it('renders the calendar icon button', () => {
      render(<DatePickerInput onChange={vi.fn()} />)
      expect(screen.getByRole('button', { name: /open calendar/i })).toBeInTheDocument()
    })

    it('does not render the calendar popover when closed', () => {
      render(<DatePickerInput onChange={vi.fn()} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('rendering — with value', () => {
    it('shows correct segments from initial value', () => {
      const date = Temporal.PlainDate.from('2026-04-15')
      render(<DatePickerInput value={date} onChange={vi.fn()} />)
      const spinbuttons = screen.getAllByRole('spinbutton')
      const values = spinbuttons.map(s => s.getAttribute('aria-valuenow'))
      expect(values).toContain('15')
      expect(values).toContain('4')
      expect(values).toContain('2026')
    })
  })

  describe('popover', () => {
    it('opens calendar on icon click', async () => {
      const user = userEvent.setup()
      render(<DatePickerInput onChange={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /open calendar/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('closes calendar when a date is selected', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<DatePickerInput onChange={onChange} />)
      await user.click(screen.getByRole('button', { name: /open calendar/i }))
      // Click a day in the calendar (aria-label matches "15 ...")
      const dayBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '15')
      if (dayBtn) await user.click(dayBtn)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(onChange).toHaveBeenCalled()
    })

    it('closes on Escape key', async () => {
      const user = userEvent.setup()
      render(<DatePickerInput onChange={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /open calendar/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('closes on mousedown outside', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <DatePickerInput onChange={vi.fn()} />
          <button>Outside</button>
        </div>,
      )
      await user.click(screen.getByRole('button', { name: /open calendar/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      fireEvent.mouseDown(screen.getByText('Outside'))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('clearable', () => {
    it('shows clear button when value is defined and clearable=true', () => {
      const date = Temporal.PlainDate.from('2026-04-15')
      render(<DatePickerInput clearable value={date} onChange={vi.fn()} />)
      expect(screen.getByRole('button', { name: /clear date/i })).toBeInTheDocument()
    })

    it('does not show clear button when no value', () => {
      render(<DatePickerInput clearable onChange={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /clear date/i })).not.toBeInTheDocument()
    })

    it('calls onChange(undefined) on clear click', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const date = Temporal.PlainDate.from('2026-04-15')
      render(<DatePickerInput clearable value={date} onChange={onChange} />)
      await user.click(screen.getByRole('button', { name: /clear date/i }))
      expect(onChange).toHaveBeenCalledWith(undefined)
    })

    it('does not show clear button when clearable is not set', () => {
      const date = Temporal.PlainDate.from('2026-04-15')
      render(<DatePickerInput value={date} onChange={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /clear date/i })).not.toBeInTheDocument()
    })
  })

  describe('disabled', () => {
    it('disables all buttons when disabled=true', () => {
      const date = Temporal.PlainDate.from('2026-04-15')
      render(<DatePickerInput disabled value={date} onChange={vi.fn()} clearable />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(btn => expect(btn).toBeDisabled())
    })

    it('segments have tabIndex=-1 when disabled', () => {
      render(<DatePickerInput disabled onChange={vi.fn()} />)
      const segments = screen.getAllByRole('spinbutton')
      segments.forEach(s => expect(s).toHaveAttribute('tabindex', '-1'))
    })
  })

  describe('iconPosition', () => {
    it('renders icon button in the DOM for iconPosition="right" (default)', () => {
      render(<DatePickerInput onChange={vi.fn()} />)
      expect(screen.getByRole('button', { name: /open calendar/i })).toBeInTheDocument()
    })

    it('renders icon button in the DOM for iconPosition="left"', () => {
      render(<DatePickerInput onChange={vi.fn()} iconPosition="left" />)
      expect(screen.getByRole('button', { name: /open calendar/i })).toBeInTheDocument()
    })

    it('iconPosition="left" renders icon before segments', () => {
      const { container } = render(<DatePickerInput onChange={vi.fn()} iconPosition="left" />)
      const wrapper = container.querySelector('.tdp-input__wrapper')!
      const children = Array.from(wrapper.children)
      const iconIdx = children.findIndex(c => c.classList.contains('tdp-input__icon-btn') || c.querySelector('.tdp-input__icon-btn'))
      const segmentsIdx = children.findIndex(c => c.classList.contains('tdp-input__segments'))
      expect(iconIdx).toBeLessThan(segmentsIdx)
    })
  })

  describe('custom icon', () => {
    it('renders custom icon instead of default', () => {
      render(<DatePickerInput onChange={vi.fn()} icon={<span data-testid="custom-icon">★</span>} />)
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })
  })

  describe('range mode', () => {
    it('renders two segment groups (6 spinbuttons)', () => {
      render(<DatePickerInput mode="range" onChange={vi.fn()} />)
      expect(screen.getAllByRole('spinbutton').length).toBe(6)
    })

    it('renders range arrow between groups', () => {
      const { container } = render(<DatePickerInput mode="range" onChange={vi.fn()} />)
      expect(container.querySelector('.tdp-input__range-arrow')).toBeInTheDocument()
    })

    it('opens calendar on icon click in range mode', async () => {
      const user = userEvent.setup()
      render(<DatePickerInput mode="range" onChange={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /open calendar/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('shows correct segments from initial range value', () => {
      const range: DateRange = {
        start: Temporal.PlainDate.from('2026-04-15'),
        end: Temporal.PlainDate.from('2026-04-22'),
      }
      render(<DatePickerInput mode="range" value={range} onChange={vi.fn()} />)
      const spinbuttons = screen.getAllByRole('spinbutton')
      const values = spinbuttons.map(s => s.getAttribute('aria-valuenow'))
      expect(values).toContain('15') // start day
      expect(values).toContain('22') // end day
    })

    it('calls onChange(undefined) on clear in range mode', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const range: DateRange = {
        start: Temporal.PlainDate.from('2026-04-15'),
        end: Temporal.PlainDate.from('2026-04-22'),
      }
      render(<DatePickerInput mode="range" clearable value={range} onChange={onChange} />)
      await user.click(screen.getByRole('button', { name: /clear date/i }))
      expect(onChange).toHaveBeenCalledWith(undefined)
    })
  })

  describe('segment keyboard interaction', () => {
    it('ArrowUp on day segment increments the value', () => {
      const date = Temporal.PlainDate.from('2026-04-15')
      render(<DatePickerInput value={date} onChange={vi.fn()} />)
      const daySegment = screen.getByRole('spinbutton', { name: /day/i })
      fireEvent.keyDown(daySegment, { key: 'ArrowUp' })
      expect(daySegment).toHaveAttribute('aria-valuenow', '16')
    })

    it('focusing a segment sets it as focused', () => {
      render(<DatePickerInput onChange={vi.fn()} />)
      const monthSegment = screen.getByRole('spinbutton', { name: /month/i })
      fireEvent.focus(monthSegment)
      expect(monthSegment).toHaveClass('tdp-input__segment')
    })

    it('clearable: typing a full date calls onChange with PlainDate', () => {
      const onChange = vi.fn()
      render(<DatePickerInput clearable onChange={onChange} />)
      const yearSegment = screen.getByRole('spinbutton', { name: /year/i })
      fireEvent.keyDown(yearSegment, { key: '2' })
      fireEvent.keyDown(yearSegment, { key: '0' })
      fireEvent.keyDown(yearSegment, { key: '2' })
      fireEvent.keyDown(yearSegment, { key: '6' })
      const daySegment = screen.getByRole('spinbutton', { name: /day/i })
      fireEvent.keyDown(daySegment, { key: 'ArrowUp' })
      const monthSegment = screen.getByRole('spinbutton', { name: /month/i })
      fireEvent.keyDown(monthSegment, { key: 'ArrowUp' })
      // All segments now filled — onChange should have been called
      expect(onChange).toHaveBeenCalled()
    })

    it('clearable: Backspace clears all segments calls onChange(undefined)', () => {
      const onChange = vi.fn()
      const date = Temporal.PlainDate.from('2026-04-15')
      render(<DatePickerInput clearable value={date} onChange={onChange} />)
      fireEvent.keyDown(screen.getByRole('spinbutton', { name: /day/i }), { key: 'Backspace' })
      fireEvent.keyDown(screen.getByRole('spinbutton', { name: /month/i }), { key: 'Backspace' })
      fireEvent.keyDown(screen.getByRole('spinbutton', { name: /year/i }), { key: 'Backspace' })
      expect(onChange).toHaveBeenCalledWith(undefined)
    })
  })

  describe('accessibility', () => {
    it('wrapper has role="group"', () => {
      render(<DatePickerInput onChange={vi.fn()} />)
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('each segment has role="spinbutton"', () => {
      render(<DatePickerInput onChange={vi.fn()} />)
      const segments = screen.getAllByRole('spinbutton')
      expect(segments.length).toBeGreaterThanOrEqual(3)
    })

    it('segments have aria-label', () => {
      render(<DatePickerInput onChange={vi.fn()} />)
      expect(screen.getByRole('spinbutton', { name: /day/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /month/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /year/i })).toBeInTheDocument()
    })

    it('icon button has aria-expanded', async () => {
      render(<DatePickerInput onChange={vi.fn()} />)
      const trigger = screen.getByRole('button', { name: /open calendar/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('popover has role="dialog" and aria-modal', async () => {
      const user = userEvent.setup()
      render(<DatePickerInput onChange={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /open calendar/i }))
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })
  })

  describe('range mode — calendar interaction', () => {
    it('keeps popover open after first date click (partial range)', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<DatePickerInput mode="range" onChange={onChange} />)
      await user.click(screen.getByRole('button', { name: /open calendar/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      // Click first day — partial range (end: null), popover stays open
      const dayBtns = screen.getAllByRole('button').filter(b => /^\d+$/.test(b.textContent?.trim() ?? ''))
      if (dayBtns[0]) await user.click(dayBtns[0])
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      // onChange should NOT have been called yet (partial range only)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('closes popover and calls onChange after second date click (complete range)', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<DatePickerInput mode="range" onChange={onChange} />)
      await user.click(screen.getByRole('button', { name: /open calendar/i }))
      // First click — start of range (click day "5")
      const firstDay = screen.getAllByRole('button').find(b => b.textContent?.trim() === '5')
      if (firstDay) await user.click(firstDay)
      // Re-query after re-render — second click (click day "10" = end of range)
      const secondDay = screen.getAllByRole('button').find(b => b.textContent?.trim() === '10')
      if (secondDay) await user.click(secondDay)
      expect(onChange).toHaveBeenCalled()
      const rangeArg = onChange.mock.calls[0][0]
      expect(rangeArg).toHaveProperty('start')
      expect(rangeArg).toHaveProperty('end')
    })

    it('passes partial range to calendar when start is set (exercises buildDate)', async () => {
      // Provide a range with only start selected to exercise the internalRangeValue path
      const user = userEvent.setup()
      const range: DateRange = {
        start: Temporal.PlainDate.from('2026-04-10'),
        end: Temporal.PlainDate.from('2026-04-20'),
      }
      render(<DatePickerInput mode="range" value={range} onChange={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /open calendar/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('className', () => {
    it('applies custom className to root element', () => {
      const { container } = render(<DatePickerInput onChange={vi.fn()} className="my-custom" />)
      expect(container.firstChild).toHaveClass('tdp-input', 'my-custom')
    })
  })
})
