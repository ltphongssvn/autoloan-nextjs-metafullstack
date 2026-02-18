import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusChip from './StatusChip';

describe('StatusChip', () => {
  it('renders mapped label for known status', () => {
    render(<StatusChip status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders all known statuses', () => {
    const statuses = ['draft', 'submitted', 'pending', 'under_review', 'pending_documents', 'approved', 'rejected'];
    const labels = ['Draft', 'Submitted', 'Pending', 'Under Review', 'Pending Documents', 'Approved', 'Rejected'];
    statuses.forEach((status, i) => {
      const { unmount } = render(<StatusChip status={status} />);
      expect(screen.getByText(labels[i])).toBeInTheDocument();
      unmount();
    });
  });

  it('falls back to raw status string for unknown status', () => {
    render(<StatusChip status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });
});
