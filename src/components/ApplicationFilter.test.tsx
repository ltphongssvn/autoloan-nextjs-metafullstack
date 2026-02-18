import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ApplicationFilter from './ApplicationFilter';

const openSelect = (index: number, optionText: string) => {
  const comboboxes = screen.getAllByRole('combobox');
  fireEvent.mouseDown(comboboxes[index]);
  const listbox = screen.getByRole('listbox');
  fireEvent.click(within(listbox).getByText(optionText));
};

describe('ApplicationFilter', () => {
  it('renders filter and sort controls', () => {
    render(<ApplicationFilter onFilterChange={vi.fn()} onOrderChange={vi.fn()} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  it('calls onFilterChange with status filter', () => {
    const onFilter = vi.fn();
    render(<ApplicationFilter onFilterChange={onFilter} onOrderChange={vi.fn()} />);
    openSelect(0, 'Draft');
    expect(onFilter).toHaveBeenCalledWith("status eq 'draft'");
  });

  it('calls onFilterChange with empty for all', () => {
    const onFilter = vi.fn();
    render(<ApplicationFilter onFilterChange={onFilter} onOrderChange={vi.fn()} />);
    openSelect(0, 'All Statuses');
    expect(onFilter).toHaveBeenCalledWith('');
  });

  it('calls onOrderChange', () => {
    const onOrder = vi.fn();
    render(<ApplicationFilter onFilterChange={vi.fn()} onOrderChange={onOrder} />);
    openSelect(1, 'Oldest First');
    expect(onOrder).toHaveBeenCalledWith('created_at asc');
  });
});
