import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders default title and message', () => {
    render(<EmptyState />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display.')).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    render(<EmptyState title="No apps" message="Start a new application" />);
    expect(screen.getByText('No apps')).toBeInTheDocument();
    expect(screen.getByText('Start a new application')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onAction = vi.fn();
    render(<EmptyState actionLabel="Create" onAction={onAction} />);
    fireEvent.click(screen.getByText('Create'));
    expect(onAction).toHaveBeenCalled();
  });

  it('does not render button without actionLabel', () => {
    render(<EmptyState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<EmptyState icon={<span data-testid="custom-icon">★</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
