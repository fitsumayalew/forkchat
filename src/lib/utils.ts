import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Theme utilities
export interface CustomTheme {
  id: string;
  name: string;
  description: string;
  light: Record<string, string>;
  dark: Record<string, string>;
  createdAt: string;
}

export const CUSTOM_THEMES_STORAGE_KEY = 'forkchat-custom-themes';
export const ACTIVE_CUSTOM_THEME_KEY = 'forkchat-active-custom-theme';

/**
 * Get all custom themes from localStorage
 */
export function getCustomThemes(): CustomTheme[] {
  try {
    const stored = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get custom themes:', error);
    return [];
  }
}

/**
 * Save a custom theme to localStorage
 */
export function saveCustomTheme(theme: Omit<CustomTheme, 'id' | 'createdAt'>): CustomTheme {
  try {
    const existingThemes = getCustomThemes();
    const newTheme: CustomTheme = {
      ...theme,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedThemes = [...existingThemes, newTheme];
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(updatedThemes));
    
    return newTheme;
  } catch (error) {
    console.error('Failed to save custom theme:', error);
    throw new Error('Failed to save custom theme');
  }
}

/**
 * Delete a custom theme from localStorage
 */
export function deleteCustomTheme(themeId: string): void {
  try {
    const existingThemes = getCustomThemes();
    const updatedThemes = existingThemes.filter(theme => theme.id !== themeId);
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(updatedThemes));
    
    // If the deleted theme was active, clear it
    const activeTheme = getActiveCustomTheme();
    if (activeTheme === themeId) {
      setActiveCustomTheme(null);
    }
  } catch (error) {
    console.error('Failed to delete custom theme:', error);
    throw new Error('Failed to delete custom theme');
  }
}

/**
 * Get the currently active custom theme ID
 */
export function getActiveCustomTheme(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CUSTOM_THEME_KEY);
  } catch (error) {
    console.error('Failed to get active custom theme:', error);
    return null;
  }
}

/**
 * Set the active custom theme
 */
export function setActiveCustomTheme(themeId: string | null): void {
  try {
    if (themeId) {
      localStorage.setItem(ACTIVE_CUSTOM_THEME_KEY, themeId);
    } else {
      localStorage.removeItem(ACTIVE_CUSTOM_THEME_KEY);
    }
  } catch (error) {
    console.error('Failed to set active custom theme:', error);
    throw new Error('Failed to set active custom theme');
  }
}

/**
 * Apply a custom theme to the document
 */
export function applyCustomTheme(theme: CustomTheme, mode: 'light' | 'dark'): void {
  try {
    const root = document.documentElement;
    const colors = mode === 'light' ? theme.light : theme.dark;
    
    console.log(`🎨 Applying custom theme "${theme.name}" in ${mode} mode`, colors);
    
    // Apply all color variables with !important to override any CSS class rules
    Object.entries(colors).forEach(([key, value]) => {
      const oldValue = root.style.getPropertyValue(`--${key}`);
      root.style.setProperty(`--${key}`, value, 'important');
      console.log(`Setting --${key}: ${oldValue} -> ${value}`);
    });
    
    // Add a data attribute to indicate custom theme is active
    root.setAttribute('data-custom-theme', theme.id);
    root.setAttribute('data-custom-theme-mode', mode);
    
    console.log(`✅ Custom theme "${theme.name}" applied successfully`);
  } catch (error) {
    console.error('Failed to apply custom theme:', error);
    throw new Error('Failed to apply custom theme');
  }
}

/**
 * Remove custom theme variables and restore defaults
 */
export function removeCustomTheme(): void {
  try {
    const root = document.documentElement;
    const themeVariables = [
      'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
      'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
      'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring',
      'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
      'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
      'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring'
    ];
    
    // Remove all custom theme variables
    themeVariables.forEach(variable => {
      root.style.removeProperty(`--${variable}`);
    });
    
    // Remove custom theme data attributes
    root.removeAttribute('data-custom-theme');
    root.removeAttribute('data-custom-theme-mode');
  } catch (error) {
    console.error('Failed to remove custom theme:', error);
  }
}
