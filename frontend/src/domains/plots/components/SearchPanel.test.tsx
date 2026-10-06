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
import { messages } from '../../../shared/i18n/messages';

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
      radius="1,5 km"
      capped={capped}
      status={messages.search.count(2)}
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

    expect(screen.getByText(messages.search.radius('1,5 km'))).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(messages.search.count(2));
    expect(screen.queryByText(messages.search.capped('50,0 km'))).not.toBeInTheDocument();
  });

  it('says when the radius was limited', () => {
    renderPanel(true);

    expect(screen.getByText(messages.search.capped('50,0 km'))).toBeInTheDocument();
  });

  it('applies valid filters', async () => {
    const { onValid } = renderPanel();

    await userEvent.type(screen.getByRole('textbox', { name: messages.search.maxPrice }), '200000');
    await userEvent.type(screen.getByRole('textbox', { name: messages.search.minArea }), '500');
    await userEvent.click(screen.getByRole('button', { name: messages.search.apply }));

    expect(onValid).toHaveBeenCalledWith(
      { minPrice: '', maxPrice: '200000', minArea: '500', maxArea: '' },
      expect.anything(),
    );
  });

  it('blocks a maximum below its minimum', async () => {
    const { onValid } = renderPanel();

    await userEvent.type(screen.getByRole('textbox', { name: messages.search.minPrice }), '300');
    await userEvent.type(screen.getByRole('textbox', { name: messages.search.maxPrice }), '100');
    await userEvent.click(screen.getByRole('button', { name: messages.search.apply }));

    expect(onValid).not.toHaveBeenCalled();
    expect(screen.getByText(messages.searchFilters.maxBelowMin)).toBeInTheDocument();
  });

  it('clears the filters and starts a new circle', async () => {
    const { onClearFilters, onNewSearch } = renderPanel();

    await userEvent.click(screen.getByRole('button', { name: messages.search.clear }));
    await userEvent.click(screen.getByRole('button', { name: messages.search.newCircle }));

    expect(onClearFilters).toHaveBeenCalledOnce();
    expect(onNewSearch).toHaveBeenCalledOnce();
  });
});
