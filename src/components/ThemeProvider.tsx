import { createContext, useContext, useEffect, useState } from "react"
import { 
  CustomTheme, 
  getCustomThemes, 
  getActiveCustomTheme, 
  setActiveCustomTheme, 
  applyCustomTheme, 
  removeCustomTheme 
} from "@/lib/utils"

export type Theme = "dark" | "light" | "system"

export type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  customThemes: CustomTheme[]
  refreshCustomThemes: () => void
  isCustomTheme: boolean
  activeCustomTheme: CustomTheme | null
  setActiveCustomTheme: (themeId: string | null) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  customThemes: [],
  refreshCustomThemes: () => null,
  isCustomTheme: false,
  activeCustomTheme: null,
  setActiveCustomTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check standard theme storage first
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })
  
  const [customThemeId, setCustomThemeId] = useState<string | null>(() => {
    return getActiveCustomTheme()
  })
  
  // Initialize synchronously to avoid a flash of un-themed content during the
  // first render. Without this, `customThemes` would start out empty, causing
  // `activeCustomTheme` to be `null` and the provider to momentarily fall back
  // to the default palette until `useEffect` repopulated them.
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(() => getCustomThemes())
  
  // Load custom themes on mount
  useEffect(() => {
    refreshCustomThemes()
  }, [])

  const refreshCustomThemes = () => {
    setCustomThemes(getCustomThemes())
  }

  // Get the active custom theme (if any)
  const activeCustomTheme = customThemes.find(t => t.id === customThemeId) || null

  // Determine if the current theme should be treated as a custom theme *only* if we
  // successfully resolved the activeCustomTheme object. This prevents a stale
  // customThemeId reference (e.g. after deleting a theme) from causing the
  // provider to bail out of the custom-theme branch where `activeCustomTheme`
  // would be `null` and the standard theme branch would run instead.
  const isCustomTheme = !!activeCustomTheme

  useEffect(() => {
    const root = window.document.documentElement

    // Remove any existing theme classes and custom variables
    root.classList.remove("light", "dark")
    removeCustomTheme()

    const applyTheme = () => {
      if (isCustomTheme && activeCustomTheme) {
        // Apply custom theme - use the current theme toggle for light/dark mode
        let mode: 'light' | 'dark' = 'light'
        
        if (theme === 'dark') {
          mode = 'dark'
        } else if (theme === 'light') {
          mode = 'light'
        } else if (theme === 'system') {
          mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light'
        }
        
        // Apply the custom theme variables
        applyCustomTheme(activeCustomTheme, mode)
        
        // Still add the light/dark class for any CSS selectors that depend on it
        // But the custom variables will override the default ones due to specificity
        root.classList.add(mode)
      } else {
        // Apply standard theme
        if (theme === "system") {
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light"

          root.classList.add(systemTheme)
        } else {
          root.classList.add(theme)
        }
      }
    }

    applyTheme()

    // Listen for system theme changes when using system theme (for both custom and standard themes)
    if (theme === 'system') {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => {
        if (isCustomTheme && activeCustomTheme) {
          const mode = mediaQuery.matches ? "dark" : "light"
          // Remove current classes and reapply
          root.classList.remove("light", "dark")
          applyCustomTheme(activeCustomTheme, mode)
          root.classList.add(mode)
        } else {
          root.classList.remove("light", "dark")
          root.classList.add(mediaQuery.matches ? "dark" : "light")
        }
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, isCustomTheme, activeCustomTheme])

  const setTheme = (newTheme: Theme) => {
    // Always set the light/dark mode for both standard and custom themes
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  const handleSetActiveCustomTheme = (themeId: string | null) => {
    setActiveCustomTheme(themeId)
    setCustomThemeId(themeId)
  }

  const value = {
    theme,
    setTheme,
    customThemes,
    refreshCustomThemes,
    isCustomTheme,
    activeCustomTheme,
    setActiveCustomTheme: handleSetActiveCustomTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
} 