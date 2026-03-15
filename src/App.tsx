import { useState } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import { TemporalDatePicker } from './lib'
import type { DateRange } from './lib'
import './App.css'

function formatDate(date: Temporal.PlainDate, locale: string): string {
  return date.toLocaleString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatRange(range: DateRange | undefined, locale: string): string {
  if (!range) return ''
  const start = formatDate(range.start, locale)
  if (!range.end) return `${start} → …`
  return `${start} → ${formatDate(range.end, locale)}`
}

// Disable weekends for the disabled-dates example
function isWeekend(date: Temporal.PlainDate): boolean {
  return date.dayOfWeek >= 6
}

function App() {
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en'

  const [single, setSingle] = useState<Temporal.PlainDate | undefined>(undefined)
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const [clearable, setClearable] = useState<Temporal.PlainDate | undefined>(undefined)

  return (
    <div className="demo-root">
      {/* Noise overlay */}
      <div className="demo-noise" aria-hidden="true" />

      <main className="demo-hero">
        {/* Badge */}
        <div className="demo-badge-row">
          <span className="demo-badge">
            <span className="demo-badge-dot" />
            @js-temporal/polyfill
          </span>
        </div>

        {/* Title */}
        <h1 className="demo-title">
          Temporal<br />
          <span className="demo-title-accent">Date Picker</span>
        </h1>

        <p className="demo-subtitle">
          Immutable dates. Correct calendar arithmetic.<br />
          Zero legacy&nbsp;<code className="demo-code-inline">Date</code>&nbsp;object.
        </p>

        {/* Examples grid */}
        <div className="demo-grid">

          {/* Single date */}
          <div className="demo-card">
            <div className="demo-card-label">Single date</div>
            <TemporalDatePicker value={single} onChange={setSingle} showWeekNumbers />
            <div className="demo-date-output" aria-live="polite">
              {single
                ? <span className="demo-date-value">{formatDate(single, locale)}</span>
                : <span className="demo-date-hint">← pick a date</span>
              }
            </div>
          </div>

          {/* Range */}
          <div className="demo-card">
            <div className="demo-card-label">Date range</div>
            <TemporalDatePicker
              mode="range"
              clearable
              value={range}
              onChange={setRange}
            />
            <div className="demo-date-output" aria-live="polite">
              {range
                ? <span className="demo-date-value">{formatRange(range, locale)}</span>
                : <span className="demo-date-hint">← pick start date</span>
              }
            </div>
          </div>

          {/* Disabled weekends + clearable */}
          <div className="demo-card">
            <div className="demo-card-label">Disabled weekends + clearable</div>
            <TemporalDatePicker
              clearable
              value={clearable}
              onChange={setClearable}
              isDateDisabled={isWeekend}
            />
            <div className="demo-date-output" aria-live="polite">
              {clearable
                ? <span className="demo-date-value">{formatDate(clearable, locale)}</span>
                : <span className="demo-date-hint">weekdays only</span>
              }
            </div>
          </div>

        </div>
      </main>

      {/* Footer with code snippet */}
      <footer className="demo-footer">
        <div className="demo-snippet">
          <span className="demo-snippet-comment">{'// range example'}</span>
          <br />
          <span className="demo-snippet-tag">{'<TemporalDatePicker'}</span>
          <br />
          <span className="demo-snippet-prop">{'  mode'}</span>
          <span className="demo-snippet-op">{'="range"'}</span>
          <br />
          <span className="demo-snippet-prop">{'  clearable'}</span>
          <br />
          <span className="demo-snippet-prop">{'  value'}</span>
          <span className="demo-snippet-op">{'={range}'}</span>
          <br />
          <span className="demo-snippet-prop">{'  onChange'}</span>
          <span className="demo-snippet-op">{'={setRange}'}</span>
          <br />
          <span className="demo-snippet-tag">{'/>'}</span>
        </div>

        <div className="demo-footer-links">
          <a
            className="demo-footer-link"
            href="https://tc39.es/proposal-temporal/docs/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Temporal API docs ↗
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
