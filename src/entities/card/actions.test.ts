import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLabelAction } from './actions';

// ─── Case 4: createLabelAction ────────────────────────────────────────────────
//
// Server actions talk to Supabase — we stub both clients so tests run without
// a live database.  This verifies our action's branching logic in isolation.

const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockFrom = vi.fn();

vi.mock('@/shared/lib/supabase/server', () => ({
  // createClient — returns fake auth with a logged-in user
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({ data: { user: { id: 'user-1' } } })
        ),
      },
    })
  ),
  // createAdminClient — intercepts .from() calls
  createAdminClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('createLabelAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { error } when the board is not found', async () => {
    // First .from('boards') query returns nothing
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null })),
        })),
      })),
    });

    const result = await createLabelAction('non-existent-board', 'Bug', '#eb5a46');
    expect(result).toEqual({ error: 'Board not found' });
  });

  it('returns { error } when Supabase insert fails', async () => {
    // boards query succeeds
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { workspace_id: 'ws-1' } })),
        })),
      })),
    });
    // labels insert fails
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'duplicate key' } });
    mockFrom.mockReturnValueOnce({ insert: mockInsert });

    const result = await createLabelAction('board-1', 'Bug', '#eb5a46');
    expect(result).toEqual({ error: 'duplicate key' });
  });

  it('returns { label } with trimmed name on success', async () => {
    const created = { id: 'label-99', name: 'Feature', color: '#61bd4f' };

    // boards query succeeds
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { workspace_id: 'ws-1' } })),
        })),
      })),
    });
    // labels insert succeeds
    mockSingle.mockResolvedValueOnce({ data: created, error: null });
    mockFrom.mockReturnValueOnce({ insert: mockInsert });

    const result = await createLabelAction('board-1', '  Feature  ', '#61bd4f');
    expect(result).toEqual({ label: created });
  });
});
