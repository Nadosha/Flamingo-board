import { describe, it, expect } from 'vitest';
import { filterCards } from './filter-cards';
import type { ColumnWithCards } from '@/shared/types';

// Minimal card factory to keep tests readable
function makeCard(overrides: Partial<{
  id: string;
  title: string;
  due_date: string | null;
  assigneeId: string;
  labelId: string;
}> = {}) {
  return {
    id: overrides.id ?? 'card-1',
    title: overrides.title ?? 'Test card',
    column_id: 'col-1',
    position: 0,
    description: null,
    due_date: overrides.due_date ?? null,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    assignees: overrides.assigneeId
      ? [{ user_id: overrides.assigneeId, profile: null }]
      : [],
    labels: overrides.labelId
      ? [{ label_id: overrides.labelId, label: { id: overrides.labelId, name: 'Bug', color: '#eb5a46', workspace_id: 'ws-1' } }]
      : [],
  };
}

function makeColumn(cards: ReturnType<typeof makeCard>[]): ColumnWithCards {
  return {
    id: 'col-1',
    board_id: 'board-1',
    name: 'To Do',
    position: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    cards: cards as unknown as ColumnWithCards['cards'],
  };
}

// ─── Case 3: filterCards ──────────────────────────────────────────────────────

describe('filterCards', () => {
  it('returns column unchanged when no filters are active', () => {
    const col = makeColumn([makeCard(), makeCard({ id: 'card-2', title: 'Another' })]);
    const result = filterCards(col, { assigneeId: null, labelId: null, search: '', overdue: false });
    expect(result.cards).toHaveLength(2);
  });

  it('filters cards by search query (case-insensitive)', () => {
    const col = makeColumn([
      makeCard({ id: 'card-1', title: 'Fix login bug' }),
      makeCard({ id: 'card-2', title: 'Design homepage' }),
      makeCard({ id: 'card-3', title: 'Write LOGIN docs' }),
    ]);
    const result = filterCards(col, { assigneeId: null, labelId: null, search: 'login', overdue: false });
    expect(result.cards).toHaveLength(2);
    expect(result.cards.map((c) => c.id)).toEqual(['card-1', 'card-3']);
  });

  it('filters cards by assignee ID', () => {
    const col = makeColumn([
      makeCard({ id: 'card-1', assigneeId: 'user-alice' }),
      makeCard({ id: 'card-2', assigneeId: 'user-bob' }),
      makeCard({ id: 'card-3' }),
    ]);
    const result = filterCards(col, { assigneeId: 'user-alice', labelId: null, search: '', overdue: false });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].id).toBe('card-1');
  });

  it('filters overdue cards (excludes cards without due_date or future dates)', () => {
    const past = new Date(Date.now() - 2 * 86_400_000).toISOString();  // 2 days ago
    const future = new Date(Date.now() + 2 * 86_400_000).toISOString(); // 2 days ahead
    const col = makeColumn([
      makeCard({ id: 'card-1', due_date: past }),
      makeCard({ id: 'card-2', due_date: future }),
      makeCard({ id: 'card-3', due_date: null }),
    ]);
    const result = filterCards(col, { assigneeId: null, labelId: null, search: '', overdue: true });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].id).toBe('card-1');
  });

  it('combines multiple filters with AND logic', () => {
    const past = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const col = makeColumn([
      makeCard({ id: 'card-1', title: 'Bug fix',    assigneeId: 'user-alice', due_date: past }),
      makeCard({ id: 'card-2', title: 'Bug report', assigneeId: 'user-bob',   due_date: past }),
      makeCard({ id: 'card-3', title: 'Bug fix',    assigneeId: 'user-alice', due_date: null }),
    ]);
    const result = filterCards(col, {
      assigneeId: 'user-alice',
      labelId: null,
      search: 'bug',
      overdue: true,
    });
    // Only card-1 matches: correct assignee + contains "bug" + overdue
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].id).toBe('card-1');
  });
});
