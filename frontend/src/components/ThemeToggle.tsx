import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'system') {
      // If currently system, switch to opposite of current resolved theme
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      // If explicitly set to light or dark, return to following system preference
      setTheme('system');
    }
  };

  // Determine what action will happen when clicked
  const getAriaLabel = () => {
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
    return 'Switch to system theme';
  };

  const getTitle = () => {
    if (theme === 'system') {
      return `Following system (${resolvedTheme}). Click to switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode.`;
    }
    return `${theme} mode. Click to follow system preference.`;
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={getAriaLabel()}
      title={getTitle()}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
