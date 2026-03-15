import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import type { Labels } from '../temporal-date-picker'

interface YearPanelProps {
  viewDate: Temporal.PlainDate
  labels: Labels
  onSelect: (year: number) => void
  onClose: () => void
}

const YearPanel = ({ viewDate, labels, onSelect, onClose }: YearPanelProps) => {
  const [windowStart, setWindowStart] = useState(viewDate.year - 5)
  const initialIdx = Math.max(0, Math.min(11, viewDate.year - (viewDate.year - 5)))
  const [focusedIdx, setFocusedIdx] = useState(initialIdx)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>(Array(12).fill(null))

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
        onSelect(windowStart + idx)
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
          onClick={() => setWindowStart(s => s - 12)}
          aria-label={labels.prevYearWindow}
        >
          ‹
        </button>
        <span className="tdp-month-label">
          {windowStart} – {windowStart + 11}
        </span>
        <button
          type="button"
          className="tdp-nav"
          onClick={() => setWindowStart(s => s + 12)}
          aria-label={labels.nextYearWindow}
        >
          ›
        </button>
      </div>
      <div role="grid" className="tdp-panel-grid" aria-label={labels.yearPanelTitle}>
        {[0, 1, 2, 3].map(row => (
          <div key={row} role="row" className="tdp-panel-row">
            {[0, 1, 2].map(col => {
              const idx = row * 3 + col
              const year = windowStart + idx
              const isCurrent = year === viewDate.year
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
                  onClick={() => onSelect(year)}
                  onKeyDown={e => handleKeyDown(e, idx)}
                  onFocus={() => setFocusedIdx(idx)}
                >
                  {year}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export { YearPanel }
