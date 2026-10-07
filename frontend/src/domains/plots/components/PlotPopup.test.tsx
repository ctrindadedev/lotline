import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { PlotFeature } from '../types';
import { PlotPopup } from './PlotPopup';
import { messages } from '../../../shared/i18n/messages';

const PLOT: PlotFeature = {
  type: 'Feature',
  id: 'plot-1',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-47, -22],
        [-46.999, -22],
        [-46.999, -21.999],
        [-47, -21.999],
        [-47, -22],
      ],
    ],
  },
  properties: {
    price: 150000,
    description: 'Corner plot\nNear the park',
    contact: '+55 19 99999-0000',
    createdAt: '2026-10-06T15:00:00Z',
    status: 'AVAILABLE',
    reservable: true,
    ownedByMe: false,
    reservedByMe: false,
  },
};

describe('PlotPopup', () => {
  it('shows the price, area, price per m², description, contact and listing date', () => {
    render(<PlotPopup plot={PLOT} onClose={() => {}} />);
    const popup = screen.getByRole('dialog', { name: messages.popup.label });

    expect(popup).toHaveTextContent('R$ 150.000,00');
    expect(popup).toHaveTextContent('1,15 ha · R$ 13,08/m²');
    expect(popup).toHaveTextContent('Corner plot Near the park');
    expect(popup).toHaveTextContent(`${messages.popup.contact} +55 19 99999-0000`);
    expect(popup).toHaveTextContent(messages.popup.listedOn('6 de out. de 2026'));
  });

  it('closes from its close button', async () => {
    const onClose = vi.fn<() => void>();
    render(<PlotPopup plot={PLOT} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: messages.popup.close }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('offers the actions it is given, disabled while one runs', async () => {
    const onEdit = vi.fn<() => void>();
    const onDelete = vi.fn<() => void>();
    const actions = [
      { label: messages.popup.edit, onClick: onEdit },
      { label: messages.popup.delete, onClick: onDelete, color: 'error' as const },
    ];
    const { rerender } = render(<PlotPopup plot={PLOT} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: messages.popup.edit })).not.toBeInTheDocument();

    rerender(<PlotPopup plot={PLOT} onClose={() => {}} actions={actions} />);
    await userEvent.click(screen.getByRole('button', { name: messages.popup.edit }));
    await userEvent.click(screen.getByRole('button', { name: messages.popup.delete }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();

    rerender(<PlotPopup plot={PLOT} onClose={() => {}} actions={actions} busy />);
    expect(screen.getByRole('button', { name: messages.popup.edit })).toBeDisabled();
  });

  it('shows the status from the point of view of the user asking', () => {
    const reserved = { ...PLOT.properties, status: 'RESERVED' as const };
    const { rerender } = render(<PlotPopup plot={PLOT} onClose={() => {}} />);
    expect(screen.getByText(messages.popup.status.AVAILABLE)).toBeInTheDocument();

    rerender(<PlotPopup plot={{ ...PLOT, properties: reserved }} onClose={() => {}} />);
    expect(screen.getByText(messages.popup.status.RESERVED)).toBeInTheDocument();

    rerender(
      <PlotPopup
        plot={{ ...PLOT, properties: { ...reserved, reservedByMe: true } }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(messages.popup.reservedByYou)).toBeInTheDocument();
  });

  it('asks visitors to log in to see the contact, and brings them back', async () => {
    const { contact: _hidden, ...visible } = PLOT.properties;
    function LoginSpy() {
      return <p>{JSON.stringify(useLocation().state)}</p>;
    }
    render(
      <MemoryRouter>
        <Routes>
          <Route
            path="/"
            element={<PlotPopup plot={{ ...PLOT, properties: visible }} onClose={() => {}} />}
          />
          <Route path="/login" element={<LoginSpy />} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('link', { name: messages.popup.contactHidden }));

    expect(screen.getByText('{"from":"/","reason":"seeContact"}')).toBeInTheDocument();
  });
});
