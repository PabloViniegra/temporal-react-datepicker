import { useState } from 'react'

const VIEW = {
  CALENDAR: 'calendar',
  MONTH: 'month',
  YEAR: 'year',
} as const

type View = (typeof VIEW)[keyof typeof VIEW]

function useJumpNav() {
  const [view, setView] = useState<View>(VIEW.CALENDAR)
  return { view, setView }
}

export { useJumpNav }
export type { View }
