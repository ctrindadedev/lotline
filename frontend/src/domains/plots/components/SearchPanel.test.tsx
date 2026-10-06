import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  EMPTY_SEARCH_FILTERS,
  searchFiltersResolver,
  type SearchFilterValues,
} from '../utils/searchFilters';
import { SearchPanel } from './SearchPanel';

interface HarnessProps {
  capped?: boolean;
  onValid: (values: SearchFilterValues) => void;
  onClearFilters: () => void;
  onNewSearch: () => void;
}

function Harness({ capped = false, onValid, ...rest }: HarnessProps) {
  const form = useForm<SearchFilterValues>({
    defaultValues: EMPTY_SEARCH_FILTERS,
    resolver: searchFiltersResolver,
  });
  return (
    <SearchPanel
      form={form}
      radius="1.5 km"
      capped={capped}
      status="2 plots reach into this circle."
      onApplyFilters={form.handleSubmit(onValid)}
      {...rest}
    />
  );
}

function renderPanel(capped = false) {
  const handlers = {
    onValid: vi.fn<(values: SearchFilterValues) => void>(),
    onClearFilters: vi.fn<() => void>(),
    onNewSearch: vi.fn<() => void>(),
  };
  render(<Harness capped={capped} {...handlers} />);
  return handlers;
}

describe('SearchPanel', () => {
  it('shows the radius and how many plots were found', () => {
    renderPanel();

    expect(screen.getByText('Radius: 1.5 km')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 plots reach into this circle.');
    expect(screen.queryByText(/limited to/)).not.toBeInTheDocument();
  });

  it('says when the radius was limited', () => {
    renderPanel(true);

    expect(screen.getByText('Searches are limited to 50.0 km.')).toBeInTheDocument();
  });

  it('applies valid filters', async () => {
    const { onValid } = renderPanel();

    await userEvent.type(screen.getByRole('textbox', { name: 'Max price' }), '200000');
    await userEvent.type(screen.getByRole('textbox', { name: 'Min area' }), '500');
    await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(onValid).toHaveBeenCalledWith(
      { minPrice: '', maxPrice: '200000', minArea: '500', maxArea: '' },
      expect.anything(),
    );
  });

  it('blocks a maximum below its minimum', async () => {
    const { onValid } = renderPanel();

    await userEvent.type(screen.getByRole('textbox', { name: 'Min price' }), '300');
    await userEvent.type(screen.getByRole('textbox', { name: 'Max price' }), '100');
    await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(onValid).not.toHaveBeenCalled();
    expect(screen.getByText('Must not be below the minimum.')).toBeInTheDocument();
  });

  it('clears the filters and starts a new circle', async () => {
    const { onClearFilters, onNewSearch } = renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await userEvent.click(screen.getByRole('button', { name: 'Draw a new circle' }));

    expect(onClearFilters).toHaveBeenCalledOnce();
    expect(onNewSearch).toHaveBeenCalledOnce();
  });
});
