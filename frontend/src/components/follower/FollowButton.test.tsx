import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FollowButton from './FollowButton';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('FollowButton', () => {
  const apiBaseUrl = 'https://api.test.com';
  const journeyId = 'test-journey';

  beforeEach(() => {
    mockToast.mockClear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders follow button initially', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, following: false, followerCount: 0 }),
    });

    render(<FollowButton journeyId={journeyId} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });
  });

  it('shows following state when already following', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, following: true, followerCount: 5 }),
    });

    render(<FollowButton journeyId={journeyId} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.getByText('Following')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('shows loading state when toggling follow', async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, following: false, followerCount: 0 }),
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({ ok: true, following: true, followerCount: 1 }),
                }),
              100
            )
          )
      );

    render(<FollowButton journeyId={journeyId} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(button).toBeDisabled();
  });

  it('toggles follow status successfully', async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, following: false, followerCount: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, following: true, followerCount: 1 }),
      });

    render(<FollowButton journeyId={journeyId} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Following',
        description: expect.stringContaining('following this journey'),
      });
    });
  });

  it('handles 401 error with sign in message', async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, following: false, followerCount: 0 }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

    render(<FollowButton journeyId={journeyId} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sign in required',
        description: expect.stringContaining('Sign in to follow'),
        variant: 'destructive',
      });
    });
  });

  it('handles network error gracefully', async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, following: false, followerCount: 0 }),
      })
      .mockRejectedValueOnce(new Error('Network error'));

    render(<FollowButton journeyId={journeyId} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Network error',
        description: expect.stringContaining('Could not reach the server'),
        variant: 'destructive',
      });
    });
  });

  it('handles generic API error', async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, following: false, followerCount: 0 }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    render(<FollowButton journeyId={journeyId} apiBaseUrl={apiBaseUrl} />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Something went wrong',
        description: expect.stringContaining('Unable to follow'),
        variant: 'destructive',
      });
    });
  });
});
