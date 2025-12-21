import React, { forwardRef } from 'react';
import { TreePine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ size = 'md', showText = true, className }, ref) => {
    const sizes = {
      sm: { icon: 'w-6 h-6', container: 'w-10 h-10', text: 'text-lg' },
      md: { icon: 'w-8 h-8', container: 'w-14 h-14', text: 'text-xl' },
      lg: { icon: 'w-10 h-10', container: 'w-18 h-18', text: 'text-2xl' },
    };

    return (
      <div ref={ref} className={cn('flex items-center gap-3', className)}>
        {/* Logo Mark */}
        <div className={cn(
          'relative flex items-center justify-center rounded-xl bg-gradient-to-br from-moss-bright via-moss to-fern',
          sizes[size].container
        )}>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
          <div className="relative flex items-center">
            <TreePine className={cn(sizes[size].icon, 'text-foreground drop-shadow-md')} strokeWidth={1.5} />
          </div>
          {/* Subtle glow */}
          <div className="absolute -inset-1 rounded-xl bg-moss/20 blur-md -z-10" />
        </div>
        
        {showText && (
          <div className="flex flex-col">
            <span className={cn(
              'font-display font-bold tracking-tight text-foreground',
              sizes[size].text
            )}>
              AWW
            </span>
            <span className="text-xs text-muted-foreground tracking-wide">
              A Whittle Wandering
            </span>
          </div>
        )}
      </div>
    );
  }
);

Logo.displayName = 'Logo';

export const LogoMark = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          'relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-moss-bright via-moss to-fern',
          className
        )}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
        <TreePine className="w-7 h-7 text-foreground drop-shadow-md relative" strokeWidth={1.5} />
      </div>
    );
  }
);

LogoMark.displayName = 'LogoMark';