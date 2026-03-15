import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import type { Labels } from '../temporal-date-picker'

interface MonthPanelProps {
  viewDate: Temporal.PlainDate
  locale: string
  labels: Labels
  onSelect: (year: number, month: number) => void
  onClose: () => void
}

function getMonthLabels(locale: string): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2024, i, 1)
    return d.toLocaleString(locale, { month: 'short' })
  })
}

const MonthPanel = ({ viewDate, locale, labels, onSelect, onClose }: MonthPanelProps) => {
  const [localYear, setLocalYear] = useState(viewDate.year)
  const [focusedIdx, setFocusedIdx] = useState(viewDate.month - 1)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>(Array(12).fill(null))
  const monthLabels = getMonthLabels(locale)

  useEffect(() => {
    buttonRefs.current[focusedIdx]?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function moveFocus(next: number) {
    setFocusedIdx(next)
    buttonRefs.current[next]?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, idx: number) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        moveFocus((idx - 1 + 12) % 12)
        break
      case 'ArrowRight':
        e.preventDefault()
        moveFocus((idx + 1) % 12)
        break
      case 'ArrowUp':
        e.preventDefault()
        moveFocus((idx - 3 + 12) % 12)
        break
      case 'ArrowDown':
        e.preventDefault()
        moveFocus((idx + 3) % 12)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(localYear, idx + 1)
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  return (
    <div className="tdp-panel">
      <div className="tdp-header">
        <button
          type="button"
          className="tdp-nav"
          onClick={() => setLocalYear(y => y - 1)}
          aria-label={labels.prevYear}
        >
          ‹
        </button>
        <span className="tdp-month-label">{localYear}</span>
        <button
          type="button"
          className="tdp-nav"
          onClick={() => setLocalYear(y => y + 1)}
          aria-label={labels.nextYear}
        >
          ›
        </button>
      </div>
      <div role="grid" className="tdp-panel-grid" aria-label={labels.monthPanelTitle}>
        {[0, 1, 2, 3].map(row => (
          <div key={row} role="row" className="tdp-panel-row">
            {[0, 1, 2].map(col => {
              const idx = row * 3 + col
              const month = idx + 1
              const isCurrent = localYear === viewDate.year && month === viewDate.month
              return (
                <button
                  key={idx}
                  ref={el => {
                    buttonRefs.current[idx] = el
                  }}
                  role="gridcell"
                  type="button"
                  className={`tdp-panel-item${isCurrent ? ' tdp-panel-item--selected' : ''}`}
                  tabIndex={focusedIdx === idx ? 0 : -1}
                  aria-selected={isCurrent}
                  onClick={() => onSelect(localYear, month)}
                  onKeyDown={e => handleKeyDown(e, idx)}
                  onFocus={() => setFocusedIdx(idx)}
                >
                  {monthLabels[idx]}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export { MonthPanel }
