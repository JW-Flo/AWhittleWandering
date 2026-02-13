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
  const getNextTheme = () => {
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? 'light' : 'dark';
    }
    return 'system';
  };

  const nextTheme = getNextTheme();
  const ariaLabel = nextTheme === 'system' 
    ? 'Switch to system theme' 
    : `Switch to ${nextTheme} mode`;

  const title = theme === 'system'
    ? `Following system (${resolvedTheme}). Click to switch to ${nextTheme} mode.`
    : `${theme} mode. Click to follow system preference.`;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      title={title}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
