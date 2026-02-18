import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders title and message', () => {
    render(<ConfirmDialog open={true} title="Delete?" message="Are you sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onConfirm on confirm click', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open={true} title="T" message="M" onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel on cancel click', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open={true} title="T" message="M" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<ConfirmDialog open={true} title="T" message="M" onConfirm={vi.fn()} onCancel={vi.fn()} loading={true} />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('uses custom labels', () => {
    render(<ConfirmDialog open={true} title="T" message="M" confirmLabel="Yes" cancelLabel="No" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmDialog open={false} title="Hidden" message="M" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });
});
