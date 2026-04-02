import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLabelAction } from './actions';

// ─── createLabelAction ────────────────────────────────────────────────────────
// Server actions delegate to labelsApi — stub it so tests run without a server.

const mockCreate = vi.fn();

vi.mock('@/shared/lib/api/client', () => ({
  labelsApi: { create: (...args: unknown[]) => mockCreate(...args) },
  boardsApi: {},
  cardsApi: {},
  ApiError: class ApiError extends Error { constructor(public status: number, message: string) { super(message); } },
}));

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('createLabelAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { error } when the API throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Network error'));

    const result = await createLabelAction('board-1', 'Bug', '#eb5a46');
    expect(result).toEqual({ error: 'Network error' });
  });

  it('returns { label } on success', async () => {
    const created = { id: 'label-99', name: 'Feature', color: '#61bd4f', workspace_id: 'ws-1' };
    mockCreate.mockResolvedValueOnce(created);

    const result = await createLabelAction('board-1', '  Feature  ', '#61bd4f');
    expect(result).toEqual({ label: created });
  });
});

