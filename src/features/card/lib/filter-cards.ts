import type { ColumnWithCards } from '@/shared/types';

export interface CardFilters {
  assigneeId: string | null;
  labelId: string | null;
  search: string;
  overdue: boolean;
}

export function filterCards(column: ColumnWithCards, filters: CardFilters): ColumnWithCards {
  const hasActive =
    filters.assigneeId !== null ||
    filters.labelId !== null ||
    filters.search.trim() !== '' ||
    filters.overdue;

  if (!hasActive) return column;

  const query = filters.search.trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    ...column,
    cards: column.cards.filter((card) => {
      if (query && !card.title.toLowerCase().includes(query)) return false;
      if (filters.assigneeId && !card.assignees?.some((a) => a.user_id === filters.assigneeId)) return false;
      if (filters.labelId && !card.labels?.some((l) => l.label_id === filters.labelId)) return false;
      if (filters.overdue) {
        if (!card.due_date) return false;
        if (new Date(card.due_date) >= today) return false;
      }
      return true;
    }),
  };
}
