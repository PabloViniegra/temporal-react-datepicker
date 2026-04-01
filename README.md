# temporal-react-datepicker

[![Documentation](https://img.shields.io/badge/docs-live-blue?style=flat-square)](https://pabloviniegra.github.io/temporal-react-datepicker-docs/)

A high-performance, accessible React date picker built on the [JavaScript Temporal API](https://tc39.es/proposal-temporal/docs/). Uses `Temporal.PlainDate` for all date logic — immutable, correct calendar arithmetic, no legacy `Date` object.

**[Documentation & live examples →](https://pabloviniegra.github.io/temporal-react-datepicker-docs/)**

## Requirements

- React 19+
- `@js-temporal/polyfill` 0.5.1+

## Installation

```bash
npm install temporal-react-datepicker @js-temporal/polyfill
# or
pnpm add temporal-react-datepicker @js-temporal/polyfill
```

## Basic usage

### TemporalDatePicker — standalone calendar

```tsx
import { useState } from 'react'
import { Temporal } from '@js-temporal/polyfill'
import { TemporalDatePicker } from 'temporal-react-datepicker'

function App() {
  const [date, setDate] = useState<Temporal.PlainDate | undefined>(undefined)

  return <TemporalDatePicker value={date} onChange={setDate} />
}
```

### DatePickerInput — form field (new in 1.1.0)

A locale-aware segmented input (day / month / year) with a popover calendar. The segment order adapts automatically to the user's locale (`es-ES` → `dd/mm/yyyy`, `en-US` → `mm/dd/yyyy`, `ja-JP` → `yyyy/mm/dd`).

```tsx
import { DatePickerInput } from 'temporal-react-datepicker'

function App() {
  const [date, setDate] = useState<Temporal.PlainDate | undefined>(undefined)

  return <DatePickerInput clearable value={date} onChange={setDate} />
}
```

#### DatePickerInput props

| Prop | Type | Default | Description |
|---|---|---|---|
| `mode` | `'single' \| 'range'` | `'single'` | Selection mode. |
| `value` | `Temporal.PlainDate \| DateRange \| undefined` | — | Controlled value. |
| `onChange` | `(date) => void` | — | Called when a date or complete range is selected. |
| `clearable` | `boolean` | `false` | Show a `×` button to reset the value. |
| `icon` | `ReactNode` | `<CalendarIcon />` | Replace the calendar icon. |
| `iconPosition` | `'left' \| 'right'` | `'right'` | Position of the icon relative to the segments. |
| `disabled` | `boolean` | `false` | Disable all interaction. |
| `locale` | `string` | `navigator.language` | Controls segment order and separator. |
| `isDateDisabled` | `(date: Temporal.PlainDate) => boolean` | — | Disable specific dates in the popover. |
| `labels` | `Partial<Labels>` | English | Override any UI string. |
| `className` | `string` | `''` | Additional CSS class on the root. |

#### DatePickerInput keyboard interaction

| Key | Action |
|---|---|
| `↑` / `↓` | Increment / decrement the active segment (day and month wrap). |
| `Tab` / `Shift+Tab` | Move to the next / previous segment. |
| `0–9` | Type a value directly, auto-advances when unambiguous. |
| `Backspace` | Clear the active segment. |
| `Enter` / `Space` | Open the calendar popover. |
| `Escape` | Close the calendar popover. |

## Date range selection

```tsx
import type { DateRange } from 'temporal-react-datepicker'

const [range, setRange] = useState<DateRange | undefined>(undefined)

// Standalone calendar
<TemporalDatePicker mode="range" clearable value={range} onChange={setRange} />

// Input field
<DatePickerInput mode="range" clearable value={range} onChange={setRange} />
```

`DateRange` is `{ start: Temporal.PlainDate; end: Temporal.PlainDate | null }`. After the first click `end` is `null`; after the second click both dates are set. `DatePickerInput` calls `onChange` only when the range is complete.

## TemporalDatePicker props

The component uses a discriminated union — the available props depend on `mode` and `clearable`.

### Shared props

| Prop | Type | Default | Description |
|---|---|---|---|
| `mode` | `'single' \| 'range'` | `'single'` | Selection mode. |
| `clearable` | `boolean` | `false` | Show a `×` button to reset the selection when a value is set. |
| `isDateDisabled` | `(date: Temporal.PlainDate) => boolean` | `undefined` | Return `true` to disable (and block) a specific date. |
| `showWeekNumbers` | `boolean` | `false` | Show ISO week numbers as an extra column on the left. |
| `className` | `string` | `''` | Additional CSS class on the root element. |
| `locale` | `string` | `navigator.language` | BCP 47 locale tag for month/weekday labels. |
| `labels` | `Partial<Labels>` | English strings | Override any UI string (aria-labels, panel titles, range context). |
| `renderDayContent` | `(date, state: DayState) => ReactNode` | `undefined` | Custom renderer for each day cell. Falls back to the day number. |

### `mode="single"` props

| Prop | Type | Description |
|---|---|---|
| `value` | `Temporal.PlainDate \| undefined` | Currently selected date. |
| `onChange` | `(date: Temporal.PlainDate) => void` | Called on selection. |

When `clearable={true}`, `onChange` is widened to `(date: Temporal.PlainDate \| undefined) => void`.

### `mode="range"` props

| Prop | Type | Description |
|---|---|---|
| `value` | `DateRange \| undefined` | Currently selected range. |
| `onChange` | `(range: DateRange) => void` | Called on each click. Fires with `end: null` after the first click. |

When `clearable={true}`, `onChange` is `(range: DateRange \| undefined) => void`.

## DayState

The `renderDayContent` callback receives a `DayState` object as its second argument:

```ts
interface DayState {
  selected: boolean      // true in single mode when this date === value
  inRange: boolean       // true for days between range.start and range.end
  isRangeStart: boolean  // true when this date === range.start
  isRangeEnd: boolean    // true when this date === range.end
}
```

```tsx
// Bold weight for selected day
<TemporalDatePicker
  value={date}
  onChange={setDate}
  renderDayContent={(d, { selected }) => (
    <span style={{ fontWeight: selected ? 800 : 400 }}>{d.day}</span>
  )}
/>
```

```tsx
// Dot indicator on Fridays (payday)
<TemporalDatePicker
  value={date}
  onChange={setDate}
  renderDayContent={(d, { selected }) => (
    <span style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {d.day}
      {d.dayOfWeek === 5 && (
        <span style={{
          width: 3, height: 3, borderRadius: '50%',
          background: selected ? 'currentColor' : '#38bdf8'
        }} />
      )}
    </span>
  )}
/>
```

```tsx
// Custom badge for range mode (shows "S" / "E" on start and end)
<TemporalDatePicker
  mode="range"
  value={range}
  onChange={setRange}
  renderDayContent={(d, { isRangeStart, isRangeEnd, inRange }) => (
    <span style={{ position: 'relative' }}>
      {d.day}
      {isRangeStart && (
        <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 8, fontWeight: 700 }}>S</span>
      )}
      {isRangeEnd && (
        <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 8, fontWeight: 700 }}>E</span>
      )}
    </span>
  )}
/>
```

```tsx
// Highlight days from an external data source (e.g. events)
const EVENTS = new Set(['2026-03-10', '2026-03-18', '2026-03-25'])

<TemporalDatePicker
  value={date}
  onChange={setDate}
  renderDayContent={(d, { selected }) => (
    <span style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {d.day}
      {EVENTS.has(d.toString()) && (
        <span style={{
          width: 4, height: 4, borderRadius: '50%',
          background: selected ? 'white' : '#f472b6'
        }} />
      )}
    </span>
  )}
/>
```

## Disabled dates

Return `true` from `isDateDisabled` to block a date. Disabled days are not clickable and not keyboard-focusable. In range mode, disabled dates inside the selected range are skipped — they do not prevent the range from spanning across them.

```tsx
// Weekends only
<TemporalDatePicker
  value={date}
  onChange={setDate}
  isDateDisabled={d => d.dayOfWeek >= 6}
/>
```

```tsx
// Past dates (relative to today)
const today = Temporal.Now.plainDateISO()
<TemporalDatePicker
  value={date}
  onChange={setDate}
  isDateDisabled={d => Temporal.PlainDate.compare(d, today) < 0}
/>
```

```tsx
// Future dates — only allow selecting up to today
<TemporalDatePicker
  value={date}
  onChange={setDate}
  isDateDisabled={d => Temporal.PlainDate.compare(d, today) > 0}
/>
```

```tsx
// Specific blocked dates (e.g. bank holidays)
const HOLIDAYS = new Set(['2026-01-01', '2026-12-25', '2026-12-26'])
<TemporalDatePicker
  value={date}
  onChange={setDate}
  isDateDisabled={d => HOLIDAYS.has(d.toString())}
/>
```

```tsx
// Combined: no weekends AND no past dates
<TemporalDatePicker
  value={date}
  onChange={setDate}
  isDateDisabled={d =>
    d.dayOfWeek >= 6 ||
    Temporal.PlainDate.compare(d, Temporal.Now.plainDateISO()) < 0
  }
/>
```

```tsx
// Range mode with disabled dates — disabled dates inside the range are skipped
<TemporalDatePicker
  mode="range"
  value={range}
  onChange={setRange}
  isDateDisabled={d => d.dayOfWeek >= 6}
/>
```

## Navigation

Click the **month name** or **year** in the header to jump directly to a month or year selector panel. Use `Escape` to return to the calendar without making a selection.

## Locale

The `locale` prop accepts any [BCP 47 language tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locales_argument). It controls month names, weekday labels, and day `aria-label` strings. Defaults to `navigator.language`.

```tsx
// Spanish (Spain)
<TemporalDatePicker value={date} onChange={setDate} locale="es-ES" />

// English (US)
<TemporalDatePicker value={date} onChange={setDate} locale="en-US" />

// French
<TemporalDatePicker value={date} onChange={setDate} locale="fr-FR" />

// Japanese
<TemporalDatePicker value={date} onChange={setDate} locale="ja-JP" />

// Arabic (right-to-left script — layout RTL must be handled by the consumer)
<TemporalDatePicker value={date} onChange={setDate} locale="ar-SA" />

// Portuguese (Brazil)
<TemporalDatePicker value={date} onChange={setDate} locale="pt-BR" />
```

To follow the browser locale automatically (default behaviour):

```tsx
<TemporalDatePicker value={date} onChange={setDate} />
// equivalent to:
<TemporalDatePicker value={date} onChange={setDate} locale={navigator.language} />
```

To let the user switch locale at runtime, just pass a state variable:

```tsx
const [locale, setLocale] = useState('en-US')

<select onChange={e => setLocale(e.target.value)}>
  <option value="en-US">English</option>
  <option value="es-ES">Español</option>
  <option value="fr-FR">Français</option>
  <option value="de-DE">Deutsch</option>
</select>

<TemporalDatePicker value={date} onChange={setDate} locale={locale} />
```

## Labels (i18n for UI strings)

The `locale` prop controls date formatting (month names, weekday headers, day `aria-label`s) via the browser's `Intl` API. UI strings such as button labels, panel titles, and range context suffixes are controlled separately via the `labels` prop.

The default language is **English**. Pass `Partial<Labels>` to override any string:

```tsx
import type { Labels } from 'temporal-react-datepicker'

const spanishLabels: Partial<Labels> = {
  prevMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  clearSelection: 'Limpiar selección',
  selectMonth: name => `Seleccionar mes, actualmente ${name}`,
  selectYear: year => `Seleccionar año, actualmente ${year}`,
  weekNumberHeader: 'Semana',
  weekNumber: n => `Semana ${n}`,
  rangeStart: ', inicio de rango',
  rangeEnd: ', fin de rango',
  inRange: ', dentro del rango',
  monthPanelAnnouncement: 'Selector de mes',
  yearPanelAnnouncement: 'Selector de año',
  prevYear: 'Año anterior',
  nextYear: 'Año siguiente',
  monthPanelTitle: 'Seleccionar mes',
  prevYearWindow: 'Ventana anterior',
  nextYearWindow: 'Ventana siguiente',
  yearPanelTitle: 'Seleccionar año',
}

<TemporalDatePicker value={date} onChange={setDate} locale="es-ES" labels={spanishLabels} />
```

You only need to supply the strings you want to override — the rest fall back to English defaults. For example, to only translate the range context suffixes for French:

```tsx
<TemporalDatePicker
  mode="range"
  value={range}
  onChange={setRange}
  locale="fr-FR"
  labels={{
    rangeStart: ', début de la plage',
    rangeEnd: ', fin de la plage',
    inRange: ', dans la plage',
  }}
/>
```

### `Labels` interface

```ts
interface Labels {
  // Calendar header buttons
  prevMonth: string
  nextMonth: string
  clearSelection: string
  selectMonth: (monthName: string) => string   // e.g. "Select month, currently March"
  selectYear: (year: number) => string         // e.g. "Select year, currently 2026"
  // Week number column
  weekNumberHeader: string                     // column header aria-label
  weekNumber: (weekNum: number) => string      // row aria-label, e.g. "Week 12"
  // Range context (appended to day aria-label)
  rangeStart: string                           // e.g. ", range start"
  rangeEnd: string                             // e.g. ", range end"
  inRange: string                              // e.g. ", in range"
  // aria-live announcements on panel switch
  monthPanelAnnouncement: string
  yearPanelAnnouncement: string
  // Month panel (jump nav)
  prevYear: string
  nextYear: string
  monthPanelTitle: string
  // Year panel (jump nav)
  prevYearWindow: string
  nextYearWindow: string
  yearPanelTitle: string
}
```

## Theming

Override CSS custom properties on `.temporal-datepicker` or any ancestor:

```css
/* Emerald theme */
.my-app .temporal-datepicker {
  --tdp-accent:     #10b981;
  --tdp-accent-fg:  #ffffff;
  --tdp-today-text: #10b981;
  --tdp-today-ring: #10b981;
}
```

### CSS tokens

| Token | Default (dark) | Description |
|---|---|---|
| `--tdp-accent` | `#38bdf8` | Accent color (selected day, focus ring, range edges). |
| `--tdp-accent-fg` | `#0f172a` | Foreground on accent. |
| `--tdp-bg` | `#1e293b` | Calendar background. |
| `--tdp-border` | `#334155` | Border color. |
| `--tdp-text` | `#e2e8f0` | Primary text. |
| `--tdp-text-muted` | `#64748b` | Muted text (weekday headers, week numbers). |
| `--tdp-day-hover-bg` | `rgba(255,255,255,0.06)` | Day hover background. |
| `--tdp-today-text` | `#38bdf8` | Today text color. |
| `--tdp-today-ring` | `#38bdf8` | Today indicator dot. |
| `--tdp-range-bg` | `rgba(56,189,248,0.15)` | Background for days inside a range. |
| `--tdp-range-edge-bg` | `var(--tdp-accent)` | Background for range start/end. |
| `--tdp-range-edge-text` | `var(--tdp-accent-fg)` | Foreground for range start/end. |
| `--tdp-disabled-text` | `#334155` | Disabled day text. |
| `--tdp-weeknum-text` | `var(--tdp-text-muted)` | Week number column text. |
| `--tdp-radius` | `12px` | Container border radius. |
| `--tdp-day-radius` | `8px` | Day button border radius. |
| `--tdp-day-size` | `36px` | Day button size. |
| `--tdp-shadow` | (dark shadow) | Container box shadow. |

The default theme is dark. Light mode is applied automatically via `@media (prefers-color-scheme: light)`.

## Keyboard navigation

| Key | Action |
|---|---|
| `←` / `→` | Previous / next day |
| `↑` / `↓` | Same day, previous / next week |
| `Page Up` / `Page Down` | Previous / next month |
| `Home` | First day of the current week |
| `End` | Last day of the current week |
| `Enter` / `Space` | Select the focused date |
| `Tab` | Exit the calendar grid |

In month/year panels: `← → ↑ ↓` navigate between items, `Enter`/`Space` confirms, `Escape` returns to calendar.


## Accessibility

- `role="grid"` on the calendar with `role="columnheader"` / `role="gridcell"` per cell.
- Full `aria-label` on every day button (e.g. "lunes, 17 de marzo de 2026").
- Range days include context: "inicio de rango", "fin de rango", "dentro del rango".
- Today marked with `aria-current="date"`.
- Selected dates use `aria-selected="true"`.
- Disabled days use the native `disabled` attribute.
- Panel switches announced via `aria-live="polite"`.
- All interactive elements expose `:focus-visible` styles.

## Development

```bash
pnpm install       # install dependencies
pnpm dev           # start demo app at http://localhost:5173
pnpm build         # build library to /dist
pnpm type-check    # TypeScript compiler check
pnpm lint          # ESLint
```

## Changelog

### 1.1.0

- **New component:** `DatePickerInput` — a form-ready segmented date input (day/month/year) with a popover calendar. Supports single and range mode, locale-aware format order, custom icon, clearable, and full keyboard accessibility.
- **New export:** `CalendarIcon` — the default SVG calendar icon, re-exported for custom use.

### 1.0.1

- **Bug fix:** In range mode, selecting an end date beyond disabled dates now works correctly. Previously, any disabled date between the range start and end would block the selection entirely. Now the range is confirmed with the chosen endpoints and disabled dates within the span are skipped. The hover preview also shows the full range without clipping at disabled dates.

### 1.0.0

- Initial release.

## License

MIT
