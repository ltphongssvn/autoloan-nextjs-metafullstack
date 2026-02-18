import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ApplicationFilter from './ApplicationFilter';

describe('ApplicationFilter', () => {
  it('renders filter and sort controls', () => {
    render(<ApplicationFilter onFilterChange={vi.fn()} onOrderChange={vi.fn()} />);
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort By')).toBeInTheDocument();
  });

  it('calls onFilterChange with status filter', () => {
    const onFilter = vi.fn();
    render(<ApplicationFilter onFilterChange={onFilter} onOrderChange={vi.fn()} />);
    const select = screen.getByLabelText('Status');
    const combobox = select.closest('[role="combobox"]') || select.parentElement!;
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    fireEvent.click(within(listbox).getByText('Draft'));
    expect(onFilter).toHaveBeenCalledWith("status eq 'draft'");
  });

  it('calls onFilterChange with empty for all', () => {
    const onFilter = vi.fn();
    render(<ApplicationFilter onFilterChange={onFilter} onOrderChange={vi.fn()} />);
    const select = screen.getByLabelText('Status');
    const combobox = select.closest('[role="combobox"]') || select.parentElement!;
    fireEvent.mouseDown(combobox);
    fireEvent.click(within(screen.getByRole('listbox')).getByText('All Statuses'));
    expect(onFilter).toHaveBeenCalledWith('');
  });

  it('calls onOrderChange', () => {
    const onOrder = vi.fn();
    render(<ApplicationFilter onFilterChange={vi.fn()} onOrderChange={onOrder} />);
    const select = screen.getByLabelText('Sort By');
    const combobox = select.closest('[role="combobox"]') || select.parentElement!;
    fireEvent.mouseDown(combobox);
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Oldest First'));
    expect(onOrder).toHaveBeenCalledWith('created_at asc');
  });
});
