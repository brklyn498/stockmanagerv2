import { useEffect } from 'react'

export type KeyboardShortcut = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  callback: () => void
  description: string
}

/**
 * Custom hook for managing keyboard shortcuts
 * @param shortcuts Array of keyboard shortcut configurations
 * @param enabled Whether shortcuts are currently enabled
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: Allow Cmd/Ctrl+K for search even in inputs
        const isSearchShortcut =
          event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)
        if (!isSearchShortcut) {
          return
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
        const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatches = shortcut.alt ? event.altKey : !event.altKey

        // For Cmd/Ctrl+K, allow either ctrl or meta
        const isGlobalShortcut =
          shortcut.key.toLowerCase() === 'k' && (shortcut.ctrl || shortcut.meta)
        const modifierMatches = isGlobalShortcut
          ? event.metaKey || event.ctrlKey
          : ctrlMatches && metaMatches && shiftMatches && altMatches

        if (keyMatches && modifierMatches) {
          event.preventDefault()
          event.stopPropagation()
          shortcut.callback()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}

/**
 * Default keyboard shortcuts for the application
 */
export const getDefaultShortcuts = (callbacks: {
  onSearch?: () => void
  onNavigate?: (path: string) => void
  onQuickActions?: {
    addProduct?: () => void
    recordMovement?: () => void
    createOrder?: () => void
  }
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = []

  // Global search (Cmd/Ctrl + K)
  if (callbacks.onSearch) {
    shortcuts.push({
      key: 'k',
      meta: true, // This will also work with ctrl on Windows
      callback: callbacks.onSearch,
      description: 'Open global search',
    })
  }

  // Navigation shortcuts
  if (callbacks.onNavigate) {
    shortcuts.push(
      {
        key: 'h',
        meta: true,
        callback: () => callbacks.onNavigate!('/'),
        description: 'Go to dashboard',
      },
      {
        key: 'p',
        meta: true,
        callback: () => callbacks.onNavigate!('/products'),
        description: 'Go to products',
      },
      {
        key: 'm',
        meta: true,
        callback: () => callbacks.onNavigate!('/stock-movements'),
        description: 'Go to stock movements',
      },
      {
        key: 'o',
        meta: true,
        callback: () => callbacks.onNavigate!('/orders'),
        description: 'Go to orders',
      }
    )
  }

  // Quick actions (Shift + key)
  if (callbacks.onQuickActions?.addProduct) {
    shortcuts.push({
      key: 'n',
      meta: true,
      shift: true,
      callback: callbacks.onQuickActions.addProduct,
      description: 'Add new product',
    })
  }

  if (callbacks.onQuickActions?.recordMovement) {
    shortcuts.push({
      key: 'r',
      meta: true,
      shift: true,
      callback: callbacks.onQuickActions.recordMovement,
      description: 'Record stock movement',
    })
  }

  if (callbacks.onQuickActions?.createOrder) {
    shortcuts.push({
      key: 'o',
      meta: true,
      shift: true,
      callback: callbacks.onQuickActions.createOrder,
      description: 'Create new order',
    })
  }

  return shortcuts
}
