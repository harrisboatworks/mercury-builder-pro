import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RouteLoader } from './RouteLoader';

describe('RouteLoader', () => {
  it('shows an accessible in-system page skeleton without legacy loading copy', () => {
    render(<RouteLoader />);

    expect(screen.getByRole('status', { name: 'Loading page' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading the next page')).toHaveClass('sr-only');
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
