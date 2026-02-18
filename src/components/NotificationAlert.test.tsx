import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationAlert from './NotificationAlert';

describe('NotificationAlert', () => {
  it('renders message when open', () => {
    render(<NotificationAlert message="Saved!" severity="success" open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<NotificationAlert message="Hidden" open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('calls onClose on dismiss', () => {
    const onClose = vi.fn();
    render(<NotificationAlert message="Test" severity="error" open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders with default severity', () => {
    render(<NotificationAlert message="Info" open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
