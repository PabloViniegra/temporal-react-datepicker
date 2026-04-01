import { useState, useRef, useEffect } from 'react'

interface UseDatePickerPopoverReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  popoverRef: React.RefObject<HTMLDivElement | null>
  inputWrapperRef: React.RefObject<HTMLDivElement | null>
}

function useDatePickerPopover(): UseDatePickerPopoverReturn {
  const [isOpen, setIsOpen] = useState(false)

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const inputWrapperRef = useRef<HTMLDivElement | null>(null)

  function open() {
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  // Click-outside detection
  useEffect(() => {
    if (!isOpen) return

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      const insidePopover = popoverRef.current?.contains(target) ?? false
      const insideWrapper = inputWrapperRef.current?.contains(target) ?? false
      if (!insidePopover && !insideWrapper) {
        setIsOpen(false)
        // No focus return on outside click — user clicked elsewhere intentionally
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen])

  // Move focus into popover when it opens
  useEffect(() => {
    if (!isOpen) return
    // Defer to allow the popover to render first
    const id = setTimeout(() => {
      const firstFocusable = popoverRef.current?.querySelector<HTMLElement>(
        'button, [tabindex]:not([tabindex="-1"])',
      )
      firstFocusable?.focus()
    }, 0)
    return () => clearTimeout(id)
  }, [isOpen])

  return { isOpen, open, close, triggerRef, popoverRef, inputWrapperRef }
}

export { useDatePickerPopover }
export type { UseDatePickerPopoverReturn }
