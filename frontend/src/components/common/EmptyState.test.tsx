import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';
import { Heart } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No data available" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="No data"
        description="Start by adding some items"
      />
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Start by adding some items')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="No data" />);
    const descriptions = container.querySelectorAll('.text-muted-foreground');
    expect(descriptions.length).toBe(0);
  });

  it('renders icon when provided', () => {
    const { container } = render(
      <EmptyState
        title="No favorites"
        icon={<Heart data-testid="heart-icon" className="h-8 w-8" />}
      />
    );
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
  });

  it('does not render icon when icon not provided', () => {
    render(<EmptyState title="No data" />);
    expect(screen.queryByTestId('heart-icon')).not.toBeInTheDocument();
  });
});
