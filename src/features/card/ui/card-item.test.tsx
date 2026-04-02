import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardItem } from './card-item';
import type { CardWithRelations } from '@/shared/types';

// ─── Case 5: CardItem component ───────────────────────────────────────────────
//
// CardItem is wrapped in react-beautiful-dnd <Draggable> and uses portals.
// We mock the DnD library to a thin passthrough so tests only verify
// the card's own rendering and interaction logic.

vi.mock('@hello-pangea/dnd', () => ({
  Draggable: ({ children }: { children: (provided: unknown, snapshot: unknown) => React.ReactNode }) =>
    children(
      { innerRef: () => {}, draggableProps: {}, dragHandleProps: {} },
      { isDragging: false },
    ),
}));

vi.mock('@/entities/card/actions', () => ({
  deleteCardAction: vi.fn(() => Promise.resolve()),
}));

// Minimal card factory
function makeCard(overrides: Partial<CardWithRelations> = {}): CardWithRelations {
  return {
    id: 'card-1',
    column_id: 'col-1',
    title: 'Test card title',
    description: null,
    position: 0,
    due_date: null,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    assignees: [],
    labels: [],
    ...overrides,
  };
}

describe('CardItem', () => {
  it('renders the card title', () => {
    render(
      <CardItem card={makeCard({ title: 'Deploy to production' })} index={0} onClick={vi.fn()} onDeleted={vi.fn()} />
    );
    expect(screen.getByText('Deploy to production')).toBeInTheDocument();
  });

  it('renders a color swatch for each label', () => {
    const card = makeCard({
      labels: [
        { label_id: 'l-1', label: { id: 'l-1', workspace_id: 'ws-1', name: 'Bug', color: '#eb5a46' } },
        { label_id: 'l-2', label: { id: 'l-2', workspace_id: 'ws-1', name: 'Feature', color: '#61bd4f' } },
      ],
    });
    const { container } = render(
      <CardItem card={card} index={0} onClick={vi.fn()} onDeleted={vi.fn()} />
    );
    const swatches = container.querySelectorAll('[title]');
    const labelSwatches = Array.from(swatches).filter(
      (el) => (el as HTMLElement).style.backgroundColor !== '',
    );
    expect(labelSwatches).toHaveLength(2);
  });

  it('applies overdue styling when due_date is in the past', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString(); // yesterday
    const { container } = render(
      <CardItem card={makeCard({ due_date: past })} index={0} onClick={vi.fn()} onDeleted={vi.fn()} />
    );
    const dueBadge = container.querySelector('[class*="destructive"]');
    expect(dueBadge).not.toBeNull();
  });

  it('calls onClick when the card is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CardItem card={makeCard()} index={0} onClick={onClick} onDeleted={vi.fn()} />);
    await user.click(screen.getByText('Test card title'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
